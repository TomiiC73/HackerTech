#!/usr/bin/env bash
# Levanta uno de los dos laboratorios mostrando el progreso en tiempo real
# por etapa (build -> contenedor -> ngrok), con confirmacion explicita de
# cada una antes de pasar a la siguiente. Si algo falla, corta ahi mismo
# con un mensaje especifico de que paso fallo - nunca llega al resumen
# final como si hubiera salido bien.
#
# Uso:
#   ./deploy.sh hackerbank
#   ./deploy.sh utn-frc-redesign
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --------------------------------------------------------------------
# Logging: prefijo/icono distinto por tipo de mensaje + timestamp. Los
# colores solo se activan si la terminal realmente los soporta (TTY +
# NO_COLOR sin setear + tput con >=8 colores); si no, degrada a texto
# plano con el mismo prefijo, sin codigos ANSI de por medio.
# --------------------------------------------------------------------
supports_color() {
  [[ -t 1 ]] || return 1
  [[ -n "${NO_COLOR:-}" ]] && return 1
  command -v tput >/dev/null 2>&1 || return 1
  local n
  n="$(tput colors 2>/dev/null || echo 0)"
  [[ "$n" -ge 8 ]]
}

if supports_color; then
  C_RESET="$(tput sgr0)"
  C_INFO="$(tput setaf 4)"
  C_OK="$(tput setaf 2)"
  C_WARN="$(tput setaf 3)"
  C_ERR="$(tput setaf 1)"
  C_BOLD="$(tput bold)"
else
  C_RESET=""; C_INFO=""; C_OK=""; C_WARN=""; C_ERR=""; C_BOLD=""
fi

_ts() { date '+%H:%M:%S'; }

log_info() { printf '%s %s[INFO]%s %s\n' "$(_ts)" "$C_INFO" "$C_RESET" "$*"; }
log_ok()   { printf '%s %s[OK]%s ✅ %s\n' "$(_ts)" "$C_OK" "$C_RESET" "$*"; }
log_warn() { printf '%s %s[WARN]%s ⚠️  %s\n' "$(_ts)" "$C_WARN" "$C_RESET" "$*"; }
log_err()  { printf '%s %s[ERROR]%s ❌ %s\n' "$(_ts)" "$C_ERR" "$C_RESET" "$*" >&2; }
log_step() { printf '\n%s%s== %s ==%s\n' "$C_BOLD" "$C_INFO" "$*" "$C_RESET"; }

# Corta la ejecucion ahi mismo con un mensaje especifico de que paso
# fallo - nunca se llega al resumen final despues de esto.
fail() {
  local step="$1"; local msg="$2"
  echo ""
  log_err "Fallo en el paso '$step': $msg"
  log_err "Deploy abortado. No se ejecuto nada mas despues de este error."
  exit 1
}

usage() {
  echo "Uso: ./deploy.sh <proyecto>"
  echo ""
  echo "Proyectos disponibles:"
  echo "  hackerbank          Levanta banco_app/ (puerto 5000)"
  echo "  utn-frc-redesign    Levanta utn_frc_redesign/ (puerto 5001)"
}

PROJECT="${1:-}"

if [[ -z "$PROJECT" ]]; then
  usage
  exit 1
fi

# USES_NGROK distingue el paso de tunel publico: hackerbank ya no lo usa
# (se saco el tunel ngrok in-process de banco_app/), utn-frc-redesign si.
case "$PROJECT" in
  hackerbank)       DIR="banco_app";        PORT=5000; USES_NGROK=0 ;;
  utn-frc-redesign) DIR="utn_frc_redesign"; PORT=5001; USES_NGROK=1 ;;
  *)
    echo "Proyecto desconocido: '$PROJECT'"
    echo ""
    usage
    exit 1
    ;;
esac

# --------------------------------------------------------------------
# Paso 0: inicio
# --------------------------------------------------------------------
log_step "Paso 1/5: Inicio"
log_info "Proyecto: $PROJECT ($DIR/) -> puerto local $PORT"
log_info "Comando: docker compose build $PROJECT && docker compose up -d $PROJECT"

if ! command -v docker >/dev/null 2>&1; then
  fail "inicio" "No se encontro el comando 'docker' en el PATH. Instala Docker Desktop y volve a intentar."
fi
if ! docker compose version >/dev/null 2>&1; then
  fail "inicio" "El plugin 'docker compose' no esta disponible (docker compose version fallo). Actualiza Docker Desktop, que lo incluye por defecto."
fi

