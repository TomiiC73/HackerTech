"""
HackerBank - Laboratorio de autenticacion facial (HackerTech UTN-FRC).

Punto de entrada Flask. Define las rutas de las pantallas y las APIs
de los dos modos de autenticacion. La logica de seguridad de cada modo
vive en face_auth.py (Modo A, inseguro) y webauthn_auth.py (Modo B,
FIDO2/WebAuthn).
"""
import socket
from functools import wraps

from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from werkzeug.security import check_password_hash

import accounts
import config
import db
import face_auth
import public_tunnel
import webauthn_auth

SERVER_PORT = 5000

app = Flask(__name__)
app.config["SECRET_KEY"] = config.FLASK_SECRET_KEY

db.init_db()


def _format_currency(amount):
    """Formatea un numero con separador de miles '.' y decimales ',' (es-AR)."""
    is_negative = amount < 0
    formatted = f"{abs(amount):,.2f}".replace(",", "_").replace(".", ",").replace("_", ".")
    return f"-{formatted}" if is_negative else formatted


app.jinja_env.filters["currency"] = _format_currency


# --------------------------------------------------------------------
# Guards de sesion
# --------------------------------------------------------------------
def require_pre_auth(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get(config.SESSION_KEY_PRE_AUTH):
            return redirect(url_for("login_page"))
        return view(*args, **kwargs)
    return wrapped


def require_authenticated(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get(config.SESSION_KEY_AUTHENTICATED):
            return redirect(url_for("login_page"))
        return view(*args, **kwargs)
    return wrapped


def _current_user():
    user_id = session.get(config.SESSION_KEY_PRE_AUTH)
    return db.get_user_by_id(user_id) if user_id else None


def _webauthn_ids():
    """Deriva (rp_id, origin) del request real para WebAuthn.

    WebAuthn ata cada credencial al origin exacto del navegador. Detras de
    ngrok, Flask ve el request como http aunque el navegador este en https:
    por eso se respeta X-Forwarded-Proto. Asi el Modo B funciona igual en
    localhost o en el dominio publico de ngrok, sin hardcodear nada.
    """
    proto = request.headers.get("X-Forwarded-Proto", request.scheme)
    host = request.host                 # incluye el puerto, ej "localhost:5000"
    hostname = host.split(":")[0]       # rp_id NO lleva puerto
    origin = f"{proto}://{host}"
    return hostname, origin


def _account_view(user):
    """Datos derivados de la cuenta para el dashboard (solo presentacion)."""
    cbu = user["cbu"]
    account_number = f"{cbu[3:7]} / {cbu[8:]}" if len(cbu) >= 12 else cbu
    return {
        "account_number": account_number,
        "account_type": config.ACCOUNT_TYPE_LABEL,
        "branch": config.BANK_BRANCH_LABEL,
        "bic": config.BANK_BIC,
        "status": "Activa",
    }


def _login_user(user_id, via):
    """Marca la sesion como autenticada para un usuario."""
    session.clear()
    session[config.SESSION_KEY_PRE_AUTH] = user_id
    session[config.SESSION_KEY_AUTHENTICATED] = True
    session[config.SESSION_KEY_AUTH_VIA] = via


# --------------------------------------------------------------------
# Paginas
# --------------------------------------------------------------------
@app.route("/")
def landing():
    return render_template(
        "landing.html",
        usd_buy=config.PUBLIC_USD_BUY,
        usd_sell=config.PUBLIC_USD_SELL,
        eur_buy=config.PUBLIC_EUR_BUY,
        eur_sell=config.PUBLIC_EUR_SELL,
        loan_max_ars=config.PUBLIC_LOAN_MAX_ARS,
        loan_tna=config.PUBLIC_LOAN_TNA_PERCENT,
        fixed_deposit_tna=config.PUBLIC_FIXED_DEPOSIT_TNA_PERCENT,
        fixed_deposit_min_days=config.PUBLIC_FIXED_DEPOSIT_MIN_DAYS,
        credit_card_tna=config.PUBLIC_CREDIT_CARD_TNA_PERCENT,
        support_phone=config.PUBLIC_SUPPORT_PHONE,
        support_hours=config.PUBLIC_SUPPORT_HOURS,
        branches=config.PUBLIC_BRANCHES,
    )


@app.route("/login")
def login_page():
    return render_template("login.html")


@app.route("/signup")
def signup_page():
    return render_template("signup.html")


@app.route("/face")
def face_page():
    # Modo A ahora es identificacion 1:N: la camara es el paso de identidad,
    # no un segundo factor. Por eso esta pagina es publica (no requiere un
    # usuario ya identificado por contrasena).
    return render_template("face_auth.html")


@app.route("/webauthn")
@require_pre_auth
def webauthn_page():
    if session.get(config.SESSION_KEY_AUTH_MODE) != config.AUTH_MODE_WEBAUTHN:
        return redirect(url_for("login_page"))
    user = _current_user()
    return render_template(
        "webauthn_auth.html",
        has_credential=webauthn_auth.has_registered_credential(user["id"]),
        methods=db.get_webauthn_methods_for_user(user["id"]),
    )


@app.route("/dashboard")
@require_authenticated
def dashboard():
    user = _current_user()
    cards = db.get_cards_for_user(user["id"])
    movements = db.get_movements_for_user(user["id"])
    return render_template(
        "dashboard.html",
        user=user,
        cards=cards,
        movements=movements,
        account=_account_view(user),
        fido2_methods=db.get_webauthn_methods_for_user(user["id"]),
    )


@app.route("/compare")
def compare():
    return render_template("compare.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("landing"))


# --------------------------------------------------------------------
# API: alta de cuenta nueva (con enrolamiento de rostro)
# --------------------------------------------------------------------
@app.route("/api/signup", methods=["POST"])
def api_signup():
    payload = request.get_json(silent=True) or {}
    full_name = (payload.get("full_name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    dni = (payload.get("dni") or "").strip()
    frames = payload.get("faces") or []

    if not full_name or not email or not password or not dni:
        return jsonify(ok=False, error="Completá todos los campos."), 400
    if len(password) < 6:
        return jsonify(ok=False, error="La contraseña debe tener al menos 6 caracteres."), 400
    if db.email_exists(email):
        return jsonify(ok=False, error="Ya existe una cuenta con ese email."), 409

    # Se extraen los rostros ANTES de crear la cuenta: si ninguno tiene un
    # rostro detectable, no se crea nada.
    face_samples = []
    for frame in frames:
        result = face_auth.enroll(frame)
        if result.success:
            face_samples.append(result.face_png)

    if len(face_samples) < config.FACE_ENROLL_MIN_SAMPLES:
        return jsonify(
            ok=False,
            error="No se detectó tu rostro. Encuadrá tu cara y volvé a intentar.",
        ), 400

    user_id = accounts.create_account(email, password, full_name, dni)
    for face_png in face_samples:
        db.insert_face(user_id, face_png)

    _login_user(user_id, via=config.AUTH_MODE_FACE)
    return jsonify(ok=True, next=url_for("dashboard"), samples=len(face_samples))


# --------------------------------------------------------------------
# API: login Modo B (email + contrasena -> luego FIDO2)
# --------------------------------------------------------------------
@app.route("/api/login", methods=["POST"])
def api_login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password", "")

    user = db.get_user_by_email(email)
    if user is None or not check_password_hash(user["password_hash"], password):
        return jsonify(ok=False, error="Email o contraseña incorrectos."), 401

    # Primer factor (contrasena) superado; falta el segundo factor FIDO2.
    session.clear()
    session[config.SESSION_KEY_PRE_AUTH] = user["id"]
    session[config.SESSION_KEY_AUTH_MODE] = config.AUTH_MODE_WEBAUTHN
    return jsonify(ok=True, next=url_for("webauthn_page"))


# --------------------------------------------------------------------
# API: Modo A - identificacion facial 1:N contra los rostros guardados
# --------------------------------------------------------------------
@app.route("/api/face/identify", methods=["POST"])
def api_face_identify():
    payload = request.get_json(silent=True) or {}
    frame_b64 = payload.get("frame")
    if not frame_b64:
        return jsonify(ok=False, error="Falta el frame de camara."), 400

    result = face_auth.identify(frame_b64, db.get_all_faces())

    if result.success:
        _login_user(result.user_id, via=config.AUTH_MODE_FACE)

    return jsonify(
        ok=result.success,
        score=result.score,
        reason=result.reason,
        next=url_for("dashboard") if result.success else None,
    )


# --------------------------------------------------------------------
# API: Modo B - WebAuthn / FIDO2
# --------------------------------------------------------------------
@app.route("/api/webauthn/register/begin", methods=["POST"])
@require_pre_auth
def api_webauthn_register_begin():
    user = _current_user()
    rp_id, _origin = _webauthn_ids()
    payload = request.get_json(silent=True) or {}
    method = payload.get("method", "huella")
    # Se recuerda el metodo elegido para persistirlo al completar el registro
    # (el body de /complete es la credencial cruda de WebAuthn, sin este dato).
    session["webauthn_method"] = method
    options_json = webauthn_auth.build_registration_options(user, rp_id, method)
    return options_json, 200, {"Content-Type": "application/json"}


@app.route("/api/webauthn/register/complete", methods=["POST"])
@require_pre_auth
def api_webauthn_register_complete():
    user = _current_user()
    rp_id, origin = _webauthn_ids()
    method = session.get("webauthn_method", "huella")
    credential_json = request.get_data(as_text=True)
    try:
        webauthn_auth.complete_registration(user, credential_json, rp_id, origin, method)
    except Exception as error:
        return jsonify(ok=False, error=str(error)), 400
    return jsonify(ok=True)


@app.route("/api/webauthn/authenticate/begin", methods=["POST"])
@require_pre_auth
def api_webauthn_authenticate_begin():
    user = _current_user()
    rp_id, _origin = _webauthn_ids()
    options_json = webauthn_auth.build_authentication_options(user, rp_id)
    return options_json, 200, {"Content-Type": "application/json"}


@app.route("/api/webauthn/authenticate/complete", methods=["POST"])
@require_pre_auth
def api_webauthn_authenticate_complete():
    if session.get(config.SESSION_KEY_AUTH_MODE) != config.AUTH_MODE_WEBAUTHN:
        return jsonify(ok=False, error="Modo incorrecto."), 400

    user = _current_user()
    rp_id, origin = _webauthn_ids()
    credential_json = request.get_data(as_text=True)
    try:
        webauthn_auth.complete_authentication(user, credential_json, rp_id, origin)
    except Exception as error:
        return jsonify(ok=False, error=str(error)), 400

    session[config.SESSION_KEY_AUTHENTICATED] = True
    session[config.SESSION_KEY_AUTH_VIA] = config.AUTH_MODE_WEBAUTHN
    return jsonify(ok=True, next=url_for("dashboard"))


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
    """Abre un tunel ngrok publico e imprime las URLs de acceso."""
    public_url = public_tunnel.open_tunnel(SERVER_PORT)
    if not public_url:
        print(f"HackerBank corriendo solo en local: http://localhost:{SERVER_PORT}")
        return

    # rp_id/origin de WebAuthn ya no se fijan aca: se derivan del request
    # real en cada peticion (ver _webauthn_ids), asi funcionan tanto en
    # localhost como en el dominio de ngrok sin pisarse.
    lan_ip = _get_lan_ip()

    print("=" * 64)
    print(f"HackerBank disponible para cualquiera en: {public_url}")
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
