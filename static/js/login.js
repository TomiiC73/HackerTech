// Login: alterna entre Modo A (rostro) y Modo B (email + contrasena -> FIDO2).
(function () {
  const modeOptions = document.querySelectorAll(".mode-switch__option");
  const paneModoA = document.getElementById("pane-modo_a");
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");

  function selectMode(mode) {
    modeOptions.forEach((option) => {
      option.classList.toggle("active", option.dataset.mode === mode);
    });
    const isFace = mode === "modo_a";
    paneModoA.style.display = isFace ? "" : "none";
    form.style.display = isFace ? "none" : "";
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
