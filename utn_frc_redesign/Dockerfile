# UTN-FRC redesign - imagen independiente (Flask + SQLite + frontend React
# buildeado con Vite + tunel ngrok in-process via pyngrok). No comparte
# contexto de build con banco_app/.

# ---- Etapa 1: build del frontend (Vite necesita Node, no vive en runtime) ----
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Etapa 2: runtime Flask ----
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Pisa cualquier frontend/dist que haya quedado commiteado localmente por
# el build fresco de la etapa anterior - la imagen siempre sirve la
# version actual de frontend/src, nunca una desactualizada.
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 5001

# seed.py es idempotente (no-op si el usuario demo ya existe): correrlo en
# cada arranque deja el contenedor listo para usar sin pasos manuales.
CMD ["sh", "-c", "python seed.py && python app.py"]
