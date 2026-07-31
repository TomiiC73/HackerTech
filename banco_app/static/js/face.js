// Modo A: segundo factor facial (tras la contrasena). Captura frames de la
// webcam y los manda al backend continuamente (sin botones); el servidor los
// compara 1:1 contra el rostro del usuario ya identificado. Es inseguro a
// proposito (sin liveness): una foto de ese usuario tambien pasa. La vista
// previa se muestra espejada (como un selfie), pero el frame que se envia va
// con la orientacion real de la camara.
(function () {
  const video = document.getElementById("camera-video");
  const canvas = document.getElementById("camera-canvas");
  const statusLine = document.getElementById("face-status");
  const cameraFrame = document.getElementById("camera-frame");
  const faceIntro = document.getElementById("face-intro");
  const bombResult = document.getElementById("bomb-result");
  const bombStatus = document.getElementById("bomb-status");

  const VERIFY_INTERVAL_MS = 1200;

  // Frases ambiente que van rotando mientras se procesa la verificacion
  // (tematica del evento, no reemplaza el status-line de arriba/abajo,
  // que sigue mostrando el feedback tecnico real: sin rostro, no coincide, etc).
  const BOMB_MESSAGES = ["Verificando...", "Analizando biometría...", "Desactivando bomba..."];
  const BOMB_MESSAGE_INTERVAL_MS = 1700;

  let stream = null;
  let verifying = false;
  let matched = false;
  let intervalId = null;
  let bombMessageIntervalId = null;
  let bombMessageIndex = 0;

  function showNextBombMessage() {
    bombStatus.classList.remove("visible");
    setTimeout(() => {
      bombStatus.textContent = BOMB_MESSAGES[bombMessageIndex % BOMB_MESSAGES.length];
      bombMessageIndex += 1;
      bombStatus.classList.add("visible");
    }, 200);
  }

  function startBombMessageCycle() {
    showNextBombMessage();
    bombMessageIntervalId = setInterval(showNextBombMessage, BOMB_MESSAGE_INTERVAL_MS);
  }

  function stopBombMessageCycle() {
    clearInterval(bombMessageIntervalId);
    bombStatus.classList.remove("visible");
  }

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
      video.srcObject = stream;
      statusLine.textContent = "Camara activa. Encuadra tu rostro en el marco.";
      statusLine.className = "status-line";
      intervalId = setInterval(verifyFrame, VERIFY_INTERVAL_MS);
      startBombMessageCycle();
    } catch (err) {
      statusLine.textContent = "No se pudo acceder a la camara: " + err.message;
      statusLine.className = "status-line error";
    }
  }

  function captureFrame() {
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth || 400;
    canvas.height = video.videoHeight || 400;
    // Se dibuja el frame crudo del <video> (sin el espejado de la
    // vista previa, que es solo un transform CSS): lo que se envia al
    // servidor conserva la orientacion real de la camara.
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  }

  async function verifyFrame() {
    if (verifying || matched) return;
    verifying = true;
    statusLine.textContent = "Analizando rostro...";
    statusLine.className = "status-line";

    const frame = captureFrame();

    try {
      const response = await fetch("/api/face/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame }),
      });
      const data = await response.json();

      if (data.ok) {
        matched = true;
        clearInterval(intervalId);
        stopBombMessageCycle();
        cameraFrame.style.display = "none";
        faceIntro.style.display = "none";
        bombResult.style.display = "flex";
        statusLine.textContent = `Rostro verificado (score ${data.score}).`;
        statusLine.className = "status-line success";
        return;
      }

      statusLine.textContent = data.reason || "Buscando coincidencia...";
      statusLine.className = "status-line";
    } catch (err) {
      statusLine.textContent = "Error de conexion con el servidor.";
      statusLine.className = "status-line error";
    } finally {
      verifying = false;
    }
  }

  window.addEventListener("beforeunload", () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stopBombMessageCycle();
  });

  startCamera();
})();
