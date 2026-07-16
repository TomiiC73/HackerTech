"""
Configuracion centralizada del rediseño UTN-FRC.

Todas las constantes viven aca (cero "numeros magicos" dispersos por el
codigo), siguiendo el mismo criterio que banco_app/config.py.
"""
import os

FLASK_SECRET_KEY = os.environ.get("UTNFRC_SECRET", "lab-only-insecure-secret-utn-frc-redesign")

DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "utnfrc.db")

# --- Endurecimiento de la cookie de sesion ---
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = os.environ.get("UTNFRC_COOKIE_SECURE", "0") == "1"

# --- WebAuthn / FIDO2 (segundo factor del Modo B, tras identificarse) ---
# El RP ID debe ser un dominio (o "localhost") sin protocolo ni puerto.
WEBAUTHN_RP_ID = os.environ.get("UTNFRC_RP_ID", "localhost")
WEBAUTHN_RP_NAME = "UTN Facultad Regional Córdoba"
WEBAUTHN_ORIGIN = os.environ.get("UTNFRC_ORIGIN", "http://localhost:5001")

# --- Sesion ---
SESSION_KEY_PRE_AUTH = "pre_auth_user_id"       # identificado (legajo+dominio+contraseña), FIDO2 pendiente
SESSION_KEY_AUTHENTICATED = "authenticated"
SESSION_KEY_USER_ID = "user_id"
SESSION_KEY_AUTH_VIA = "authenticated_via"
SESSION_KEY_WEBAUTHN_CHALLENGE = "webauthn_challenge"

# --- Alta de aspirantes: generacion de legajo ---
LEGAJO_PREFIX = "50"
LEGAJO_SUFFIX_DIGITS = 3

AUTH_VIA_PASSWORD = "password"           # ingreso tradicional: un solo factor
AUTH_VIA_WEBAUTHN = "password_webauthn"  # Modo B: identificacion + confirmacion FIDO2

# --- Dominios del selector "@" (igual que el login real de la facultad) ---
DOMAIN_OPTIONS = [
    "frc", "egresado", "electrica", "electronica", "extension", "industrial",
    "licenciatura", "mecanica", "metalurgica", "org", "posgrado", "punilla",
    "quimica", "radio", "sa", "sae", "scdt", "sistemas", "tecnicatura", "virtual",
]
DEFAULT_DOMAIN = "frc"

# --- Dominio asignado segun la carrera elegida en el alta (igual que el
# esquema real de la facultad: cada especialidad tiene su propio dominio de
# correo). Civil no tiene un dominio propio en DOMAIN_OPTIONS, asi que cae
# en DEFAULT_DOMAIN ("frc").
CAREER_DOMAIN_MAP = {
    "Ingeniería Civil": "frc",
    "Ingeniería en Energía Eléctrica": "electrica",
    "Ingeniería Electrónica": "electronica",
    "Ingeniería Industrial": "industrial",
    "Ingeniería Mecánica": "mecanica",
    "Ingeniería Metalúrgica": "metalurgica",
    "Ingeniería Química": "quimica",
    "Ingeniería en Sistemas de Información": "sistemas",
}

# --- Usuario de demo (para probar el login) ---
DEMO_USER_LEGAJO = "45231"
DEMO_USER_DOMAIN = "frc"
DEMO_USER_EMAIL = "ana.torres@frc.utn.edu.ar"
DEMO_USER_PASSWORD = "utn2026"
DEMO_USER_NAME = "Ana Torres"
DEMO_USER_DNI = "35412678"
DEMO_USER_ROLE = "Alumna — Ingeniería en Sistemas de Información"

# --- Contenido de la home (simula el contenido publico de la facultad) ---
NEWS_ITEMS = [
    {
        "date": "01/07/2026",
        "tag": "Secretaría de Planeamiento Académico",
        "category": "Inscripciones",
        "title": "Abiertas las inscripciones para Tecnicaturas Universitarias",
        "summary": (
            "Se dictan de manera semipresencial las Tecnicaturas en Mecatrónica, "
            "Mantenimiento Industrial e Higiene y Seguridad en el Trabajo."
        ),
        "featured": True,
    },
    {
        "date": "22/06/2026",
        "tag": "CIGEF",
        "category": "Académica",
        "title": "Nuevo Centro de Investigación en Geotecnia y Estructuras",
        "summary": (
            "El CIGEF suma equipamiento propio para ensayos de suelos y "
            "fundaciones aplicados a proyectos de Ingeniería Civil."
        ),
        "featured": False,
    },
    {
        "date": "11/06/2026",
        "tag": "Secretaría de Extensión Universitaria",
        "category": "Extensión",
        "title": "Cursos de Armado y Reparación de PC y Electricista Industrial",
        "summary": (
            "Inscripción abierta para dos cursos de formación de oficios, con "
            "modalidad semipresencial y certificado de aprobación."
        ),
        "featured": False,
    },
    {
        "date": "27/05/2026",
        "tag": "Secretaría Académica",
        "category": "Académica",
        "title": "Curricularización del extensionismo en materias del ciclo básico",
        "summary": (
            "Análisis Matemático I suma tutorías en escuelas de nivel medio "
            "como espacio de práctica socioterritorial."
        ),
        "featured": False,
    },
]

