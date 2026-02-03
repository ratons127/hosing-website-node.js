const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const postForm = async (url, payload) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
};

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = document.getElementById("loginError");
    error.textContent = "";

    const payload = Object.fromEntries(new FormData(loginForm).entries());
    try {
      await postForm("/api/login", payload);
      window.location.href = "/";
    } catch (err) {
      error.textContent = err.message;
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = document.getElementById("registerError");
    error.textContent = "";

    const payload = Object.fromEntries(new FormData(registerForm).entries());
    try {
      await postForm("/api/register", payload);
      window.location.href = "/";
    } catch (err) {
      error.textContent = err.message;
    }
  });
}
