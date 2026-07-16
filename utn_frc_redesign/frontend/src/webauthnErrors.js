// Traduce las excepciones que puede lanzar navigator.credentials.create()/get()
// a mensajes en español que un usuario final pueda entender. La Web Authentication
// API estandariza estos nombres de DOMException (ver spec de WHATWG/W3C) - no son
// strings arbitrarios, son contratos que todo navegador respeta.
const MESSAGES = {
  NotAllowedError:
    "Cancelaste la verificación o se agotó el tiempo de espera. Podés reintentar o volver a ingresar con tu contraseña.",
  NotSupportedError:
    "Tu dispositivo o navegador no admite este método de seguridad (FIDO2/WebAuthn).",
  SecurityError:
    "No se pudo verificar por un problema de seguridad del sitio (origen o conexión no válida).",
  AbortError: "Se canceló la operación antes de completarse.",
  InvalidStateError:
    "Ese dispositivo ya está registrado o no está en un estado válido para esta acción.",
  ConstraintError:
    "Tu dispositivo no cumple los requisitos solicitados (por ejemplo, verificación de usuario).",
};

const FALLBACK_MESSAGE = "No se pudo completar la verificación. Intentá de nuevo.";

// `err.name` es la propiedad estandarizada de DOMException; `err.message` es
// texto libre de cada navegador (a veces en inglés, siempre técnico) que no
// deberíamos mostrarle tal cual a un usuario final.
export function translateWebAuthnError(err) {
  if (!err) return FALLBACK_MESSAGE;
  return MESSAGES[err.name] || FALLBACK_MESSAGE;
}

// Distingue "el usuario no tiene forma de usar FIDO2 acá" (soporte ausente o
// cancelación) de otros errores, para que la UI pueda decidir si vale la pena
// ofrecer un botón de "reintentar" o directamente guiar de vuelta a la
// contraseña (Modo A).
export function isRecoverableWebAuthnError(err) {
  return err && (err.name === "NotAllowedError" || err.name === "AbortError");
}
