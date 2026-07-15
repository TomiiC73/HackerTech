// Portal: registrar una passkey para poder ingresar despues sin contraseña.
(function () {
  const btn = document.getElementById("register-passkey-btn");
  if (!btn) return;
  const statusLine = document.getElementById("register-status");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    statusLine.textContent = "Confirmá en tu dispositivo (Windows Hello / Touch ID)...";
    statusLine.className = "status-line";

    const result = await window.registerPasskey();
    if (result.ok) {
      statusLine.textContent = "¡Passkey registrada! Recargando...";
      statusLine.className = "status-line success";
      setTimeout(() => window.location.reload(), 700);
    } else {
      statusLine.textContent = "No se pudo registrar: " + result.error;
      statusLine.className = "status-line error";
      btn.disabled = false;
    }
  });
})();
