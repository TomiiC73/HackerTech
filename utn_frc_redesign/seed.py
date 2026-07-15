"""
Carga el usuario de demo para probar el login tradicional. Idempotente:
no hace nada si el usuario ya existe.
"""
from werkzeug.security import generate_password_hash

import config
import db


def run():
    db.init_db()
    if db.email_exists(config.DEMO_USER_EMAIL):
        print(f"El usuario de demo ya existe ({config.DEMO_USER_EMAIL}). Nada que hacer.")
        return

    password_hash = generate_password_hash(config.DEMO_USER_PASSWORD)
    db.insert_user(
        legajo=config.DEMO_USER_LEGAJO,
        domain=config.DEMO_USER_DOMAIN,
        email=config.DEMO_USER_EMAIL,
        password_hash=password_hash,
        full_name=config.DEMO_USER_NAME,
        dni=config.DEMO_USER_DNI,
        role=config.DEMO_USER_ROLE,
    )
    print(f"Usuario de demo creado: legajo {config.DEMO_USER_LEGAJO}@{config.DEMO_USER_DOMAIN} / {config.DEMO_USER_PASSWORD}")


if __name__ == "__main__":
    run()
