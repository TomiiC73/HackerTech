"""
Publica HackerBank en internet via ngrok para que cualquiera pueda
probar el desafio sin exponer manualmente el puerto local ni
configurar port forwarding.

El authtoken de ngrok NUNCA se hardcodea en este repo (secreto). Se
resuelve, en orden de prioridad, desde:
  1. La variable de entorno NGROK_AUTHTOKEN.
  2. La configuracion de una instalacion de ngrok ya autenticada en
     este equipo (por ejemplo la app de Microsoft Store), solo como
     fallback de comodidad para desarrollo local.
Si no se encuentra ninguno, el desafio sigue funcionando en modo
solo-local y se informa como resolverlo.
"""
import os
from pathlib import Path

from pyngrok import ngrok

# Ubicaciones conocidas de configs de ngrok ya autenticadas en Windows.
# Son rutas fijas del sistema operativo, no contienen ningun secreto
# en si mismas: el token se lee en tiempo de ejecucion y nunca se
# vuelca a un archivo de este proyecto.
_KNOWN_NGROK_CONFIG_PATHS = [
    # La config de la app de Microsoft Store va primero: es la fuente
    # original ya autenticada por el usuario. La ruta de abajo es la
    # que pyngrok administra por su cuenta y puede haber quedado con
    # un valor corrupto de una corrida anterior; set_auth_token() la
    # vuelve a escribir correctamente en cada arranque.
    Path(os.environ.get("LOCALAPPDATA", ""))
    / "Packages" / "ngrok.ngrok_1g87z0zv29zzc"
    / "LocalCache" / "Local" / "ngrok" / "ngrok.yml",
    Path(os.environ.get("LOCALAPPDATA", "")) / "ngrok" / "ngrok.yml",
]


def _read_authtoken_from_config(config_path):
    if not config_path.exists():
        return None
    for line in config_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.strip().startswith("authtoken:"):
            return line.split(":", 1)[1].strip().strip('"').strip("'")
    return None


def _discover_authtoken():
    env_token = os.environ.get("NGROK_AUTHTOKEN")
    if env_token:
        return env_token

    for config_path in _KNOWN_NGROK_CONFIG_PATHS:
        token = _read_authtoken_from_config(config_path)
        if token:
            return token

    return None


def open_tunnel(port):
    """Abre un tunel HTTPS publico hacia el puerto local dado.

    Devuelve la URL publica (str) si se pudo abrir, o None si ngrok
    no esta disponible/autenticado (el servidor sigue funcionando en
    modo solo-local en ese caso).
    """
    authtoken = _discover_authtoken()
    if not authtoken:
        print(
            "[ngrok] No se encontro un authtoken. Configuralo con "
            "'ngrok config add-authtoken <token>' (gratis en ngrok.com) "
            "o la variable de entorno NGROK_AUTHTOKEN. "
            "Corriendo solo en modo local."
        )
        return None

    ngrok.set_auth_token(authtoken)

    try:
        tunnel = ngrok.connect(port, "http")
    except Exception as error:
        print(f"[ngrok] No se pudo abrir el tunel publico: {error}")
        return None

    return tunnel.public_url


def close_tunnels():
    ngrok.kill()
