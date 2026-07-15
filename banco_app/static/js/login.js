// Login: contraseña (1er factor) + segundo factor segun el modo elegido.
//   Modo A -> verificacion facial (insegura, sin liveness) contra tu propia cara.
//   Modo B -> FIDO2 / WebAuthn.
(function () {
  const modeOptions = document.querySelectorAll(".mode-switch__option");
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");

  let selectedMode = "modo_a";

  function selectMode(mode) {
    selectedMode = mode;
    modeOptions.forEach((option) => {
      option.classList.toggle("active", option.dataset.mode === mode);
    });
    errorBox.classList.remove("visible");
  }

  modeOptions.forEach((option) => {
    option.addEventListener("click", () => selectMode(option.dataset.mode));
  });

  selectMode("modo_a");

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
        body: JSON.stringify({ email, password, mode: selectedMode }),
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