# 'docker info' puede quedarse colgado sin avisar nada si Docker Desktop
# todavia esta arrancando (comun en Windows, puede tardar 1-2 minutos). Se
# acota con timeout para fallar rapido y con un mensaje claro en vez de
# dejar el script en silencio indefinidamente.
log_info "Verificando que Docker este corriendo..."
if command -v timeout >/dev/null 2>&1; then
  DOCKER_INFO_STATUS=0
  timeout 15 docker info >/dev/null 2>&1 || DOCKER_INFO_STATUS=$?
  if [[ "$DOCKER_INFO_STATUS" -eq 124 ]]; then
    fail "inicio" "Docker no respondio en 15s (probablemente Docker Desktop todavia esta arrancando). Espera a que el icono de Docker Desktop este listo y volve a correr el script."
  elif [[ "$DOCKER_INFO_STATUS" -ne 0 ]]; then
    fail "inicio" "Docker no responde (el daemon/Docker Desktop no esta corriendo)."
  fi
else
  if ! docker info >/dev/null 2>&1; then
    fail "inicio" "Docker no responde (el daemon/Docker Desktop no esta corriendo)."
  fi
fi
log_ok "Docker esta corriendo"

# Primer uso: crea el .env del proyecto a partir de .env.example para que
# el comando funcione de entrada, sin pasos manuales previos.
if [[ ! -f "$DIR/.env" ]]; then
  if [[ -f "$DIR/.env.example" ]]; then
    cp "$DIR/.env.example" "$DIR/.env"
    log_ok "Se creo $DIR/.env a partir de $DIR/.env.example."
    if [[ "$USES_NGROK" -eq 1 ]]; then
      log_warn "Completa ahi el token de ngrok y los secretos antes de exponerlo en el evento."
    else
      log_warn "Completa ahi los secretos antes de exponerlo en el evento."
    fi
  else
    log_warn "No existe $DIR/.env ni $DIR/.env.example; 'docker compose' puede fallar al levantar el servicio."
  fi
else
  log_info "$DIR/.env ya existe, se usa tal cual."
fi

# Token de ngrok configurado por el usuario (si lo hay), para distinguir
# mas adelante "no configurado a proposito" de "configurado pero fallo".
# Solo aplica a proyectos que todavia usan ngrok (USES_NGROK=1).
TOKEN_CONFIGURED=0
if [[ "$USES_NGROK" -eq 1 ]] && [[ -f "$DIR/.env" ]] && grep -qE '^(HACKERBANK_NGROK_AUTHTOKEN|UTNFRC_NGROK_AUTHTOKEN|NGROK_AUTHTOKEN)=.+' "$DIR/.env"; then
  TOKEN_CONFIGURED=1
fi

# --------------------------------------------------------------------
# Paso 1: build de la imagen
# --------------------------------------------------------------------
log_step "Paso 2/5: Build de la imagen"
log_info "Buildeando imagen de $PROJECT..."

BUILD_LOG="$(mktemp)"
trap 'rm -f "$BUILD_LOG" "${UP_LOG:-}"' EXIT

set +e
docker compose build "$PROJECT" 2>&1 | tee "$BUILD_LOG"
BUILD_STATUS="${PIPESTATUS[0]}"
set -e

if [[ "$BUILD_STATUS" -ne 0 ]]; then
  fail "build" "'docker compose build $PROJECT' salio con codigo $BUILD_STATUS. Ultimas lineas del build:
$(tail -20 "$BUILD_LOG")"
fi
log_ok "Imagen de $PROJECT construida correctamente"

# --------------------------------------------------------------------
# Paso 2: levantar el contenedor
# --------------------------------------------------------------------
log_step "Paso 3/5: Levantar el contenedor"
log_info "Levantando contenedor de $PROJECT..."

UP_LOG="$(mktemp)"
if ! docker compose up -d "$PROJECT" >"$UP_LOG" 2>&1; then
  fail "levantar contenedor" "'docker compose up -d $PROJECT' fallo. Detalle:
$(cat "$UP_LOG")"
fi

CONTAINER_ID="$(docker compose ps -q "$PROJECT" 2>/dev/null || true)"
if [[ -z "$CONTAINER_ID" ]]; then
  fail "contenedor" "No se encontro el contenedor de $PROJECT despues de 'up'."
fi

CONTAINER_STATE="$(docker inspect -f '{{.State.Status}}' "$CONTAINER_ID" 2>/dev/null || echo "desconocido")"
if [[ "$CONTAINER_STATE" != "running" ]]; then
  fail "contenedor" "El contenedor de $PROJECT no quedo en estado 'running' (estado actual: $CONTAINER_STATE). Revisa 'docker compose logs $PROJECT'."
fi
log_info "Contenedor en estado 'running' (docker compose ps confirma 'Up'). Verificando que el servicio responda en el puerto $PORT..."

