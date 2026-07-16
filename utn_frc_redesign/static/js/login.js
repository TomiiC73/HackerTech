// Login unico: legajo + dominio + contraseña. El backend decide a donde
// redirigir (/portal directo si es el primer ingreso sin passkey, o
// /webauthn si ya tiene una y hay que confirmarla como segundo factor).
(function () {
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");
  const fields = ["legajo", "domain", "password"].map((id) => document.getElementById(id));

  function setFieldInvalid(input, invalid) {
    input.setAttribute("aria-invalid", String(invalid));
    input.classList.toggle("border-coral-400", invalid);
    input.classList.toggle("ring-2", invalid);
    input.classList.toggle("ring-coral-400/30", invalid);
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
    fields.forEach((field) => setFieldInvalid(field, true));
  }
  function clearError() {
    errorBox.classList.add("hidden");
    fields.forEach((field) => setFieldInvalid(field, false));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();
    submitBtn.disabled = true;
    const originalContent = submitBtn.innerHTML;
    submitBtn.textContent = "Verificando...";

    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!result.ok) {
        showError(result.error || "No se pudo iniciar sesión.");
        return;
      }
      window.location.href = result.next;
    } catch (err) {
      showError("Error de conexión con el servidor.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalContent;
    }
  });
})();
