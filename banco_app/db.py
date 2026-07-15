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
            """
        )


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


def count_faces_for_user(user_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS n FROM faces WHERE user_id = ?", (user_id,)
        ).fetchone()
        return row["n"]


def get_faces_for_user(user_id):
    """Devuelve las muestras de rostro (PNG) de un usuario, para verificacion 1:1."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT face_data FROM faces WHERE user_id = ?", (user_id,)
        ).fetchall()
        return [row["face_data"] for row in rows]
