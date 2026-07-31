"""
HackerBank - Laboratorio de autenticacion facial (HackerTech UTN-FRC).

Punto de entrada Flask. Define las rutas de las pantallas y la API de
autenticacion MFA: usuario/contrasena (primer factor) + rostro (segundo
factor, INSEGURO a proposito). La logica de seguridad vive en
face_auth.py.
"""
import socket
from functools import wraps

from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from werkzeug.security import check_password_hash

import bomb_notify
import config
import db
import face_auth
import rate_limit

SERVER_PORT = 5000

app = Flask(__name__)
app.config.update(
    SECRET_KEY=config.FLASK_SECRET_KEY,
    SESSION_COOKIE_HTTPONLY=config.SESSION_COOKIE_HTTPONLY,
    SESSION_COOKIE_SAMESITE=config.SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECURE=config.SESSION_COOKIE_SECURE,
)

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


def _login_user(user_id):
    """Marca la sesion como autenticada para un usuario."""
    session.clear()
    session[config.SESSION_KEY_PRE_AUTH] = user_id
    session[config.SESSION_KEY_AUTHENTICATED] = True


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


@app.route("/face")
@require_pre_auth
def face_page():
    return render_template("face_auth.html")


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
    )


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("landing"))


# --------------------------------------------------------------------
# API: login MFA - contrasena (1er factor) + rostro (2do factor)
# --------------------------------------------------------------------
@app.route("/api/login", methods=["POST"])
def api_login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password", "")

    # Proteccion de fuerza bruta: se limita por cuenta atacada (email).
    rate_key = f"login:{email}"
    if rate_limit.is_blocked(rate_key, config.LOGIN_MAX_ATTEMPTS, config.LOGIN_WINDOW_SECONDS):
        return jsonify(ok=False, error="Demasiados intentos. Esperá unos minutos."), 429

    user = db.get_user_by_email(email)
    if user is None or not check_password_hash(user["password_hash"], password):
        rate_limit.record_failure(rate_key, config.LOGIN_WINDOW_SECONDS)
        return jsonify(ok=False, error="Email o contraseña incorrectos."), 401

    rate_limit.reset(rate_key)

    # Primer factor (contrasena) superado; falta el segundo factor facial.
    # session.clear() regenera el contenido de sesion (mitiga fijacion de sesion).
    session.clear()
    session[config.SESSION_KEY_PRE_AUTH] = user["id"]

    return jsonify(ok=True, next=url_for("face_page"))


# --------------------------------------------------------------------
# API: segundo factor facial (INSEGURO: sin liveness detection).
# Verificacion 1:1 contra los rostros del usuario ya identificado por
# contrasena. Sigue siendo vulnerable a mostrar una foto de ese usuario:
# esa es la debilidad pedagogica del lab, a proposito.
# --------------------------------------------------------------------
@app.route("/api/face/verify", methods=["POST"])
@require_pre_auth
def api_face_verify():
    payload = request.get_json(silent=True) or {}
    frame_b64 = payload.get("frame")
    if not frame_b64:
        return jsonify(ok=False, error="Falta el frame de cámara."), 400

    user = _current_user()
    user_faces = [(user["id"], face_png) for face_png in db.get_faces_for_user(user["id"])]
    result = face_auth.identify(frame_b64, user_faces)

    # Segundo factor superado: recien aca queda autenticado. Solo se notifica
    # la primera vez (si el usuario ya estaba autenticado y vuelve a /face a
    # re-verificar, no hace falta disparar el POST de nuevo).
    if result.success:
        ya_autenticado = session.get(config.SESSION_KEY_AUTHENTICATED, False)
        session[config.SESSION_KEY_AUTHENTICATED] = True
        if not ya_autenticado:
            bomb_notify.notify_desactivated()

    return jsonify(
        ok=result.success,
        score=result.score,
        reason=result.reason,
        next=url_for("dashboard") if result.success else None,
    )


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


if __name__ == "__main__":
    lan_ip = _get_lan_ip()
    print(f"HackerBank disponible en: http://localhost:{SERVER_PORT}")
    if lan_ip:
        print(f"(o en tu misma wifi: http://{lan_ip}:{SERVER_PORT})")
    app.run(debug=True, host="0.0.0.0", port=SERVER_PORT)
