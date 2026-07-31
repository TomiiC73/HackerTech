"""
Configuracion centralizada de HackerBank.

Todas las constantes de la aplicacion viven aca (cero "numeros magicos"
dispersos por el codigo, segun mejores_practicas_programacion.md).
"""
import os

# --- Flask ---
# En produccion esto DEBE venir de una variable de entorno real.
# El valor de fallback es exclusivamente para el laboratorio educativo
# y queda documentado como inseguro-solo-lab en README.md.
FLASK_SECRET_KEY = os.environ.get("HACKERBANK_SECRET") or "lab-only-insecure-secret-hackertech-utn-frc"

DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hackerbank.db")

# --- Endurecimiento de la cookie de sesion (CODING_STANDARDS: sesiones) ---
# HttpOnly evita que JavaScript lea la cookie (mitiga robo por XSS).
# SameSite=Lax mitiga CSRF en peticiones cross-site.
# Secure obliga HTTPS: se deja configurable porque el lab corre en http
# local; en produccion (HTTPS) poner HACKERBANK_COOKIE_SECURE=1.
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = os.environ.get("HACKERBANK_COOKIE_SECURE", "0") == "1"

# --- Proteccion de fuerza bruta en el login (CODING_STANDARDS: Insecure Design) ---
# Tras LOGIN_MAX_ATTEMPTS fallos dentro de LOGIN_WINDOW_SECONDS para una misma
# cuenta, se responde 429 hasta que la ventana expire.
LOGIN_MAX_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 300

# --- Rutas de assets usados por la logica de reconocimiento facial ---
STATIC_IMG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "img")
FACE_REFERENCE_PATH = os.path.join(STATIC_IMG_DIR, "sr_vargas_reference.jpg")

# --- Modo A: parametros del "reconocimiento facial" inseguro ---
# Minimo de features ORB compatibles entre el frame capturado y la foto
# de referencia para aceptar la verificacion. Calibrado empiricamente:
# la MISMA cara bajo distinta iluminacion (foto vs. camara en vivo)
# produce ~150-300 matches; contenido no relacionado produce ~100-110.
# Un umbral bajo/laxo es A PROPOSITO: el desafio consiste en que una
# simple foto impresa o mostrada en un celular alcance para superar
# este umbral, porque no hay verificacion de "vida" (liveness).
FACE_ORB_MIN_MATCHES = 150

# Tamano al que se normalizan los rostros recortados antes de comparar.
FACE_COMPARE_SIZE = (200, 200)

# Un usuario puede guardar varias muestras de rostro (varios frames
# enrolados desde seed.py); en el login se compara contra todas las suyas
# y se toma el mejor match. Mas muestras = template mas robusto ante
# variaciones de luz/angulo en logins futuros, sin tocar el umbral ni la
# falta de liveness de arriba.

# --- Datos de presentacion de la cuenta (dashboard) ---
BANK_BRANCH_LABEL = "Sucursal Centro — Córdoba (031)"
ACCOUNT_TYPE_LABEL = "Caja de ahorro en pesos"
BANK_BIC = "HKBKARBA"            # codigo BIC/SWIFT ficticio

# --- Datos del usuario de laboratorio (Sr. Vargas) ---
# La contrasena en texto plano SOLO existe aca para que el instructor
# pueda re-generar el hash via seed.py; en la base de datos se guarda
# unicamente el hash (werkzeug.security).
DEMO_USER_EMAIL = "dev+ht"
DEMO_USER_PASSWORD = "2NEfv7M3+hlE"
DEMO_USER_NAME = "Sr. Vargas"
DEMO_USER_DNI = "30.456.789"
DEMO_USER_CBU = "0000003100012345678901"
DEMO_USER_ALIAS = "sr.vargas.hb"
DEMO_BALANCE_ARS = 847320.50
DEMO_BALANCE_USD = 1240.00
DEMO_DAILY_YIELD_ARS = 1247.30

# --- Contenido publico de la landing (simula la home de un banco real) ---
PUBLIC_USD_BUY = 1180.50
PUBLIC_USD_SELL = 1220.50
PUBLIC_EUR_BUY = 1275.00
PUBLIC_EUR_SELL = 1325.00

PUBLIC_LOAN_MAX_ARS = 5000000.00
PUBLIC_LOAN_TNA_PERCENT = 45
PUBLIC_FIXED_DEPOSIT_TNA_PERCENT = 38
PUBLIC_FIXED_DEPOSIT_MIN_DAYS = 30
PUBLIC_CREDIT_CARD_TNA_PERCENT = 62

PUBLIC_SUPPORT_PHONE = "0800-555-4225"
PUBLIC_SUPPORT_HOURS = "Lunes a viernes de 8 a 20 hs · Sábados de 9 a 13 hs"

PUBLIC_BRANCHES = [
    {"name": "Sucursal Centro", "address": "Av. Colón 145, Córdoba"},
    {"name": "Sucursal Nueva Córdoba", "address": "Bv. Illia 355, Córdoba"},
    {"name": "Sucursal Güemes", "address": "Belgrano 620, Córdoba"},
]

# --- Sesion ---
SESSION_KEY_PRE_AUTH = "pre_auth_user_id"
SESSION_KEY_AUTHENTICATED = "authenticated"

# --- Notificacion externa "bomba desactivada" (puesta en escena del evento) ---
# Se dispara una unica vez, fire-and-forget, apenas el segundo factor facial
# da exitoso (ver bomb_notify.py). Nunca debe bloquear ni romper el login
# del estudiante: si no hay conexion a internet o la URL todavia no esta
# configurada, el dashboard tiene que mostrarse igual.
#
# BOMB_DESACTIVATE_URL es la URL definitiva del evento, hardcodeada a
# proposito (no depende de variable de entorno): si el .env no esta
# seteado el dia del evento, el POST tiene que dispararse igual.
BOMB_DESACTIVATE_URL = "https://URL"
BOMB_DESACTIVATE_TOKEN = "72366c7b2365327cb98d934b458b584d"
