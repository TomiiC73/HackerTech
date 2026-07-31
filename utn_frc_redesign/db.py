"""
Capa de acceso a datos (patron DAO) del rediseño UTN-FRC.

Toda consulta usa parametros posicionales (placeholders "?") de sqlite3.
Esta prohibido concatenar strings para armar SQL (prevencion de inyeccion SQL).
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
                legajo TEXT NOT NULL,
                domain TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                dni TEXT NOT NULL,
                role TEXT NOT NULL,
                UNIQUE (legajo, domain)
            );

            CREATE TABLE IF NOT EXISTS webauthn_credentials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                credential_id BLOB UNIQUE NOT NULL,
                public_key BLOB NOT NULL,
                sign_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT
            );
            """
        )


def get_user_by_legajo(legajo, domain):
    """Identifica a un usuario por legajo + dominio (el selector '@' del login)."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE legajo = ? AND domain = ?", (legajo, domain)
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


def insert_user(legajo, domain, email, password_hash, full_name, dni, role):
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO users (legajo, domain, email, password_hash, full_name, dni, role)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (legajo, domain, email, password_hash, full_name, dni, role),
        )
        return cursor.lastrowid


def save_webauthn_credential(user_id, credential_id, public_key, sign_count):
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO webauthn_credentials
                (user_id, credential_id, public_key, sign_count, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            """,
            (user_id, credential_id, public_key, sign_count),
        )


def get_webauthn_credentials_for_user(user_id):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM webauthn_credentials WHERE user_id = ?", (user_id,)
        ).fetchall()
        return [dict(row) for row in rows]


def has_webauthn_credential(user_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT 1 FROM webauthn_credentials WHERE user_id = ?", (user_id,)
        ).fetchone()
        return row is not None


def get_webauthn_credential_by_id(credential_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM webauthn_credentials WHERE credential_id = ?", (credential_id,)
        ).fetchone()
        return dict(row) if row else None


def update_webauthn_sign_count(credential_id, sign_count):
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE webauthn_credentials
            SET sign_count = ?
            WHERE credential_id = ?
            """,
            (sign_count, credential_id),
        )
