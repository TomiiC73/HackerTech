# HackerBank

Laboratorio educativo de ciberseguridad creado para **HackerTech UTN-FRC**.
HackerBank es un banco ficticio que demuestra, en la práctica, la diferencia
entre una autenticación facial **insegura** (vulnerable a una foto) y una
autenticación **FIDO2/WebAuthn** real (segura frente a ese mismo ataque).

> Este proyecto es exclusivamente educativo. No procesa dinero real, no está
> conectado a ningún sistema bancario real y las credenciales están
> hardcodeadas a propósito para el laboratorio.

## Instalación

### Requisitos
- Python 3.10 o superior
- Una cámara web
- Windows Hello, Touch ID o una llave de seguridad FIDO2 (solo para probar el Modo B)
- Navegador moderno con soporte WebAuthn (Edge o Chrome recientes)

### Pasos

```bash
# 1. Clonar o descomprimir el proyecto y ubicarse en la carpeta
cd "Desafio Hackertech"

# 2. Crear y activar un entorno virtual
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Cargar los datos de laboratorio (usuario Carlos Rodríguez)
python seed.py

# 5. Levantar el servidor
python app.py
```

La aplicación queda disponible en **http://localhost:5000**.

### Acceso público con ngrok

Al ejecutar `python app.py`, la app intenta abrir automáticamente un túnel
público con [ngrok](https://ngrok.com/) para que cualquier persona (por
ejemplo, otros estudiantes en el evento) pueda probar el desafío desde su
propio dispositivo sin estar en la misma red.

Para que funcione necesitás ngrok instalado y autenticado una sola vez:

```bash
ngrok config add-authtoken <tu-token>   # gratis en https://dashboard.ngrok.com
```

Si no hay un authtoken configurado, la consola lo va a indicar y la app
sigue funcionando normalmente solo en `http://localhost:5000`.

Al levantar el servidor vas a ver algo así en la consola:

```
================================================================
HackerBank disponible para cualquiera en: https://xxxx-xxxx.ngrok-free.dev
(tambien accesible en local: http://localhost:5000)
================================================================
```

Compartí esa URL pública con quien quieras que pruebe el desafío. La
primera vez que alguien la visite, ngrok (plan gratuito) muestra una
pantalla de advertencia estándar ("Visit Site") antes de dejarlo pasar;
es un paso normal de ngrok, no un error de la app.

> Nota técnica: WebAuthn ata cada credencial al dominio (`origin`) desde
> el que se registró. Por eso, al abrir el túnel, la app ajusta
> automáticamente `WEBAUTHN_RP_ID`/`WEBAUTHN_ORIGIN` a la URL de ngrok, para
> que el Modo B funcione igual de bien público que en local.

### Foto de referencia para el Modo A

El repositorio incluye un placeholder en `static/img/carlos_reference.jpg`
(no es un rostro real, por lo que el detector de OpenCV no lo va a
reconocer como tal). Antes de intentar el desafío, reemplazá ese archivo
por una foto real de rostro, de frente y bien iluminada, que después
vas a poder mostrarle a la cámara para vulnerar el Modo A.

## Cómo correr el proyecto

1. `python app.py` levanta Flask en modo debug sobre el puerto 5000.
2. Abrí `http://localhost:5000` en el navegador.
3. Ingresá con las credenciales de laboratorio:
   - Email: `carlos@hackerbank.com`
   - Contraseña: `hacker2024`
4. Elegí **Modo A** (facial inseguro) o **Modo B** (FIDO2/WebAuthn).

## Credenciales de laboratorio

| Campo | Valor |
|---|---|
| Email | carlos@hackerbank.com |
| Contraseña | hacker2024 |

## El desafío: vulnerar el Modo A

El Modo A implementa una "verificación facial" deliberadamente débil
(`face_auth.py`): compara un único frame de la cámara contra la foto
de referencia usando detección de rostro (Haar cascade de OpenCV) y
similitud de histograma/ORB. **No hay detección de vida (liveness)**,
así que mostrar una foto de Carlos a la cámara es suficiente para pasar
la verificación.

Pasos generales:
1. Conseguí/reemplazá `static/img/carlos_reference.jpg` por una foto real de rostro.
2. Iniciá sesión eligiendo Modo A.
3. En la pantalla de cámara, mostrale esa misma foto (impresa o en la
   pantalla de un celular) a la webcam, de frente y bien iluminada.
4. Presioná "Verificar rostro". Si el algoritmo detecta suficiente
   similitud, vas a entrar al dashboard y vas a ver un banner explicando
   la vulnerabilidad y el código del desafío.

Para el detalle completo del ataque (distancias, iluminación, troubleshooting)
consultá [`INSTRUCTOR_GUIDE.md`](INSTRUCTOR_GUIDE.md).

## Por qué es vulnerable (resumen)

- El algoritmo solo mide similitud de apariencia 2D entre dos imágenes
  estáticas: no verifica movimiento, parpadeo, profundidad ni calor corporal.
- Una foto de buena calidad reproduce esa apariencia casi de forma idéntica
  al original, por lo que el sistema no puede distinguir "una persona real
  frente a la cámara" de "una foto de esa persona frente a la cámara".
- El Modo B (FIDO2/WebAuthn, en `webauthn_auth.py`) no tiene este problema
  porque la biometría nunca viaja por la red: solo desbloquea localmente
  una clave privada que firma un challenge aleatorio de un solo uso.

## Cómo documentar el ataque

Para tu informe del desafío, incluí como mínimo:

1. **Captura de la foto de referencia** usada (o de dónde la obtuviste).
2. **Captura de la pantalla de login** con el Modo A seleccionado.
3. **Captura del momento del ataque**: la foto siendo mostrada a la cámara
   en la pantalla de verificación facial.
4. **Captura del dashboard** mostrando el banner de vulnerabilidad y el
   código del desafío.
5. Una breve explicación escrita (5-10 líneas) de por qué el ataque funcionó,
   en tus propias palabras.
6. (Opcional, para nota extra) Una captura del flujo del Modo B mostrando
   que el mismo ataque con foto **no** funciona ahí.

## Estructura del proyecto

```
app.py                  Rutas Flask (paginas + APIs)
config.py               Constantes de configuracion
db.py                   Acceso a datos SQLite (consultas parametrizadas)
seed.py                 Carga el usuario de laboratorio
face_auth.py            Logica del Modo A (inseguro, comentado)
webauthn_auth.py        Logica del Modo B (FIDO2/WebAuthn)
static/                 CSS, JS y assets
templates/               Vistas Jinja2
INSTRUCTOR_GUIDE.md      Guia para el instructor del taller
```

## Stack técnico

- Backend: Python + Flask
- Base de datos: SQLite
- Reconocimiento facial (Modo A): OpenCV
- WebAuthn (Modo B): py_webauthn
- Frontend: HTML/CSS/JS vanilla, sin frameworks
