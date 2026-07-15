// Cliente de la API de Flask (ver ../app.py). Todas las rutas son
// relativas ("/api/...") y en dev pasan por el proxy de Vite (ver
// vite.config.js), asi que nunca hace falta lidiar con CORS ni con un
// host absoluto distinto entre dev y produccion.

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

export function getHome() {
  return fetch("/api/home").then((r) => r.json());
}

export function login({ legajo, domain, password }) {
  return postJson("/api/login", { legajo, domain, password });
}

export function loginMfa({ legajo, domain, password }) {
  return postJson("/api/login/mfa", { legajo, domain, password });
}

// --- WebAuthn: helpers base64url + ceremonia completa de confirmacion ---
// Misma logica que ../static/js/webauthn-common.js (backend sin cambios),
// solo reescrita en JS moderno para el frontend React.

function base64urlToBuffer(base64url) {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) buffer[i] = raw.charCodeAt(i);
  return buffer.buffer;
}

function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeRequestOptions(optionsJson) {
  optionsJson.challenge = base64urlToBuffer(optionsJson.challenge);
  if (optionsJson.allowCredentials) {
    optionsJson.allowCredentials = optionsJson.allowCredentials.map((cred) => ({
      ...cred,
      id: base64urlToBuffer(cred.id),
    }));
  }
  return optionsJson;
}

function decodeCreationOptions(optionsJson) {
  optionsJson.challenge = base64urlToBuffer(optionsJson.challenge);
  optionsJson.user.id = base64urlToBuffer(optionsJson.user.id);
  if (optionsJson.excludeCredentials) {
    optionsJson.excludeCredentials = optionsJson.excludeCredentials.map((cred) => ({
      ...cred,
      id: base64urlToBuffer(cred.id),
    }));
  }
  return optionsJson;
}

// Paso 2 del Modo B: confirma con FIDO2 al usuario ya identificado por
// legajo+dominio+contraseña (session pre_auth en el backend).
export async function confirmWithPasskey() {
  if (!window.PublicKeyCredential) {
    return { ok: false, error: "Este navegador no soporta passkeys." };
  }
  try {
    const optionsJson = await fetch("/api/webauthn/authenticate/begin", { method: "POST" }).then((r) => r.json());
    const publicKey = decodeRequestOptions(optionsJson);

    const credential = await navigator.credentials.get({ publicKey });
    const assertionResponse = credential.response;
    const credentialJson = {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: credential.type,
      clientExtensionResults: credential.getClientExtensionResults ? credential.getClientExtensionResults() : {},
      response: {
        clientDataJSON: bufferToBase64url(assertionResponse.clientDataJSON),
        authenticatorData: bufferToBase64url(assertionResponse.authenticatorData),
        signature: bufferToBase64url(assertionResponse.signature),
        userHandle: assertionResponse.userHandle ? bufferToBase64url(assertionResponse.userHandle) : null,
      },
    };

    const result = await postJson("/api/webauthn/authenticate/complete", credentialJson);
    return result.ok ? { ok: true, next: result.next } : { ok: false, error: result.error };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Registrar una passkey nueva (requiere estar logueado ya). No la usa el
// LoginCard, pero queda lista para un futuro "Mi portal" en React.
export async function registerPasskey() {
  if (!window.PublicKeyCredential) {
    return { ok: false, error: "Este navegador no soporta passkeys." };
  }
  try {
    const optionsJson = await fetch("/api/webauthn/register/begin", { method: "POST" }).then((r) => r.json());
    const publicKey = decodeCreationOptions(optionsJson);

    const credential = await navigator.credentials.create({ publicKey });
    const attestationResponse = credential.response;
    const credentialJson = {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: credential.type,
      clientExtensionResults: credential.getClientExtensionResults ? credential.getClientExtensionResults() : {},
      response: {
        clientDataJSON: bufferToBase64url(attestationResponse.clientDataJSON),
        attestationObject: bufferToBase64url(attestationResponse.attestationObject),
      },
    };

    const result = await postJson("/api/webauthn/register/complete", credentialJson);
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
