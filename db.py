"""
Capa de acceso a datos (patron DAO) de HackerBank.

Toda consulta usa parametros posicionales (placeholders "?") de sqlite3.
Esta prohibido concatenar strings para armar SQL en este proyecto,
segun mejores_practicas_programacion.md (prevencion de inyeccion SQL).
"""
import sqlite3
from contextlib import contextmanager

from config import DATABASE_PATH


@contextmanager
def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db():
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                dni TEXT NOT NULL,
                cbu TEXT NOT NULL,
                alias TEXT NOT NULL,
                balance_ars REAL NOT NULL,
                balance_usd REAL NOT NULL,
                daily_yield_ars REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                card_type TEXT NOT NULL,
                brand TEXT NOT NULL,
                last_four TEXT NOT NULL,
                expiry TEXT
            );

            CREATE TABLE IF NOT EXISTS movements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                movement_date TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS faces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                face_data BLOB NOT NULL
            );

            CREATE TABLE IF NOT EXISTS webauthn_credentials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                credential_id BLOB UNIQUE NOT NULL,
                public_key BLOB NOT NULL,
                sign_count INTEGER NOT NULL DEFAULT 0,
                method TEXT
            );

            CREATE TABLE IF NOT EXISTS webauthn_challenges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                challenge BLOB NOT NULL,
                purpose TEXT NOT NULL
            );
            """
        )
        _migrate(conn)


def _migrate(conn):
    """Migraciones idempotentes para bases ya creadas antes de un cambio de schema."""
    cols = [row["name"] for row in conn.execute("PRAGMA table_info(webauthn_credentials)")]
    if "method" not in cols:
        conn.execute("ALTER TABLE webauthn_credentials ADD COLUMN method TEXT")


def get_user_by_email(email):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        ).fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        return dict(row) if row else None


def email_exists(email):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT 1 FROM users WHERE email = ?", (email,)
        ).fetchone()
        return row is not None


def get_cards_for_user(user_id):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM cards WHERE user_id = ?", (user_id,)
        ).fetchall()
        return [dict(row) for row in rows]


def get_movements_for_user(user_id, limit=6):
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM movements
            WHERE user_id = ?
            ORDER BY movement_date DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()
        return [dict(row) for row in rows]


def insert_user(email, password_hash, full_name, dni, cbu, alias,
                 balance_ars, balance_usd, daily_yield_ars):
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO users
                (email, password_hash, full_name, dni, cbu, alias,
                 balance_ars, balance_usd, daily_yield_ars)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (email, password_hash, full_name, dni, cbu, alias,
             balance_ars, balance_usd, daily_yield_ars),
        )
        return cursor.lastrowid


def insert_card(user_id, card_type, brand, last_four, expiry):
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO cards (user_id, card_type, brand, last_four, expiry)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, card_type, brand, last_four, expiry),
        )


def insert_movement(user_id, description, category, amount, movement_date):
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO movements (user_id, description, category, amount, movement_date)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, description, category, amount, movement_date),
        )


def insert_face(user_id, face_data):
    """Guarda una muestra de rostro (PNG del recorte normalizado) para un usuario."""
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO faces (user_id, face_data) VALUES (?, ?)",
            (user_id, face_data),
        )


def get_all_faces():
    """Devuelve todas las muestras de rostro de todos los usuarios.

    Cada elemento es (user_id, face_data). Lo usa el Modo A para comparar
    un frame de camara contra cada rostro guardado (busqueda 1:N).
    """
    with get_connection() as conn:
        rows = conn.execute("SELECT user_id, face_data FROM faces").fetchall()
        return [(row["user_id"], row["face_data"]) for row in rows]


def count_faces_for_user(user_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS n FROM faces WHERE user_id = ?", (user_id,)
        ).fetchone()
        return row["n"]


def save_webauthn_credential(user_id, credential_id, public_key, sign_count, method=None):
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO webauthn_credentials (user_id, credential_id, public_key, sign_count, method)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, credential_id, public_key, sign_count, method),
        )


def get_webauthn_credentials_for_user(user_id):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM webauthn_credentials WHERE user_id = ?", (user_id,)
        ).fetchall()
        return [dict(row) for row in rows]


def get_webauthn_methods_for_user(user_id):
    """Devuelve la lista de metodos FIDO2 configurados (labels legibles)."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT method FROM webauthn_credentials WHERE user_id = ? AND method IS NOT NULL",
            (user_id,),
        ).fetchall()
        return [row["method"] for row in rows]


def get_webauthn_credential_by_id(credential_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM webauthn_credentials WHERE credential_id = ?", (credential_id,)
        ).fetchone()
        return dict(row) if row else None


def update_webauthn_sign_count(credential_id, sign_count):
    with get_connection() as conn:
        conn.execute(
            "UPDATE webauthn_credentials SET sign_count = ? WHERE credential_id = ?",
            (sign_count, credential_id),
        )


def save_webauthn_challenge(user_id, challenge, purpose):
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM webauthn_challenges WHERE user_id = ? AND purpose = ?",
            (user_id, purpose),
        )
        conn.execute(
            "INSERT INTO webauthn_challenges (user_id, challenge, purpose) VALUES (?, ?, ?)",
            (user_id, challenge, purpose),
        )


def get_webauthn_challenge(user_id, purpose):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM webauthn_challenges WHERE user_id = ? AND purpose = ?",
            (user_id, purpose),
        ).fetchone()
        return dict(row) if row else None


def delete_webauthn_challenge(user_id, purpose):
    """Borra un challenge tras usarse: cada challenge es de un solo uso."""
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM webauthn_challenges WHERE user_id = ? AND purpose = ?",
            (user_id, purpose),
        )
