// Login: contraseña (1er factor) + verificacion facial (2do factor,
// insegura y sin liveness a proposito).
(function () {
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.remove("visible");
    submitBtn.disabled = true;
    submitBtn.textContent = "Verificando...";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!data.ok) {
        errorBox.textContent = data.error || "No se pudo iniciar sesión.";
        errorBox.classList.add("visible");
        return;
      }

      window.location.href = data.next;
    } catch (err) {
      errorBox.textContent = "Error de conexión con el servidor.";
      errorBox.classList.add("visible");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Continuar";
    }
  });
})();