SERVICE_UP=0
for _ in $(seq 1 20); do
  if command -v curl >/dev/null 2>&1; then
    if curl -sf -o /dev/null --max-time 2 "http://localhost:$PORT/"; then
      SERVICE_UP=1
      break
    fi
  else
    # Sin curl disponible: se usa como senal de listo la linea que
    # imprime el propio servidor de desarrollo de Flask al arrancar.
    if docker compose logs "$PROJECT" 2>/dev/null | grep -q "Running on"; then
      SERVICE_UP=1
      break
    fi
  fi
  sleep 1
done

if [[ "$SERVICE_UP" -ne 1 ]]; then
  fail "contenedor" "El contenedor esta 'running' pero el servicio no respondio en http://localhost:$PORT despues de 20s. Revisa 'docker compose logs $PROJECT'."
fi
log_ok "Contenedor de $PROJECT corriendo y respondiendo en http://localhost:$PORT"

# --------------------------------------------------------------------
# Paso 3: tunel ngrok (solo para proyectos con USES_NGROK=1)
# --------------------------------------------------------------------
PUBLIC_URL=""
if [[ "$USES_NGROK" -eq 1 ]]; then
  log_step "Paso 4/5: Tunel ngrok"
  log_info "Iniciando/confirmando el tunel ngrok..."

  LOCAL_ONLY=0
  for _ in $(seq 1 30); do
    LOGS="$(docker compose logs "$PROJECT" 2>/dev/null || true)"

    if echo "$LOGS" | grep -q "disponible para cualquiera en:"; then
      PUBLIC_URL="$(echo "$LOGS" | grep "disponible para cualquiera en:" | tail -1 | sed 's/^.*disponible para cualquiera en: *//')"
      break
    fi

    if echo "$LOGS" | grep -q "corriendo solo en local"; then
      LOCAL_ONLY=1
      break
    fi

    sleep 1
  done

  if [[ -n "$PUBLIC_URL" ]]; then
    log_ok "Tunel ngrok activo"
    echo ""
    echo "${C_OK}${C_BOLD}――――――――――――――――――――――――――――――――――――――――――――――――${C_RESET}"
    echo "${C_OK}${C_BOLD}  URL publica (ngrok): $PUBLIC_URL${C_RESET}"
    echo "${C_OK}${C_BOLD}――――――――――――――――――――――――――――――――――――――――――――――――${C_RESET}"
  elif [[ "$LOCAL_ONLY" -eq 1 ]]; then
    if [[ "$TOKEN_CONFIGURED" -eq 1 ]]; then
      # Hay token puesto y aun asi no se pudo abrir el tunel: esto SI es
      # una falla real (no el modo local-only esperado por falta de token).
      fail "ngrok" "Hay un token de ngrok configurado en $DIR/.env pero el tunel no se pudo abrir. Revisa 'docker compose logs $PROJECT' para el error especifico."
    fi
    log_warn "No hay token de ngrok configurado en $DIR/.env: la app sigue disponible solo en local (esto es esperado, no un error)."
  else
    fail "ngrok" "No se pudo confirmar el estado del tunel ngrok despues de 30s (ni URL publica ni aviso de modo local en los logs). Revisa 'docker compose logs $PROJECT'."
  fi
else
  log_step "Paso 4/5: Acceso"
  log_ok "$PROJECT no expone tunel publico; queda disponible solo en local."
fi

# --------------------------------------------------------------------
# Paso 4: resumen final
# --------------------------------------------------------------------
log_step "Paso 5/5: Resumen"
echo ""
echo "${C_OK}${C_BOLD}=====================================================${C_RESET}"
if [[ -n "$PUBLIC_URL" ]]; then
  echo "${C_OK}${C_BOLD}✅ $PROJECT desplegado correctamente${C_RESET}"
  echo "→ App local: http://localhost:$PORT"
  echo "→ URL pública (ngrok): $PUBLIC_URL"
elif [[ "$USES_NGROK" -eq 1 ]]; then
  echo "${C_OK}${C_BOLD}✅ $PROJECT desplegado correctamente (modo local, sin ngrok)${C_RESET}"
  echo "→ App local: http://localhost:$PORT"
  echo "→ URL pública (ngrok): no disponible (sin token en $DIR/.env)"
else
  echo "${C_OK}${C_BOLD}✅ $PROJECT desplegado correctamente (modo local)${C_RESET}"
  echo "→ App local: http://localhost:$PORT"
fi
echo "${C_OK}${C_BOLD}=====================================================${C_RESET}"
echo ""
echo "Comandos utiles:"
echo "  docker compose logs -f $PROJECT     # ver logs en vivo"
echo "  docker compose restart $PROJECT     # reiniciar el contenedor"
echo "  docker compose down $PROJECT        # bajarlo"
echo "  docker compose ps                   # ver estado de ambos proyectos"
