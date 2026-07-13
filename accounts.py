"""
Creacion de cuentas bancarias (alta de usuario).

Centraliza la logica de negocio para dar de alta una cuenta nueva con
datos realistas: genera CBU y alias, crea las tarjetas y siembra algunos
movimientos iniciales. Lo usan el flujo de signup (app.py) y, opcionalmente,
el script de siembra (seed.py).

Las consultas SQL viven en db.py (patron DAO); aca solo se arma el negocio.
"""
import random
import unicodedata
from datetime import date, timedelta

from werkzeug.security import generate_password_hash

import config
import db


def _strip_accents(text):
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def generate_alias(full_name):
    """Genera un alias tipo 'nombre.apellido.hb', unico en la base."""
    base = _strip_accents(full_name).lower().strip()
    parts = [p for p in base.replace("-", " ").split() if p]
    slug = ".".join(parts[:3]) if parts else "cuenta"
    alias = f"{slug}.hb"

    # Garantiza unicidad agregando un sufijo numerico si ya existe.
    suffix = 1
    with db.get_connection() as conn:
        while conn.execute("SELECT 1 FROM users WHERE alias = ?", (alias,)).fetchone():
            suffix += 1
            alias = f"{slug}.hb{suffix}"
    return alias


def generate_cbu():
    """Genera un CBU ficticio de 22 digitos (formato plausible, no validado)."""
    entity_block = config.BANK_ENTITY_NUMBER.zfill(3) + "0"      # 4 digitos
    branch_block = "".join(str(random.randint(0, 9)) for _ in range(4))
    check_1 = str(random.randint(0, 9))
    account_block = "".join(str(random.randint(0, 9)) for _ in range(13))
    return entity_block + branch_block + check_1 + account_block


def _generate_card_number_suffix():
    return "".join(str(random.randint(0, 9)) for _ in range(4))


def _future_expiry():
    today = date.today()
    year = (today.year + 4) % 100
    return f"{today.month:02d}/{year:02d}"


def _welcome_movements(balance_ars):
    """Movimientos iniciales para que la cuenta nueva no se vea vacia."""
    today = date.today()
    return [
        ("Apertura de cuenta HackerBank", "Bienvenida", 0.0, today.isoformat()),
        ("Deposito inicial", "Ingreso", balance_ars, (today - timedelta(days=1)).isoformat()),
    ]


def create_account(email, password, full_name, dni):
    """Crea una cuenta nueva completa y devuelve el user_id.

    Genera CBU y alias, guarda al usuario (con la contrasena hasheada),
    crea dos tarjetas y siembra un par de movimientos de bienvenida.
    """
    password_hash = generate_password_hash(password)
    cbu = generate_cbu()
    alias = generate_alias(full_name)
    balance_ars = config.NEW_ACCOUNT_BALANCE_ARS

    user_id = db.insert_user(
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        dni=dni,
        cbu=cbu,
        alias=alias,
        balance_ars=balance_ars,
        balance_usd=config.NEW_ACCOUNT_BALANCE_USD,
        daily_yield_ars=config.NEW_ACCOUNT_DAILY_YIELD_ARS,
    )

    db.insert_card(user_id, "credito", "Visa", _generate_card_number_suffix(), _future_expiry())
    db.insert_card(user_id, "debito", "Mastercard", _generate_card_number_suffix(), None)

    for description, category, amount, movement_date in _welcome_movements(balance_ars):
        db.insert_movement(user_id, description, category, amount, movement_date)

    return user_id
