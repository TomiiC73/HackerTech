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
FLASK_SECRET_KEY = os.environ.get("HACKERBANK_SECRET", "lab-only-insecure-secret-hackertech-utn-frc")

DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hackerbank.db")

# --- Endurecimiento de la cookie de sesion (CODING_STANDARDS: sesiones) ---
# HttpOnly evita que JavaScript lea la cookie (mitiga robo por XSS).
# SameSite=Lax mitiga CSRF en peticiones cross-site.
# Secure obliga HTTPS: se deja configurable porque el lab corre en http
# local; en produccion (HTTPS/ngrok) poner HACKERBANK_COOKIE_SECURE=1.
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
FACE_REFERENCE_PATH = os.path.join(STATIC_IMG_DIR, "carlos_reference.jpg")

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

# Modo A ahora funciona como identificacion 1:N: al escanear un rostro se
# compara contra TODAS las muestras guardadas (de todos los usuarios) y se
# loguea al mejor match que supere el umbral. Un usuario puede tener varias
# muestras (distintos frames del alta), lo que mejora el reconocimiento.
FACE_ENROLL_SAMPLES = 5          # cuantas muestras se intentan capturar al alta
FACE_ENROLL_MIN_SAMPLES = 1      # minimo de muestras con rostro para crear la cuenta

# --- Generacion de cuentas nuevas (alta de usuario) ---
BANK_ENTITY_NUMBER = "031"       # numero de entidad ficticio
BANK_BRANCH_LABEL = "Sucursal Centro — Córdoba (031)"
ACCOUNT_TYPE_LABEL = "Caja de ahorro en pesos"
BANK_BIC = "HKBKARBA"            # codigo BIC/SWIFT ficticio
NEW_ACCOUNT_BALANCE_ARS = 25000.00
NEW_ACCOUNT_BALANCE_USD = 0.00
NEW_ACCOUNT_DAILY_YIELD_ARS = 0.00

# --- Modo B: configuracion WebAuthn / FIDO2 ---
# El RP ID debe ser un dominio (o "localhost") sin protocolo ni puerto.
WEBAUTHN_RP_ID = os.environ.get("HACKERBANK_RP_ID", "localhost")
WEBAUTHN_RP_NAME = "HackerBank"
WEBAUTHN_ORIGIN = os.environ.get("HACKERBANK_ORIGIN", "http://localhost:5000")

# --- Datos del usuario de laboratorio (Carlos Rodriguez) ---
# La contrasena en texto plano SOLO existe aca para que el instructor
# pueda re-generar el hash via seed.py; en la base de datos se guarda
# unicamente el hash (werkzeug.security).
DEMO_USER_EMAIL = "carlos@hackerbank.com"
DEMO_USER_PASSWORD = "hacker2024"
DEMO_USER_NAME = "Carlos Rodríguez"
DEMO_USER_DNI = "30.456.789"
DEMO_USER_CBU = "0000003100012345678901"
DEMO_USER_ALIAS = "carlos.rodriguez.hb"
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
SESSION_KEY_AUTH_MODE = "auth_mode_chosen"
SESSION_KEY_AUTHENTICATED = "authenticated"
SESSION_KEY_AUTH_VIA = "authenticated_via"

AUTH_MODE_FACE = "modo_a"
AUTH_MODE_WEBAUTHN = "modo_b"
