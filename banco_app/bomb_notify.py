"""
Notificacion externa "bomba desactivada" (puesta en escena del evento).

Al completarse el login (contrasena + facial, el segundo factor inseguro a
proposito), se dispara un POST fire-and-forget a una URL externa con un
token fijo (no se genera por sesion, ver config.BOMB_DESACTIVATE_TOKEN).

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


def _desactivate_url():
    return f"{config.BOMB_DESACTIVATE_URL}/desactivate?t={config.BOMB_DESACTIVATE_TOKEN}"


def _post_desactivate():
    try:
        request = urllib.request.Request(_desactivate_url(), method="POST")
        urllib.request.urlopen(request, timeout=_REQUEST_TIMEOUT_SECONDS)
    except (urllib.error.URLError, OSError, ValueError) as error:
        print(f"[bomb] No se pudo notificar la desactivacion (no bloquea el login): {error}")


def notify_desactivated():
    """Dispara el POST en un hilo aparte; no bloquea el request actual."""
    threading.Thread(target=_post_desactivate, daemon=True).start()
