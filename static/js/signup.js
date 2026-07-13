// Alta de cuenta: paso 1 (datos) -> paso 2 (rostro) -> paso 3 (metodo FIDO2, opcional).
(function () {
  const form = document.getElementById("signup-form");
  const facePane = document.getElementById("signup-face");
  const methodPane = document.getElementById("signup-method");
  const errorBox = document.getElementById("signup-error");
  const video = document.getElementById("signup-video");
  const canvas = document.getElementById("signup-canvas");
  const statusLine = document.getElementById("signup-status");
  const captureBtn = document.getElementById("signup-capture");

  const methodGrid = document.getElementById("signup-method-grid");
  const methodStatus = document.getElementById("signup-method-status");
  const methodRegisterBtn = document.getElementById("signup-method-register");
  const methodSkipBtn = document.getElementById("signup-method-skip");
  const stepperDots = document.querySelectorAll(".stepper__dot");

  const SAMPLES_TO_CAPTURE = 5;
  const CAPTURE_GAP_MS = 350;

  let stream = null;
  let accountData = null;
  let nextUrl = "/dashboard";
  let selectedMethod = "huella";

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.add("visible");
  }
  function clearError() { errorBox.classList.remove("visible"); }

  function goToStep(n) {
    stepperDots.forEach((d) => d.classList.toggle("active", Number(d.dataset.step) <= n));
    form.style.display = n === 1 ? "" : "none";
    facePane.style.display = n === 2 ? "" : "none";
    methodPane.style.display = n === 3 ? "" : "none";
  }

  // --- Paso 1: datos de la cuenta ---
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    accountData = {
      full_name: document.getElementById("full_name").value.trim(),
      email: document.getElementById("email").value.trim(),
      dni: document.getElementById("dni").value.trim(),
      password: document.getElementById("password").value,
    };

    if (!accountData.full_name || !accountData.email || !accountData.dni || !accountData.password) {
      showError("Completá todos los campos.");
      return;
    }
    if (accountData.password.length < 6) {
      showError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    goToStep(2);
    await startCamera();
  });

  // --- Paso 2: camara ---
  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
      video.srcObject = stream;
      statusLine.textContent = "Cámara activa. Encuadrá tu rostro y registralo.";
      statusLine.className = "status-line";
      captureBtn.disabled = false;
    } catch (err) {
      statusLine.textContent = "No se pudo acceder a la cámara: " + err.message;
      statusLine.className = "status-line error";
    }
  }

  function captureFrame() {
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth || 400;
    canvas.height = video.videoHeight || 400;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  captureBtn.addEventListener("click", async () => {
    captureBtn.disabled = true;
    clearError();

    const frames = [];
    for (let i = 0; i < SAMPLES_TO_CAPTURE; i += 1) {
      statusLine.textContent = `Capturando... (${i + 1}/${SAMPLES_TO_CAPTURE})`;
      frames.push(captureFrame());
      await sleep(CAPTURE_GAP_MS);
    }

    statusLine.textContent = "Creando tu cuenta...";

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...accountData, faces: frames }),
      });
      const data = await response.json();

      if (!data.ok) {
        showError(data.error || "No se pudo crear la cuenta.");
        statusLine.textContent = "Reintentá el registro de rostro.";
        statusLine.className = "status-line error";
        captureBtn.disabled = false;
        return;
      }

      nextUrl = data.next || "/dashboard";
      if (stream) stream.getTracks().forEach((t) => t.stop());
      goToStep(3);   // cuenta creada + logueado: ofrecer metodo FIDO2
    } catch (err) {
      showError("Error de conexión con el servidor.");
      captureBtn.disabled = false;
    }
  });

  // --- Paso 3: metodo FIDO2 (opcional) ---
  if (methodGrid) {
    methodGrid.querySelectorAll(".method-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        methodGrid.querySelectorAll(".method-option").forEach((o) => o.classList.remove("active"));
        opt.classList.add("active");
        selectedMethod = opt.dataset.method;
      });
    });
  }

  methodSkipBtn.addEventListener("click", () => { window.location.href = nextUrl; });

  methodRegisterBtn.addEventListener("click", async () => {
    methodRegisterBtn.disabled = true;
    methodSkipBtn.disabled = true;
    methodStatus.textContent = "Confirmá en tu dispositivo (Windows Hello / Touch ID)...";
    methodStatus.className = "status-line";

    const result = await window.registerWebAuthnMethod(selectedMethod);
    if (result.ok) {
      methodStatus.textContent = "¡Método registrado! Entrando...";
      methodStatus.className = "status-line success";
      setTimeout(() => { window.location.href = nextUrl; }, 700);
    } else {
      methodStatus.textContent = "No se pudo registrar: " + result.error + ". Podés omitir y usar tu rostro.";
      methodStatus.className = "status-line error";
      methodRegisterBtn.disabled = false;
      methodSkipBtn.disabled = false;
    }
  });

  window.addEventListener("beforeunload", () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
  });
})();
