# Guía del instructor — HackerBank (HackerTech UTN-FRC)

Este documento es exclusivamente para el equipo docente/organizador. Contiene
la solución completa del desafío: no compartir con los estudiantes antes del
cierre del laboratorio.

---

## 1. Descripción del objetivo y contexto pedagógico

HackerBank simula un banco digital con un login MFA de dos factores:

- **Primer factor**: usuario y contraseña (estándar).
- **Segundo factor**: autenticación facial construida a propósito de forma
  insegura (sin liveness detection), para que el estudiante la vulnere
  mostrando una foto a la cámara.

El objetivo pedagógico es que el estudiante:

1. Explote una falla real y común en sistemas de reconocimiento facial mal
   implementados (comparación estática, sin verificación de vida).
2. Entienda **por qué** funciona el ataque a nivel técnico.
3. Entienda que un segundo factor "biométrico" no aporta seguridad real si
   es trivial de falsificar — el MFA completo cae igual que un solo factor.

## 2. Solución paso a paso del ataque

1. Levantar la aplicación (`python app.py`) y cargar los datos de laboratorio
   (`python seed.py`).
2. **Antes del evento**: reemplazar `static/img/sr_vargas_reference.jpg` por una
   foto real de un rostro (puede ser una foto de stock, o del propio
   instructor/actor que haga de "Sr. Vargas"). Debe ser una foto:
   - De frente, con ambos ojos y la boca visibles.
   - Bien iluminada, sin sombras fuertes sobre la cara.
   - Con el rostro ocupando una porción significativa del encuadre
     (similar a una foto de documento).
3. El estudiante abre `http://localhost:5000/login` e ingresa con
   `dev+ht` / `2NEfv7M3+hlE` (primer factor).
4. En la pantalla de cámara (segundo factor), el estudiante debe mostrar
   **la misma foto** (impresa en papel o en la pantalla de un celular/tablet)
   frente a la webcam.
   - **Distancia recomendada**: 20-40 cm de la cámara, de forma que el
     rostro de la foto llene buena parte del cuadro guía.
   - **Iluminación**: ambiente con luz uniforme, evitar reflejos sobre la
     pantalla del celular si se usa esa opción (preferible imprimir la
     foto o bajar el brillo de reflejo).
   - **Encuadre**: mantener la foto quieta y derecha dentro del marco
     dorado un par de segundos; la verificación es continua y no requiere
     presionar ningún botón.
5. Mientras el rostro está encuadrado, el backend (varias veces por
   segundo, automáticamente):
   - Detecta el rostro en el frame capturado (Haar cascade).
   - Lo compara contra las muestras de rostro guardadas del usuario
     usando conteo de features ORB compatibles.
   - Si el conteo supera el umbral configurado (`FACE_ORB_MIN_MATCHES`
     en `config.py`), el segundo factor se acepta.
6. Al lograrlo, el estudiante entra directo al dashboard con los datos
   completos de la cuenta (sin ningún banner ni aviso: el login "funcionó"
   como si fuera legítimo, que es justamente el punto pedagógico — el
   sistema no tiene forma de saber que fue una foto).

## 3. Explicación técnica de por qué funciona el ataque

El módulo [`face_auth.py`](face_auth.py) implementa, a propósito, una
verificación **sin liveness detection**:

- Procesa **frames estáticos** de a uno (cada intento es independiente,
  sin memoria de intentos anteriores ni de movimiento entre frames).
- Mide **similitud de apariencia 2D** (features ORB, comparaciones
  locales de contraste) entre ese frame y las muestras de rostro guardadas
  del usuario.
- No verifica ningún indicio de "vida": no pide parpadear, no mide
  movimiento entre frames, no usa profundidad (no hay cámara 3D/infrarroja
  disponible en una webcam estándar), no analiza textura de piel a nivel
  microscópico.

Como resultado, una foto de buena calidad reproduce la misma apariencia 2D
que el original, y el algoritmo no tiene ninguna señal para distinguir
"persona real frente a cámara" de "foto de esa persona frente a cámara".
Tener contraseña como primer factor no cambia nada: el atacante solo
necesita además una foto de la víctima, mucho más fácil de conseguir
(redes sociales, LinkedIn, cámaras de seguridad) que robar un segundo
factor criptográfico real.

## 4. Material teórico para el instructor

### 4.1 Qué es liveness detection y sus variantes

La detección de vida (*liveness detection*) es el conjunto de técnicas que
verifican que la biometría capturada proviene de una persona viva presente
físicamente, y no de una réplica (foto, video, máscara, deepfake).

Variantes comunes:

- **Liveness activo (challenge-response)**: se le pide al usuario una acción
  aleatoria e impredecible en el momento (parpadear, sonreír, girar la
  cabeza, leer un número en voz alta). Una foto estática no puede reaccionar
  a un desafío que no conocía de antemano.
- **Liveness pasivo por movimiento**: analiza micro-movimientos naturales
  entre frames consecutivos (temblor involuntario, cambios de expresión)
  sin pedirle nada explícito al usuario.
- **Textura y profundidad 3D**: usa sensores de profundidad (structured
  light, ToF) o estructura estéreo para verificar que el objeto frente a
  la cámara tiene volumen real, no es una superficie plana (una foto o
  pantalla). Face ID de Apple es un ejemplo con proyector de puntos
  infrarrojos.
- **Luz infrarroja / reflectancia**: la piel real refleja la luz IR de
  forma distinta a papel o una pantalla LCD/OLED, lo que permite
  distinguir un rostro real de una reproducción.
- **Análisis de textura de alta frecuencia**: busca patrones de moiré,
  pixelado o artefactos de reimpresión/reproducción típicos de fotos o
  pantallas.

