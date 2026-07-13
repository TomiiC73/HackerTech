// Modo A: login por rostro. Captura frames de la webcam y los manda al
// backend continuamente (sin botones); el servidor los compara 1:N contra
// todos los rostros registrados e identifica al usuario. La vista previa
// se muestra espejada (como un selfie), pero el frame que se envia va con
// la orientacion real de la camara.
(function () {
  const video = document.getElementById("camera-video");
  const canvas = document.getElementById("camera-canvas");
  const statusLine = document.getElementById("face-status");

  const VERIFY_INTERVAL_MS = 1200;

  let stream = null;
  let verifying = false;
  let matched = false;
  let intervalId = null;

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
      video.srcObject = stream;
      statusLine.textContent = "Camara activa. Encuadra tu rostro en el marco.";
      statusLine.className = "status-line";
      intervalId = setInterval(verifyFrame, VERIFY_INTERVAL_MS);
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
      const response = await fetch("/api/face/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame }),
      });
      const data = await response.json();

      if (data.ok) {
        matched = true;
        clearInterval(intervalId);
        statusLine.textContent = `Rostro verificado (score ${data.score}). Redirigiendo...`;
        statusLine.className = "status-line success";
        setTimeout(() => { window.location.href = data.next; }, 700);
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
  });

  startCamera();
})();
