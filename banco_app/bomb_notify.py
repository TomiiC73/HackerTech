"""
Notificacion externa "bomba desactivada" (puesta en escena del evento).

Al completarse el login (contrasena + facial, el segundo factor inseguro a
proposito), se dispara un POST fire-and-forget a una URL externa con un
token fijo (no se genera por sesion, ver config.BOMB_DEACTIVATE_TOKEN).

Nunca debe bloquear ni romper el login del estudiante: corre en un hilo de
fondo con un timeout corto, y cualquier error (sin conexion a internet, URL
todavia sin configurar, timeout) se traga tras loguearlo por consola - el
dashboard tiene que mostrarse igual.
"""
import threading
import urllib.error
import urllib.request

import config

_REQUEST_TIMEOUT_SECONDS = 5


def _deactivate_url():
    return f"{config.BOMB_DEACTIVATE_URL}/deactivate?t={config.BOMB_DEACTIVATE_TOKEN}"


def _post_deactivate():
    try:
        request = urllib.request.Request(_deactivate_url(), method="POST")
        urllib.request.urlopen(request, timeout=_REQUEST_TIMEOUT_SECONDS)
    except (urllib.error.URLError, OSError, ValueError) as error:
        print(f"[bomb] No se pudo notificar la desactivacion (no bloquea el login): {error}")


def notify_deactivated():
    """Dispara el POST en un hilo aparte; no bloquea el request actual."""
    threading.Thread(target=_post_deactivate, daemon=True).start()