### 4.2 Cómo se resuelve esto de raíz (estándares reales)

Los estándares de autenticación fuerte modernos (FIDO2/WebAuthn) no
intentan "detectar mejor" si hay una persona real frente a la cámara:
cambian el modelo de amenaza por completo.

- El servidor nunca recibe datos biométricos, ni siquiera una imagen.
- La biometría (huella, rostro, PIN) se usa **exclusivamente en el
  dispositivo del usuario** para desbloquear una clave privada que ya
  existe ahí, generada en el momento del registro.
- Esa clave privada firma un **challenge aleatorio de un solo uso**
  generado por el servidor. La firma solo es válida para ese challenge
  específico; no se puede reutilizar ni replicar mostrando algo a una
  cámara.
- Aunque un atacante consiga una foto perfecta del usuario, no tiene forma
  de producir la firma criptográfica sin acceso físico al autenticador.

En otras palabras: el segundo factor de HackerBank protege un secreto
comparándolo contra una copia (vulnerable a falsificación de esa copia);
un esquema FIDO2/WebAuthn nunca transmite el secreto, solo prueba posesión
de una clave mediante criptografía.

### 4.3 Vectores de ataque contra este segundo factor

| Vector de ataque | Resultado |
|---|---|
| Mostrar una foto a la cámara | Funciona (es el desafío) |
| Robar las muestras de rostro de la base de datos | Suficiente para vulnerar a ese usuario en cualquier estación |
| Interceptar tráfico de red | Podría exponer el frame enviado (no está cifrado a nivel de aplicación, solo por HTTPS de transporte si lo hay) |
| Phishing (sitio falso con contraseña + cámara falsa) | El atacante puede capturar contraseña y una foto/video en un solo paso |
| Replay de un frame capturado | Posible si se reenvía el mismo frame o uno similar, porque no hay desafío aleatorio de un solo uso |

### 4.4 Preguntas sugeridas para el debate post-desafío

1. ¿Qué otras formas de "liveness detection" conocen y cómo las hubieran
   implementado con solo una webcam?
2. Si un sistema de reconocimiento facial tuviera liveness activo (pedir
   parpadear), ¿qué tipo de ataque seguiría siendo posible? (pista: video
   con deepfake, ataques de replay con video pregrabado).
3. ¿Por qué un esquema FIDO2/WebAuthn ata la firma al `origin` (dominio)
   que hizo la petición? ¿Qué ataque previene específicamente eso?
4. ¿Alcanza con "agregar un segundo factor" para tener MFA seguro, o
   importa también qué tan falsificable es ese segundo factor?
5. ¿Qué balance existe entre UX (comodidad) y seguridad al elegir un
   segundo factor biométrico?

## 5. Rúbrica de evaluación sugerida

Puntaje total sugerido: **100 puntos**.

| Sección | Qué debe incluir el informe | Puntos |
|---|---|---|
| Evidencia del ataque | Capturas de: foto de referencia usada, login con contraseña, momento del ataque frente a cámara, dashboard ya autenticado | 35 |
| Explicación técnica del ataque | Explicación propia (no copiada) de por qué la comparación estática sin liveness permite el spoofing | 30 |
| Propuesta de mitigación | Al menos una mejora concreta y técnicamente viable (ej. liveness activo, IR, migrar a un estándar FIDO2/WebAuthn real) con justificación | 20 |
| Claridad y prolijidad del informe | Redacción clara, capturas legibles y bien referenciadas | 15 |

Criterio de corte sugerido: un informe sin capturas del ataque completo
(login + cámara + dashboard) no puede superar 50 puntos totales.

## 6. Notas de setup para el día del evento

### Requisitos de hardware

- Una cámara web por estación (integrada de laptop alcanza).
- Iluminación ambiente uniforme, sin contraluz fuerte detrás del
  estudiante (dificulta la detección de rostro tanto real como en foto).

### Cómo preparar el entorno antes del HackerTech

1. Clonar el proyecto en cada estación (o distribuir un zip).
2. Verificar Python 3.10+ instalado.
3. Ejecutar `pip install -r requirements.txt` con anticipación (evita
   depender del wifi del evento para descargar `opencv-python`, que pesa
   varios MB).
4. **Reemplazar `static/img/sr_vargas_reference.jpg`** por una foto real de
   rostro apta para el ataque (ver sección 2). Confirmar que el mismo
   archivo (o una impresión/foto de él) esté disponible para que los
   estudiantes lo usen contra la cámara.
5. Ejecutar `python seed.py` una vez por estación para cargar los datos.
6. Probar el flujo completo en al menos una estación antes de que lleguen
   los estudiantes.

### Problemas comunes y cómo resolverlos en el momento

| Problema | Causa probable | Solución rápida |
|---|---|---|
| "No se detecto ningun rostro" | Poca luz, foto muy chica en el encuadre, ángulo torcido | Acercar la foto, mejorar iluminación, encuadrar de frente |
| El ataque no pasa el umbral aunque se ve bien | La foto usada para el ataque no coincide con la que se usó para enrolar al usuario | Usar exactamente la misma imagen que está en `sr_vargas_reference.jpg` |
| La cámara no se activa en el navegador | Permisos de cámara bloqueados o sitio servido sin contexto seguro | `getUserMedia` requiere `localhost` o HTTPS; verificar permisos del navegador |

### Tiempo estimado por estudiante

- Instalación y arranque (si no está preparado de antemano): 10-15 min.
- Explorar la app y entender el objetivo: 5 min.
- Ejecutar el ataque (con foto de referencia ya provista): 5-10 min.
- Redacción del informe: 20-30 min.

**Total sugerido por estudiante: 40-60 minutos.**
