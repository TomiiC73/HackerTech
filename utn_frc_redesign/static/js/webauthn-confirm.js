// Paso 2 del Modo B: confirmar con FIDO2 al usuario ya identificado por
// legajo + dominio + contraseña (ver app.py /api/login/mfa y /webauthn).
(function () {
  const btn = document.getElementById("webauthn-confirm-btn");
  const statusLine = document.getElementById("webauthn-status");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    statusLine.textContent = "Confirmá en tu dispositivo...";
    statusLine.className = "status-line mt-5";

    const result = await window.loginWithPasskey();
    if (result.ok) {
      statusLine.textContent = "¡Listo! Entrando...";
      statusLine.className = "status-line mt-5 success";
      window.location.href = result.next;
    } else {
      statusLine.textContent = "No se pudo confirmar: " + result.error;
      statusLine.className = "status-line mt-5 error";
      btn.disabled = false;
    }
  });
})();
