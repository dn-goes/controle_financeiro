// Verifica login em cada página
document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("user");

  if (window.location.pathname.includes("login.html")) {
    // Página de login
    const form = document.getElementById("loginForm");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      if (email && password) {
        localStorage.setItem("user", email);
        window.location.href = "index.html";
      } else {
        alert("Preencha todos os campos!");
      }
    });
  } else {
    // Outras páginas
    if (!user) {
      window.location.href = "login.html";
    }

    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn?.addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }
});
