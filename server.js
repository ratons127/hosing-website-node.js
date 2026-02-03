const path = require("path");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "zenexcloud-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" },
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ ok: false });
  }
  return res.json({ ok: true, user: req.session.user });
});

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, error: "Missing fields." });
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (existing.length) {
      return res.status(409).json({ ok: false, error: "Email already in use." });
    }

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hash]
    );

    req.session.user = { id: result.insertId, name, email };
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Server error." });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Missing fields." });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ ok: false, error: "Invalid credentials." });
    }

    const user = rows[0];
    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ ok: false, error: "Invalid credentials." });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email };
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Server error." });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.listen(port, () => {
  console.log(`Zenexcloud frontend running at http://localhost:${port}`);
});
