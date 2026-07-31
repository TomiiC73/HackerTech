# HackerBank

Laboratorio educativo de ciberseguridad creado para **HackerTech UTN-FRC**.
HackerBank es un banco ficticio que demuestra, en la práctica, cómo una
autenticación facial **insegura** (vulnerable a una foto, sin detección de
vida) puede saltarse incluso cuando forma parte de un esquema MFA
(contraseña + rostro).

> Este proyecto es exclusivamente educativo. No procesa dinero real, no está
> conectado a ningún sistema bancario real y las credenciales están
> hardcodeadas a propósito para el laboratorio.

## Instalación

### Requisitos
- Python 3.10 o superior
- Una cámara web

### Pasos

```bash
# 1. Clonar o descomprimir el proyecto y ubicarse en la carpeta banco_app/
cd banco_app

# 2. Crear y activar un entorno virtual
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Cargar los datos de laboratorio (usuario Sr. Vargas)
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

### Foto de referencia para el reconocimiento facial

El repositorio incluye un placeholder en `static/img/sr_vargas_reference.jpg`
(no es un rostro real, por lo que el detector de OpenCV no lo va a
reconocer como tal). Antes de intentar el desafío, reemplazá ese archivo
por una foto real de rostro, de frente y bien iluminada, que después
vas a poder mostrarle a la cámara para vulnerar el segundo factor.

## Cómo correr el proyecto

1. `python app.py` levanta Flask en modo debug sobre el puerto 5000.
2. Abrí `http://localhost:5000` en el navegador.
3. Ingresá con las credenciales de laboratorio (primer factor: contraseña):
   - Usuario: `dev+ht`
   - Contraseña: `2NEfv7M3+hlE`
4. Completá el segundo factor mostrando tu rostro a la cámara.

## Credenciales de laboratorio

| Campo | Valor |
|---|---|
| Usuario | dev+ht |
| Contraseña | 2NEfv7M3+hlE |

## El desafío: vulnerar el segundo factor facial

El login es MFA: primero contraseña, después una "verificación facial"
deliberadamente débil (`face_auth.py`) que compara un único frame de la
cámara contra las muestras guardadas del usuario usando detección de
rostro (Haar cascade de OpenCV) y similitud ORB. **No hay detección de
vida (liveness)**, así que mostrar una foto del Sr. Vargas a la cámara alcanza
para pasar ese segundo factor.

Pasos generales:
1. Conseguí/reemplazá `static/img/sr_vargas_reference.jpg` por una foto real de rostro.
2. Iniciá sesión con el email y contraseña de laboratorio.
3. En la pantalla de cámara, mostrale esa misma foto (impresa o en la
   pantalla de un celular) a la webcam, de frente y bien iluminada.
4. La verificación es continua (sin botón): si el algoritmo detecta
   suficiente similitud, vas a entrar directo al dashboard con los datos
   completos de la cuenta.

Para el detalle completo del ataque (distancias, iluminación, troubleshooting)
consultá [`INSTRUCTOR_GUIDE.md`](INSTRUCTOR_GUIDE.md).

## Por qué es vulnerable (resumen)

- El algoritmo solo mide similitud de apariencia 2D entre dos imágenes
  estáticas: no verifica movimiento, parpadeo, profundidad ni calor corporal.
- Una foto de buena calidad reproduce esa apariencia casi de forma idéntica
  al original, por lo que el sistema no puede distinguir "una persona real
  frente a la cámara" de "una foto de esa persona frente a la cámara".
- Tener contraseña como primer factor no alcanza si el segundo factor es
  trivial de falsificar: un atacante que consiga la contraseña (phishing,
  reutilización, filtración) y una foto de la víctima (redes sociales)
  supera igual el MFA completo.

## Cómo documentar el ataque

Para tu informe del desafío, incluí como mínimo:

1. **Captura de la foto de referencia** usada (o de dónde la obtuviste).
2. **Captura de la pantalla de login** con el email/contraseña ingresados.
3. **Captura del momento del ataque**: la foto siendo mostrada a la cámara
   en la pantalla de verificación facial.
4. **Captura del dashboard** ya autenticado, mostrando los datos de la cuenta.
5. Una breve explicación escrita (5-10 líneas) de por qué el ataque funcionó,
   en tus propias palabras.

## Estructura del proyecto

```
app.py                  Rutas Flask (paginas + APIs)
config.py               Constantes de configuracion
db.py                   Acceso a datos SQLite (consultas parametrizadas)
seed.py                 Carga el usuario de laboratorio
face_auth.py            Logica del segundo factor facial (inseguro, comentado)
static/                 CSS, JS y assets
templates/               Vistas Jinja2
INSTRUCTOR_GUIDE.md      Guia para el instructor del taller
```

## Stack técnico

- Backend: Python + Flask
- Base de datos: SQLite
- Reconocimiento facial: OpenCV
- Frontend: HTML/CSS/JS vanilla, sin frameworks
