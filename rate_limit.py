"""
Limitador de intentos de login (proteccion basica de fuerza bruta).

Ventana deslizante en memoria, con una unica responsabilidad (SRP): contar
fallos recientes por clave y decidir si se supero el umbral. La clave la
elige quien lo usa (app.py la arma con el email de la cuenta atacada).

Nota de alcance: el estado vive en memoria del proceso. Alcanza para este
laboratorio de un solo worker (use_reloader=False). Un despliegue multi-proceso
necesitaria un store compartido (Redis), como indica CODING_STANDARDS.
"""
import time
from collections import defaultdict

# clave -> lista de timestamps (epoch segundos) de intentos fallidos
_failures = defaultdict(list)


def _recent(key, window_seconds):
    """Devuelve (y deja cacheados) los fallos dentro de la ventana."""
    now = time.time()
    fresh = [ts for ts in _failures[key] if now - ts < window_seconds]
    _failures[key] = fresh
    return fresh


def is_blocked(key, max_attempts, window_seconds):
    """True si la clave ya acumulo max_attempts fallos en la ventana."""
    return len(_recent(key, window_seconds)) >= max_attempts


def record_failure(key, window_seconds):
    """Registra un intento fallido para la clave."""
    _recent(key, window_seconds).append(time.time())


def reset(key):
    """Limpia el historial de la clave (se llama tras un login exitoso)."""
    _failures.pop(key, None)
