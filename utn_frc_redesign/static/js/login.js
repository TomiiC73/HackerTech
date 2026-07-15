// Login: dos opciones claramente diferenciadas, con un patron de tabs ARIA
// accesible (rol tab/tabpanel, teclado con flechas).
//   - Tradicional: legajo + dominio + contraseña, un solo factor.
//   - Modo B: la misma identificación + confirmación FIDO2 obligatoria
//     (la confirmación en si ocurre en /webauthn, ver webauthn-confirm.js).
(function () {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panes = {
    password: document.getElementById("pane-password"),
    mfa: document.getElementById("pane-mfa"),
  };

  function selectTab(tabName) {
    tabs.forEach((tab) => {
      const active = tab.dataset.tab === tabName;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panes.password.hidden = tabName !== "password";
    panes.mfa.hidden = tabName !== "mfa";
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab.dataset.tab));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const nextIndex = event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : (index - 1 + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      selectTab(tabs[nextIndex].dataset.tab);
    });
  });

  function setFieldInvalid(input, invalid) {
    if (!input) return;
    input.setAttribute("aria-invalid", String(invalid));
    input.classList.toggle("border-coral-400", invalid);
    input.classList.toggle("ring-2", invalid);
    input.classList.toggle("ring-coral-400/30", invalid);
  }

  function wireForm({ formId, errorId, submitId, fieldIds, endpoint }) {
    const form = document.getElementById(formId);
    const errorBox = document.getElementById(errorId);
    const submitBtn = document.getElementById(submitId);
    const fields = fieldIds.map((id) => document.getElementById(id));

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
        const response = await fetch(endpoint, {
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
  }

  wireForm({
    formId: "password-form",
    errorId: "password-error",
    submitId: "password-submit",
    fieldIds: ["legajo", "domain", "password"],
    endpoint: "/api/login",
  });

  wireForm({
    formId: "mfa-form",
    errorId: "mfa-error",
    submitId: "mfa-submit",
    fieldIds: ["mfa-legajo", "mfa-domain", "mfa-password"],
    endpoint: "/api/login/mfa",
  });
})();
