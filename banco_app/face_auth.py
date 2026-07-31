"""
Segundo factor: verificacion facial (1:1, INSEGURA a proposito).

Al escanear un rostro, se lo compara contra las muestras guardadas del
usuario ya identificado por contrasena (primer factor) y se acepta si el
mejor match supera el umbral. Cada usuario puede tener varias muestras
(distintos frames tomados en el alta), lo que mejora el reconocimiento.

------------------------------------------------------------------
Sigue SIN haber "liveness detection": se comparan frames estaticos 2D
(features ORB). No se pide parpadear, ni se mide profundidad ni movimiento.
Es una autenticacion biometrica debil a proposito -mostrar una foto de la
persona alcanza para superarla-, pero ahora funciona como un reconocimiento
facial de verdad: cada persona enrola su propio rostro y luego se puede
volver a autenticar con el.

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
# CLAHE (ecualizacion de histograma adaptativa por regiones) normaliza el
# contraste local mucho mejor que un min-max global: le da a ORB puntos de
# referencia mas estables entre una foto de alta y la camara en vivo, sin
# tocar el umbral de matches ni agregar deteccion de vida.
_CLAHE = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))


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

    CLAHE ecualiza el contraste en mosaicos locales (8x8) en vez de sobre
    toda la imagen: una sombra parcial o una exposicion pareja pero distinta
    ya no aplasta las texturas finas que ORB necesita para encontrar puntos
    de interes, lo que hace que la MISMA cara matchee de forma mas estable
    en logins futuros (el umbral de aceptacion no cambia).

    IMPORTANTE: esto se aplica en el MOMENTO DE COMPARAR (dentro de
    _orb_good_matches), nunca antes de guardar una muestra. Si se "horneara"
    en la imagen que se persiste, cualquier ajuste futuro a este algoritmo
    dejaria incomparables (con score bajisimo) a todas las caras ya
    enroladas contra un frame nuevo, sin ningun aviso ni error - un bug
    silencioso real que ya paso una vez en este proyecto.
    """
    blurred = cv2.GaussianBlur(face_crop, (3, 3), 0)
    return _CLAHE.apply(blurred)


def _detect_and_crop_face(image_bgr):
    """Detecta el rostro mas grande y devuelve el recorte CRUDO en gris
    (sin normalizar). La normalizacion se aplica recien al comparar, no aca:
    ver la nota en _normalize_lighting.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    # Ecualizar el histograma global antes de detectar ayuda al cascade Haar
    # a encontrar la cara bajo condiciones de luz mas variadas (frames muy
    # oscuros o muy quemados), sin cambiar como se compara la identidad.
    gray_eq = cv2.equalizeHist(gray)
    faces = _FACE_CASCADE.detectMultiScale(
        gray_eq, scaleFactor=1.1, minNeighbors=4, minSize=(80, 80)
    )
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
    face_crop = gray[y:y + h, x:x + w]
    return cv2.resize(face_crop, config.FACE_COMPARE_SIZE)


def _orb_good_matches(face_a, face_b):
    """Normaliza ambos recortes con el algoritmo ACTUAL y cuenta features
    ORB compatibles entre ellos. Normalizar aca (no antes de guardar)
    garantiza que una muestra guardada hace tiempo siga siendo comparable
    aunque el algoritmo de normalizacion cambie despues.
    """
    norm_a = _normalize_lighting(face_a)
    norm_b = _normalize_lighting(face_b)
    _, descriptors_a = _ORB.detectAndCompute(norm_a, None)
    _, descriptors_b = _ORB.detectAndCompute(norm_b, None)
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
    """Igual que enroll() pero desde un archivo (lo usa seed.py para Sr. Vargas)."""
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
    """Compara un frame contra las muestras guardadas de un usuario (1:1).

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
