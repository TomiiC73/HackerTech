"""
Script de siembra de datos para el laboratorio HackerBank.

Crea (o reemplaza) al usuario ficticio Sr. Vargas con sus
tarjetas y movimientos, para que el desafio tenga datos realistas
desde el primer arranque.

Uso:
    python seed.py
"""
from werkzeug.security import generate_password_hash

import config
import db
import face_auth

MOVEMENTS = [
    ("Supermercado La Anonima", "Consumo", -18450.00, "2026-07-10"),
    ("Transferencia recibida - Maria Lopez", "Transferencia", 45000.00, "2026-07-09"),
    ("Netflix", "Suscripcion", -4999.00, "2026-07-08"),
    ("Pago de sueldo", "Ingreso", 620000.00, "2026-07-01"),
    ("YPF Combustible", "Consumo", -22300.50, "2026-06-29"),
    ("Farmacity", "Consumo", -7650.00, "2026-06-27"),
]


def _create_demo_user():
    password_hash = generate_password_hash(config.DEMO_USER_PASSWORD)
    user_id = db.insert_user(
        email=config.DEMO_USER_EMAIL,
        password_hash=password_hash,
        full_name=config.DEMO_USER_NAME,
        dni=config.DEMO_USER_DNI,
        cbu=config.DEMO_USER_CBU,
        alias=config.DEMO_USER_ALIAS,
        balance_ars=config.DEMO_BALANCE_ARS,
        balance_usd=config.DEMO_BALANCE_USD,
        daily_yield_ars=config.DEMO_DAILY_YIELD_ARS,
    )
    db.insert_card(user_id, "credito", "Visa", "4821", "09/28")
    db.insert_card(user_id, "debito", "Mastercard", "3307", None)
    for description, category, amount, movement_date in MOVEMENTS:
        db.insert_movement(user_id, description, category, amount, movement_date)
    print(f"Usuario {config.DEMO_USER_NAME} creado con id={user_id}.")
    print(f"Email: {config.DEMO_USER_EMAIL}  Password: {config.DEMO_USER_PASSWORD}")
    return user_id


def _ensure_demo_face(user_id):
    """Enrola la foto de referencia del Sr. Vargas como su rostro (idempotente).

    Asi el usuario demo puede entrar por Modo A (facial) mostrando esa foto,
    sin depender de que alguien lo enrole a mano. Si la foto de referencia
    todavia es el placeholder sin rostro real, simplemente se avisa.
    """
    if db.count_faces_for_user(user_id) > 0:
        print("El Sr. Vargas ya tiene un rostro enrolado. Nada para hacer.")
        return

    result = face_auth.enroll_from_image_path(config.FACE_REFERENCE_PATH)
    if result.success:
        db.insert_face(user_id, result.face_png)
        print("Rostro del Sr. Vargas enrolado desde sr_vargas_reference.jpg.")
    else:
        print(f"No se pudo enrolar el rostro del Sr. Vargas: {result.reason}")
        print("Reemplazá static/img/sr_vargas_reference.jpg por una foto de rostro real y re-ejecutá seed.py.")


def seed():
    db.init_db()

    existing = db.get_user_by_email(config.DEMO_USER_EMAIL)
    if existing:
        user_id = existing["id"]
        print(f"El usuario {config.DEMO_USER_EMAIL} ya existe (id={user_id}).")
    else:
        user_id = _create_demo_user()

    _ensure_demo_face(user_id)


if __name__ == "__main__":
    seed()
