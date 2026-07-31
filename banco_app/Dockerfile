# HackerBank - imagen independiente (Flask + SQLite + OpenCV). No comparte
# contexto de build con utn_frc_redesign/.
FROM python:3.11-slim

# opencv-python (face_auth.py) necesita estas librerias de sistema para que
# "import cv2" funcione en una imagen slim, aunque la app corra sin GUI.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# seed.py es idempotente (no-op si el usuario demo ya existe): correrlo en
# cada arranque deja el contenedor listo para usar sin pasos manuales.
CMD ["sh", "-c", "python seed.py && python app.py"]
