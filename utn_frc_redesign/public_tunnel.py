"""
Publica este laboratorio en internet via ngrok para que cualquiera pueda
probarlo sin exponer manualmente el puerto local ni configurar port
forwarding.

Identico en logica a banco_app/public_tunnel.py (cada proyecto corre en su
propio proceso de Python, asi que cada uno abre su PROPIO agente de ngrok
en su PROPIO puerto -5001 aca, 5000 en banco_app-). No hay import
compartido entre proyectos a proposito: son labs independientes.

El authtoken de ngrok NUNCA se hardcodea en este repo (secreto). Se
resuelve, en orden de prioridad, desde:
  1. La variable de entorno UTNFRC_NGROK_AUTHTOKEN (especifica de ESTE
     laboratorio: usala si queres una cuenta/dominio de ngrok distinto
     al de banco_app).
  2. La variable de entorno NGROK_AUTHTOKEN (compartida, mismo nombre que
     usa banco_app).
  3. La configuracion de una instalacion de ngrok ya autenticada en este
     equipo (por ejemplo la app de Microsoft Store), solo como fallback
     de comodidad para desarrollo local.
Si no se encuentra ninguno, el laboratorio sigue funcionando en modo
solo-local y se informa como resolverlo.

------------------------------------------------------------------
IMPORTANTE sobre "URL distinta por laboratorio" (comprobado en la practica):
------------------------------------------------------------------
Con el MISMO authtoken/cuenta, el plan gratuito de ngrok asigna un
hostname *.ngrok-free.dev persistente A NIVEL DE CUENTA, no uno nuevo por
cada conexion. Eso significa que banco_app y este proyecto, si usan el
mismo NGROK_AUTHTOKEN, van a terminar mostrando LA MISMA url publica cada
vez que se ejecutan (aunque sea en procesos/puertos distintos), y si se
ejecutan AL MISMO TIEMPO el segundo agente directamente falla al abrir su
tunel (ERR_NGROK_334, "endpoint ya esta online") hasta que el primero se
cierre.

Para que este laboratorio tenga una URL realmente distinta a la de
banco_app, seteá UTNFRC_NGROK_AUTHTOKEN con el token de una SEGUNDA cuenta
de ngrok (gratis) dedicada a este proyecto. Sin esa variable, este modulo
cae al mismo NGROK_AUTHTOKEN que banco_app y comparte su limitacion.
Opcionalmente tambien podes fijar UTNFRC_NGROK_DOMAIN si tu cuenta de
ngrok tiene un dominio propio reservado.
"""
import os
from pathlib import Path

from pyngrok import ngrok

_AUTHTOKEN_ENV_VARS = ["UTNFRC_NGROK_AUTHTOKEN", "NGROK_AUTHTOKEN"]
_DOMAIN_ENV_VAR = "UTNFRC_NGROK_DOMAIN"

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
    for env_var in _AUTHTOKEN_ENV_VARS:
        env_token = os.environ.get(env_var)
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
    no esta disponible/autenticado/ya tiene otra sesion abierta (el
    servidor sigue funcionando en modo solo-local en ese caso).
    """
    authtoken = _discover_authtoken()
    if not authtoken:
        print(
            "[ngrok] No se encontro un authtoken. Configuralo con "
            "'ngrok config add-authtoken <token>' (gratis en ngrok.com), "
            f"o las variables de entorno {_AUTHTOKEN_ENV_VARS[0]} / {_AUTHTOKEN_ENV_VARS[1]}. "
            "Corriendo solo en modo local."
        )
        return None

    ngrok.set_auth_token(authtoken)

    connect_kwargs = {}
    domain = os.environ.get(_DOMAIN_ENV_VAR)
    if domain:
        connect_kwargs["domain"] = domain

    try:
        tunnel = ngrok.connect(port, "http", **connect_kwargs)
    except Exception as error:
        print(f"[ngrok] No se pudo abrir el tunel publico: {error}")
        return None

    return tunnel.public_url


def close_tunnels():
    ngrok.kill()
