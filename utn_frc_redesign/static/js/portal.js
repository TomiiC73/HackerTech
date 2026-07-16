// Portal: registrar una passkey para poder ingresar despues sin contraseña.
//
// Las 3 botones (huella / PIN / rostro) son solo una guia visual para el
// usuario - los tres disparan EXACTAMENTE el mismo registro WebAuthn real
// (window.registerPasskey(), definido en webauthn-common.js), que le pide
// al navegador un autenticador de plataforma (authenticatorAttachment:
// "platform", ver webauthn_auth.py). Es el sistema operativo el que decide
// que pedir segun lo que el dispositivo tenga configurado: si el usuario
// toca "Huella" pero su equipo solo tiene reconocimiento facial, Windows
// Hello va a pedir la cara igual - es esperado, la app no puede forzar
// que biometria especifica usa el SO.
(function () {
  const buttons = document.querySelectorAll(".passkey-method-btn");
  if (!buttons.length) return;
  const statusLine = document.getElementById("register-status");

  const CONFIRM_TEXT = {
    huella: "Confirmá con tu huella dactilar en tu dispositivo...",
    pin: "Ingresá tu PIN de Windows Hello...",
    rostro: "Mirá a la cámara para el reconocimiento facial...",
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      buttons.forEach((b) => (b.disabled = true));
      statusLine.textContent = CONFIRM_TEXT[btn.dataset.method] || "Confirmá en tu dispositivo...";
      statusLine.className = "status-line";

      const result = await window.registerPasskey();
      if (result.ok) {
        statusLine.textContent = "¡Passkey registrada! Recargando...";
        statusLine.className = "status-line success";
        setTimeout(() => window.location.reload(), 700);
      } else {
        statusLine.textContent = "No se pudo registrar: " + result.error;
        statusLine.className = "status-line error";
        buttons.forEach((b) => (b.disabled = false));
      }
    });
  });
})();
