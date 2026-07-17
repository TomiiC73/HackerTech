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
//
// Por el mismo motivo, la app tampoco puede saber DE ANTEMANO si huella,
// PIN o rostro especificamente estan configurados - solo si hay o no un
// autenticador de plataforma en general
// (isUserVerifyingPlatformAuthenticatorAvailable). El fallback entre
// metodos es reactivo: si un intento falla/cancela, recien ahi se saca esa
// opcion de la lista y se ofrecen las que quedan.
(function () {
  const container = document.getElementById("passkey-methods");
  if (!container) return; // ya tiene passkey, o no aplica en esta pagina

  const intro = document.getElementById("passkey-intro");
  const unsupported = document.getElementById("passkey-unsupported");
  const statusLine = document.getElementById("register-status");

  const METHOD_LABELS = {
    huella: "huella dactilar",
    pin: "PIN de Windows Hello",
    rostro: "reconocimiento facial",
  };
  const CONFIRM_TEXT = {
    huella: "Confirmá con tu huella dactilar en tu dispositivo...",
    pin: "Ingresá tu PIN de Windows Hello...",
    rostro: "Mirá a la cámara para el reconocimiento facial...",
  };

  function showUnsupported() {
    intro.classList.add("hidden");
    container.classList.add("hidden");
    unsupported.classList.remove("hidden");
  }

  function showNoMethodsLeft() {
    statusLine.textContent =
      "No fue posible registrar un método de seguridad en este dispositivo. Podés intentarlo desde otro dispositivo compatible.";
    statusLine.className = "status-line error";
  }

  // Chequeo general (no distingue metodo especifico, ver comentario arriba).
  // Se reusa tanto al cargar la pagina (para ocultar todo de entrada si no
  // hay soporte) como antes de cada intento de create() (por si el chequeo
  // inicial todavia no habia resuelto cuando el usuario ya toco un boton).
  async function isPlatformAuthenticatorAvailable() {
    if (!window.PublicKeyCredential || !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      return false;
    }
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  // Saca un metodo de la lista (fallo el chequeo previo o el create() en si)
  // y ofrece los que quedan - o el mensaje final si ya no queda ninguno.
  function dropMethodAndOfferRemaining(failedBtn, failureMessage) {
    failedBtn.remove();
    const remaining = Array.from(container.querySelectorAll(".passkey-method-btn"));
    remaining.forEach((b) => (b.disabled = false));

    if (remaining.length === 0) {
      showNoMethodsLeft();
      return;
    }

    const remainingLabels = remaining.map((b) => METHOD_LABELS[b.dataset.method]);
    statusLine.textContent = `${failureMessage} ¿Querés probar con ${remainingLabels.join(" o ")}?`;
    statusLine.className = "status-line error";
  }

  // 1. Chequeo general al cargar la pagina.
  isPlatformAuthenticatorAvailable().then((available) => {
    if (!available) showUnsupported();
  });

  container.addEventListener("click", async (event) => {
    const btn = event.target.closest(".passkey-method-btn");
    if (!btn || btn.disabled) return;

    const allButtons = Array.from(container.querySelectorAll(".passkey-method-btn"));
    allButtons.forEach((b) => (b.disabled = true));

    // Re-chequeo antes de llamar a create(): si no hay ningun autenticador
    // de plataforma, ni siquiera intentamos la ceremonia WebAuthn - se
    // trata igual que un intento fallido de ESTE metodo (nunca un error
    // generico) y se ofrecen los otros dos.
    statusLine.textContent = "Verificando disponibilidad...";
    statusLine.className = "status-line";
    const available = await isPlatformAuthenticatorAvailable();
    if (!available) {
      dropMethodAndOfferRemaining(btn, "No se detectó un método de autenticación biométrica en este dispositivo.");
      return;
    }

    statusLine.textContent = CONFIRM_TEXT[btn.dataset.method] || "Confirmá en tu dispositivo...";
    statusLine.className = "status-line";

    const result = await window.registerPasskey();
    if (result.ok) {
      // Exito: el SO pudo haber resuelto con un metodo distinto al elegido
      // (p.ej. tocaste "Huella" pero el equipo solo tiene PIN configurado)
      // - eso es esperado (ver comentario arriba) y sigue contando como
      // registro valido, no como fallo.
      statusLine.textContent = "¡Passkey registrada! Recargando...";
      statusLine.className = "status-line success";
      setTimeout(() => window.location.reload(), 700);
      return;
    }

    // 2/3. Fallback reactivo: recien con el intento fallido sabemos que ESE
    // metodo no funciono aca - se saca de la lista (no un error generico)
    // y se ofrecen los que quedan.
    dropMethodAndOfferRemaining(btn, `No pudimos usar ${METHOD_LABELS[btn.dataset.method]} en este dispositivo.`);
  });
})();