CAREERS = [
    {
        "name": "Ingeniería Civil",
        "description": (
            "El Ingeniero Civil está capacitado para proyectar, mensurar, planificar, "
            "dirigir, construir, auditar, etc, el desarrollo de todo tipo de obras de "
            "infraestructura y sus instalaciones tales como: viviendas, edificios, "
            "naves industriales, estaciones de servicio, carreteras, puentes, obras "
            "ferroviarias, canales, diques, puertos, aeropuertos, desarrollos urbanos, "
            "entre otras."
        ),
        "degree_title": "Ingeniero Civil",
        "duration": "5 años y medio",
        "intermediate_title": None,
    },
    {
        "name": "Ingeniería en Energía Eléctrica",
        "description": (
            "La Carrera de Ingeniería en Energía Eléctrica responde a la necesidad de "
            "formar profesionales aptos para cumplir funciones técnicas o de gestión "
            "en el área de generación, transmisión, distribución y utilización de la "
            "energía eléctrica."
        ),
        "degree_title": "Ingeniero Electricista",
        "duration": "5 años",
        "intermediate_title": None,
    },
    {
        "name": "Ingeniería Electrónica",
        "description": (
            "La Carrera tiene como objetivo formar profesionales capacitados para "
            "afrontar con solvencia el planeamiento, desarrollo, dirección y control "
            "de sistemas electrónicos; abordar proyectos de investigación y "
            "desarrollo, administrando los recursos humanos y físicos necesarios."
        ),
        "degree_title": "Ingeniero Electrónico",
        "duration": "5 años y medio",
        "intermediate_title": "Técnico Universitario en Electrónica (Duración 4 años)",
    },
    {
        "name": "Ingeniería Industrial",
        "description": (
            "Esta Carrera forma profesionales capaces de implementar, evaluar, "
            "organizar y conducir sistemas productivos; aplicando diversas técnicas, "
            "recursos humanos, materiales, equipos, máquinas e instalaciones, con el "
            "objeto de ordenar económica y productivamente las empresas de bienes y "
            "servicios destinados a satisfacer necesidades de la sociedad."
        ),
        "degree_title": "Ingeniero Industrial",
        "duration": "5 años",
        "intermediate_title": None,
    },
    {
        "name": "Ingeniería Mecánica",
        "description": (
            "Esta formación académica permite diseñar, planificar y administrar "
            "procesos industriales en un extenso campo ocupacional. Planear impactos "
            "económicos, sociales y ambientales en el desarrollo de proyectos, "
            "integrar y dirigir equipos con actitud emprendedora y de liderazgo."
        ),
        "degree_title": "Ingeniero Mecánico",
        "duration": "5 años",
        "intermediate_title": None,
    },
    {
        "name": "Ingeniería Metalúrgica",
        "description": (
            "Capacita en el estudio, selección, procesamiento, investigación y "
            "asesoramiento en general de metales y aleaciones, aceros comunes y "
            "especiales, aleaciones de aluminio, magnesio, cobre, como también en los "
            "no metales como cerámicos, plásticos reforzados, fibras de carbono, etc."
        ),
        "degree_title": "Ingeniero Metalúrgico",
        "duration": "5 años",
        "intermediate_title": "Técnico Universitario Metalúrgico (Duración 3 años)",
    },
    {
        "name": "Ingeniería Química",
        "description": (
            "Esta rama de la Ingeniería se dedica al estudio, síntesis, desarrollo, "
            "diseño, operación y optimización de todos aquellos procesos industriales "
            "que producen cambios físicos, químicos y/o bioquímicos en los materiales."
        ),
        "degree_title": "Ingeniero Químico",
        "duration": "5 años",
        "intermediate_title": "Técnico Universitario en Química (Duración 3 años)",
    },
    {
        "name": "Ingeniería en Sistemas de Información",
        "description": (
            "Formación analítica que permite al profesional interpretar y resolver "
            "problemas mediante el empleo de metodologías de sistemas y tecnologías "
            "de procesamiento de información."
        ),
        "degree_title": "Ingeniero en Sistemas de Información",
        "duration": "5 años",
        "intermediate_title": "Analista Universitario de Sistemas (Duración: 3 años)",
    },
]

QUICK_ACCESS_ITEMS = [
    {"label": "Autogestión", "description": "Inscripción a materias y exámenes", "icon": "grid"},
    {"label": "Educación Virtual", "description": "Aulas y campus virtual", "icon": "book"},
    {"label": "Correo institucional", "description": "Webmail @frc.utn.edu.ar", "icon": "mail"},
    {"label": "Biblioteca", "description": "Catálogo y salas de estudio", "icon": "library"},
    {"label": "Calendario académico", "description": "Fechas clave del cuatrimestre", "icon": "calendar"},
    {"label": "Carreras", "description": "Oferta académica de grado y posgrado", "icon": "graduation"},
]
