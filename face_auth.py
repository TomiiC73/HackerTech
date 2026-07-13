"""
Modo A: autenticacion facial por identificacion 1:N.

Al escanear un rostro, se lo compara contra TODAS las muestras de rostro
guardadas (de todos los usuarios) y se identifica/loguea al mejor match
que supere el umbral. Cada usuario puede tener varias muestras (distintos
frames tomados en el alta), lo que mejora el reconocimiento.

------------------------------------------------------------------
Sigue SIN haber "liveness detection": se comparan frames estaticos 2D
(features ORB). No se pide parpadear, ni se mide profundidad ni movimiento.
Es una autenticacion biometrica debil a proposito -su contraparte robusta
es el Modo B (WebAuthn/FIDO2, ver webauthn_auth.py)-, pero ahora funciona
como un reconocimiento facial de verdad: cada persona enrola su propio
rostro y luego se puede volver a autenticar con el.

Nota de calibracion: la comparacion por histograma de intensidades crudas
resultaba demasiado sensible a diferencias de brillo/exposicion entre la
muestra guardada y la camara en vivo. Los features ORB (comparaciones
locales de contraste, no de intensidad absoluta) son mucho mas estables
ante esas variaciones y son la unica señal usada.
------------------------------------------------------------------
"""
import base64

import cv2
import numpy as np

import config

_FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
_ORB = cv2.ORB_create(nfeatures=500)
_BF_MATCHER = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)


class IdentifyResult:
    def __init__(self, success, user_id, score, reason):
        self.success = success
        self.user_id = user_id
        self.score = score
        self.reason = reason


class EnrollResult:
    def __init__(self, success, face_png, reason):
        self.success = success
        self.face_png = face_png
        self.reason = reason


def _decode_base64_frame(frame_b64):
    """Convierte un data URL 'data:image/jpeg;base64,...' en una imagen BGR de OpenCV."""
    if "," in frame_b64:
        frame_b64 = frame_b64.split(",", 1)[1]
    raw_bytes = base64.b64decode(frame_b64)
    np_buffer = np.frombuffer(raw_bytes, dtype=np.uint8)
    return cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)


def _normalize_lighting(face_crop):
    """Reduce la sensibilidad a diferencias de brillo/exposicion entre la
    muestra guardada (archivo) y la camara en vivo (auto-exposicion distinta).
    """
    blurred = cv2.GaussianBlur(face_crop, (3, 3), 0)
    return cv2.normalize(blurred, None, 0, 255, cv2.NORM_MINMAX)


def _detect_and_crop_face(image_bgr):
    """Detecta el rostro mas grande y devuelve el recorte normalizado en gris."""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    faces = _FACE_CASCADE.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
    )
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
    face_crop = gray[y:y + h, x:x + w]
    face_crop = cv2.resize(face_crop, config.FACE_COMPARE_SIZE)
    return _normalize_lighting(face_crop)


def _orb_good_matches(face_a, face_b):
    """Cuenta features ORB compatibles entre dos recortes de rostro."""
    _, descriptors_a = _ORB.detectAndCompute(face_a, None)
    _, descriptors_b = _ORB.detectAndCompute(face_b, None)
    if descriptors_a is None or descriptors_b is None:
        return 0
    return len(_BF_MATCHER.match(descriptors_a, descriptors_b))


def _extract_face_from_b64(frame_b64):
    """frame base64 -> recorte de rostro normalizado (numpy) o None."""
    try:
        image = _decode_base64_frame(frame_b64)
    except Exception:
        return None
    if image is None:
        return None
    return _detect_and_crop_face(image)


def encode_face_png(face_crop):
    """Serializa un recorte de rostro (numpy gris) a bytes PNG para la base."""
    ok, buffer = cv2.imencode(".png", face_crop)
    return buffer.tobytes() if ok else None


def decode_face_png(png_bytes):
    """Deserializa los bytes PNG guardados a un recorte de rostro (numpy gris)."""
    np_buffer = np.frombuffer(png_bytes, dtype=np.uint8)
    return cv2.imdecode(np_buffer, cv2.IMREAD_GRAYSCALE)


def enroll(frame_b64):
    """Extrae el rostro de un frame para guardarlo como muestra del usuario.

    Devuelve un EnrollResult con los bytes PNG del recorte normalizado.
    """
    face = _extract_face_from_b64(frame_b64)
    if face is None:
        return EnrollResult(False, None, "No se detecto ningun rostro en el frame.")
    png = encode_face_png(face)
    if png is None:
        return EnrollResult(False, None, "No se pudo procesar el rostro.")
    return EnrollResult(True, png, "Rostro capturado")


def enroll_from_image_path(image_path):
    """Igual que enroll() pero desde un archivo (lo usa seed.py para Carlos)."""
    image = cv2.imread(image_path)
    if image is None:
        return EnrollResult(False, None, "No se pudo leer la imagen.")
    face = _detect_and_crop_face(image)
    if face is None:
        return EnrollResult(False, None, "No se detecto rostro en la imagen.")
    png = encode_face_png(face)
    if png is None:
        return EnrollResult(False, None, "No se pudo procesar el rostro.")
    return EnrollResult(True, png, "Rostro capturado")


def identify(frame_b64, enrolled_faces):
    """Compara un frame contra TODAS las muestras guardadas (busqueda 1:N).

    `enrolled_faces` es una lista de (user_id, face_png). Devuelve un
    IdentifyResult con el user_id del mejor match si supera el umbral.
    """
    live_face = _extract_face_from_b64(frame_b64)
    if live_face is None:
        return IdentifyResult(False, None, 0, "No se detecto ningun rostro frente a la camara.")

    if not enrolled_faces:
        return IdentifyResult(False, None, 0, "No hay rostros registrados todavia.")

    best_user_id = None
    best_score = 0
    for user_id, face_png in enrolled_faces:
        stored_face = decode_face_png(face_png)
        if stored_face is None:
            continue
        score = _orb_good_matches(stored_face, live_face)
        if score > best_score:
            best_score = score
            best_user_id = user_id

    if best_score >= config.FACE_ORB_MIN_MATCHES:
        return IdentifyResult(True, best_user_id, best_score, "Rostro reconocido")
    return IdentifyResult(False, None, best_score, "Rostro no reconocido, seguí encuadrando...")
