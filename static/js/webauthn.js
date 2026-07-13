// Modo B: flujo FIDO2 / WebAuthn real usando la API nativa del navegador.
//
// La firma criptografica ocurre localmente, en el autenticador de
// plataforma (Windows Hello / Touch ID): solo esa firma -nunca la
// biometria- viaja al servidor.
(function () {
  const statusLine = document.getElementById("webauthn-status");
  const actionBtn = document.getElementById("webauthn-action");
  const hasCredential = window.HACKERBANK_HAS_CREDENTIAL === true;

  function setStatus(text, kind) {
    statusLine.textContent = text;
    statusLine.className = "status-line" + (kind ? " " + kind : "");
  }

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

  async function registerCredential() {
    setStatus("Solicitando challenge de registro al servidor...");

    const beginResponse = await fetch("/api/webauthn/register/begin", { method: "POST" });
    const optionsJson = await beginResponse.json();
    const publicKey = decodeCreationOptions(optionsJson);

    setStatus("Esperando al autenticador de plataforma (Windows Hello / Touch ID)...");

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

    setStatus("Enviando la respuesta firmada al servidor para verificar...");

    const completeResponse = await fetch("/api/webauthn/register/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentialJson),
    });
    const result = await completeResponse.json();

    if (!result.ok) {
      setStatus("Registro fallido: " + result.error, "error");
      return false;
    }

    setStatus("Credencial registrada. Ahora podes autenticarte.", "success");
    return true;
  }

  async function authenticate() {
    setStatus("Solicitando challenge de autenticacion al servidor...");

    const beginResponse = await fetch("/api/webauthn/authenticate/begin", { method: "POST" });
    const optionsJson = await beginResponse.json();
    const publicKey = decodeRequestOptions(optionsJson);

    setStatus("Esperando confirmacion biometrica local...");

    const assertion = await navigator.credentials.get({ publicKey });
    const assertionResponse = assertion.response;

    const credentialJson = {
      id: assertion.id,
      rawId: bufferToBase64url(assertion.rawId),
      type: assertion.type,
      clientExtensionResults: assertion.getClientExtensionResults ? assertion.getClientExtensionResults() : {},
      response: {
        clientDataJSON: bufferToBase64url(assertionResponse.clientDataJSON),
        authenticatorData: bufferToBase64url(assertionResponse.authenticatorData),
        signature: bufferToBase64url(assertionResponse.signature),
        userHandle: assertionResponse.userHandle ? bufferToBase64url(assertionResponse.userHandle) : null,
      },
    };

    setStatus("Verificando firma en el servidor...");

    const completeResponse = await fetch("/api/webauthn/authenticate/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentialJson),
    });
    const result = await completeResponse.json();

    if (!result.ok) {
      setStatus("Autenticacion fallida: " + result.error, "error");
      return;
    }

    setStatus("Autenticado con FIDO2. Redirigiendo...", "success");
    setTimeout(() => { window.location.href = result.next; }, 700);
  }

  actionBtn.addEventListener("click", async () => {
    actionBtn.disabled = true;
    try {
      if (!hasCredential) {
        const registered = await registerCredential();
        if (registered) {
          actionBtn.textContent = "Autenticarme con FIDO2";
          actionBtn.dataset.state = "authenticate";
        }
      } else {
        await authenticate();
      }
    } catch (err) {
      setStatus("Error: " + err.message, "error");
    } finally {
      actionBtn.disabled = false;
    }
  });

  if (!window.PublicKeyCredential) {
    setStatus("Este navegador no soporta WebAuthn.", "error");
    actionBtn.disabled = true;
  } else if (hasCredential) {
    actionBtn.textContent = "Autenticarme con FIDO2";
    actionBtn.dataset.state = "authenticate";
  } else {
    actionBtn.textContent = "Registrar credencial FIDO2";
    actionBtn.dataset.state = "register";
  }
})();
