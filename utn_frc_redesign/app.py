"""
Rediseño UTN-FRC: portal moderno con dos formas de iniciar sesión.

Punto de entrada Flask. Define las rutas de las paginas y la API de
autenticacion:
  - Ingreso tradicional: legajo + dominio ("@") + contraseña, un solo factor.
  - Modo B: la misma identificación (legajo + dominio + contraseña) más una
    confirmación FIDO2/WebAuthn obligatoria como segundo factor.
La logica de WebAuthn vive en webauthn_auth.py.
"""
import base64
import socket
from functools import wraps

import webauthn
from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from werkzeug.security import check_password_hash

import config
import db
import public_tunnel
import webauthn_auth

SERVER_PORT = 5001

app = Flask(__name__)
app.config.update(
    SECRET_KEY=config.FLASK_SECRET_KEY,
    SESSION_COOKIE_HTTPONLY=config.SESSION_COOKIE_HTTPONLY,
    SESSION_COOKIE_SAMESITE=config.SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECURE=config.SESSION_COOKIE_SECURE,
)

db.init_db()


def require_authenticated(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get(config.SESSION_KEY_AUTHENTICATED):
            return redirect(url_for("login_page"))
        return view(*args, **kwargs)
    return wrapped


def require_pre_auth(view):
    """Gatea rutas del segundo factor: legajo/dominio/contraseña ya validados,
    falta la confirmación FIDO2."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get(config.SESSION_KEY_PRE_AUTH):
            return redirect(url_for("login_page"))
        return view(*args, **kwargs)
    return wrapped


def _current_user():
    user_id = session.get(config.SESSION_KEY_USER_ID)
    return db.get_user_by_id(user_id) if user_id else None


def _current_pre_auth_user():
    user_id = session.get(config.SESSION_KEY_PRE_AUTH)
    return db.get_user_by_id(user_id) if user_id else None


def _webauthn_ids():
    """Deriva (rp_id, origin) del request real, igual que en banco_app."""
    proto = request.headers.get("X-Forwarded-Proto", request.scheme)
    host = request.host
    hostname = host.split(":")[0]
    origin = f"{proto}://{host}"
    return hostname, origin


def _login_user(user_id, via):
    session.clear()
    session[config.SESSION_KEY_USER_ID] = user_id
    session[config.SESSION_KEY_AUTHENTICATED] = True
    session[config.SESSION_KEY_AUTH_VIA] = via


def _identify_user(payload):
    """Valida legajo + dominio + contraseña. Devuelve (user, error_response)."""
    legajo = (payload.get("legajo") or "").strip()
    domain = (payload.get("domain") or "").strip().lower()
    password = payload.get("password", "")

    user = db.get_user_by_legajo(legajo, domain)
    if user is None or not check_password_hash(user["password_hash"], password):
        return None, (jsonify(ok=False, error="Legajo, dominio o contraseña incorrectos."), 401)
    return user, None


def _options_json(options):
    return webauthn.options_to_json(options), 200, {"Content-Type": "application/json"}


# --------------------------------------------------------------------
# Paginas
# --------------------------------------------------------------------
@app.route("/")
def index():
    return render_template(
        "index.html",
        news_items=config.NEWS_ITEMS,
        quick_access_items=config.QUICK_ACCESS_ITEMS,
    )


@app.route("/login")
def login_page():
    return render_template("login.html", domain_options=config.DOMAIN_OPTIONS, default_domain=config.DEFAULT_DOMAIN)


# --------------------------------------------------------------------
# API: contenido publico de la home (lo consume el frontend React de
# frontend/ via Vite proxy; evita duplicar NEWS_ITEMS/QUICK_ACCESS_ITEMS
# hardcodeados en JS ademas de en config.py).
# --------------------------------------------------------------------
@app.route("/api/home")
def api_home():
    return jsonify(
        news_items=config.NEWS_ITEMS,
        quick_access_items=config.QUICK_ACCESS_ITEMS,
        domain_options=config.DOMAIN_OPTIONS,
        default_domain=config.DEFAULT_DOMAIN,
    )


@app.route("/webauthn")
@require_pre_auth
def webauthn_confirm_page():
    return render_template("webauthn_confirm.html")


@app.route("/portal")
@require_authenticated
def portal():
    user = _current_user()
    return render_template(
        "portal.html",
        user=user,
        auth_via=session.get(config.SESSION_KEY_AUTH_VIA),
        has_passkey=db.has_webauthn_credential(user["id"]),
    )


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))


# --------------------------------------------------------------------
# API: ingreso tradicional (legajo + dominio + contraseña, un solo factor)
# --------------------------------------------------------------------
@app.route("/api/login", methods=["POST"])
def api_login():
    payload = request.get_json(silent=True) or {}
    user, error_response = _identify_user(payload)
    if error_response:
        return error_response

    _login_user(user["id"], via=config.AUTH_VIA_PASSWORD)
    return jsonify(ok=True, next=url_for("portal"))


# --------------------------------------------------------------------
# API: Modo B, paso 1 - misma identificación, pero exige un segundo factor
# FIDO2 a continuación. Requiere tener una passkey ya registrada.
# --------------------------------------------------------------------
@app.route("/api/login/mfa", methods=["POST"])
def api_login_mfa():
    payload = request.get_json(silent=True) or {}
    user, error_response = _identify_user(payload)
    if error_response:
        return error_response

    if not db.has_webauthn_credential(user["id"]):
        return jsonify(
            ok=False,
            error="Todavía no registraste una passkey. Ingresá con la opción tradicional y registrala desde Mi portal.",
        ), 409

    # Primer factor superado; falta la confirmación FIDO2.
    session.clear()
    session[config.SESSION_KEY_PRE_AUTH] = user["id"]
    return jsonify(ok=True, next=url_for("webauthn_confirm_page"))


# --------------------------------------------------------------------
# API: registro de una passkey (requiere estar logueado ya)
# --------------------------------------------------------------------
@app.route("/api/webauthn/register/begin", methods=["POST"])
@require_authenticated
def api_webauthn_register_begin():
    user = _current_user()
    rp_id, _origin = _webauthn_ids()
    options = webauthn_auth.build_registration_options(user, rp_id)
    session[config.SESSION_KEY_WEBAUTHN_CHALLENGE] = base64.b64encode(options.challenge).decode("ascii")
    return _options_json(options)


@app.route("/api/webauthn/register/complete", methods=["POST"])
@require_authenticated
def api_webauthn_register_complete():
    user = _current_user()
    rp_id, origin = _webauthn_ids()
    challenge_b64 = session.pop(config.SESSION_KEY_WEBAUTHN_CHALLENGE, None)
    credential_json = request.get_data(as_text=True)

    if not challenge_b64:
        return jsonify(ok=False, error="No hay un registro de passkey pendiente."), 400

    try:
        expected_challenge = base64.b64decode(challenge_b64)
        webauthn_auth.complete_registration(user, credential_json, expected_challenge, rp_id, origin)
    except Exception as error:
        # No se filtra el detalle interno al cliente: se loguea server-side
        # para debugging y se responde un mensaje generico.
        app.logger.warning("Registro de passkey fallido (user_id=%s): %s", user["id"], error)
        return jsonify(ok=False, error="No se pudo registrar la passkey."), 400

    return jsonify(ok=True)


# --------------------------------------------------------------------
# API: Modo B, paso 2 - confirmación FIDO2 del usuario ya identificado
# --------------------------------------------------------------------
@app.route("/api/webauthn/authenticate/begin", methods=["POST"])
@require_pre_auth
def api_webauthn_authenticate_begin():
    user = _current_pre_auth_user()
    rp_id, _origin = _webauthn_ids()
    options = webauthn_auth.build_authentication_options(user, rp_id)
    session[config.SESSION_KEY_WEBAUTHN_CHALLENGE] = base64.b64encode(options.challenge).decode("ascii")
    return _options_json(options)


@app.route("/api/webauthn/authenticate/complete", methods=["POST"])
@require_pre_auth
def api_webauthn_authenticate_complete():
    user = _current_pre_auth_user()
    rp_id, origin = _webauthn_ids()
    challenge_b64 = session.pop(config.SESSION_KEY_WEBAUTHN_CHALLENGE, None)
    credential_json = request.get_data(as_text=True)

    if not challenge_b64:
        return jsonify(ok=False, error="No hay una confirmación pendiente."), 400

    try:
        expected_challenge = base64.b64decode(challenge_b64)
        webauthn_auth.complete_authentication(user, credential_json, expected_challenge, rp_id, origin)
    except Exception as error:
        app.logger.warning("Confirmación FIDO2 fallida (user_id=%s): %s", user["id"], error)
        return jsonify(ok=False, error="No se pudo verificar tu passkey."), 400

    # Segundo factor superado: recien aca queda autenticado.
    _login_user(user["id"], via=config.AUTH_VIA_WEBAUTHN)
    return jsonify(ok=True, next=url_for("portal"))


def _get_lan_ip():
    """Detecta la IP de LAN de esta maquina (sin enviar trafico real)."""
    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        probe.connect(("8.8.8.8", 80))
        return probe.getsockname()[0]
    except OSError:
        return None
    finally:
        probe.close()


def _expose_publicly_via_ngrok():
    """Abre un tunel ngrok publico propio (puerto 5001) e imprime las URLs.

    Corre en su propio proceso de Python, con su propio agente de ngrok:
    la URL publica que obtiene es siempre distinta de la de banco_app
    (que tunelea el puerto 5000 desde su propio proceso), aunque ambos
    laboratorios usen el mismo authtoken/cuenta de ngrok.
    """
    public_url = public_tunnel.open_tunnel(SERVER_PORT)
    if not public_url:
        print(f"UTN-FRC redesign corriendo solo en local: http://localhost:{SERVER_PORT}")
        return

    lan_ip = _get_lan_ip()

    print("=" * 64)
    print(f"UTN-FRC redesign disponible para cualquiera en: {public_url}")
    print(f"(tambien accesible en local: http://localhost:{SERVER_PORT})")
    if lan_ip:
        print(f"(o en tu misma wifi, sin ngrok: http://{lan_ip}:{SERVER_PORT})")
    print("=" * 64)


if __name__ == "__main__":
    _expose_publicly_via_ngrok()
    try:
        # use_reloader=False: con el tunel ya abierto, el auto-reload de
        # Flask relanzaria este script y abriria un segundo tunel.
        app.run(debug=True, host="0.0.0.0", port=SERVER_PORT, use_reloader=False)
    finally:
        public_tunnel.close_tunnels()
