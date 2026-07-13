// Helper reutilizable para registrar una credencial FIDO2 con un metodo dado.
// Lo usa el alta de cuenta (signup.js). Expone window.registerWebAuthnMethod(method)
// que devuelve { ok, error }.
(function () {
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

  window.registerWebAuthnMethod = async function (method) {
    if (!window.PublicKeyCredential) {
      return { ok: false, error: "Este navegador no soporta WebAuthn." };
    }
    try {
      const beginResponse = await fetch("/api/webauthn/register/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const optionsJson = await beginResponse.json();
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

      const completeResponse = await fetch("/api/webauthn/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentialJson),
      });
      const result = await completeResponse.json();
      return result.ok ? { ok: true } : { ok: false, error: result.error };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };
})();
