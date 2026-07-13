# Guía Maestra de Mejores Prácticas de Programación, Arquitectura y Seguridad (Versión Extendida)

Este documento establece un estándar exhaustivo de desarrollo de software, combinando los principios clásicos con las mejores prácticas modernas de ciberseguridad, Clean Code y diseño de APIs. Al leer este documento, la Inteligencia Artificial debe adherirse estrictamente a estos principios al generar, refactorizar o evaluar código.

## 1. Clean Code y Calidad del Código (Principios Fundamentales)

* **Regla del Boy Scout**: "Deja el código siempre más limpio de lo que lo encontraste". Aplicar refactorización continua y pequeñas mejoras durante el desarrollo diario.
* **Cero "Números Mágicos"**: No insertar números o literales directamente en la lógica del código. Utilizar constantes con nombres semánticos (ej. `const TAX_RATE = 0.2` en lugar de multiplicar por `0.2`).
* **Complejidad Ciclomática Controlada**: Las funciones o métodos no deben tener múltiples niveles de anidación (`if` dentro de `if` o bucles excesivos). Se debe favorecer el retorno temprano (*early return*).
* **KISS, DRY y YAGNI**:
    * **KISS (Keep It Simple, Stupid)**: Priorizar la legibilidad. Las soluciones complejas no deben comprometer la claridad del código.
    * **DRY (Don't Repeat Yourself)**: La lógica duplicada debe abstraerse en un solo lugar.
    * **YAGNI (You Aren't Gonna Need It)**: No implementar funcionalidades "por si acaso".

## 2. Diseño Orientado a Objetos (Java y Arquitectura General)

* **SOLID**: Cumplimiento riguroso de SRP (Responsabilidad Única), OCP (Abierto/Cerrado), LSP (Sustitución de Liskov), ISP (Segregación de Interfaces) y DIP (Inversión de Dependencias).
* **Composición sobre Herencia (Composite Reuse Principle)**: Minimizar la herencia de clases que genera acoplamiento fuerte y expone estados internos; preferir extender comportamiento inyectando dependencias o componiendo objetos.
* **Ley de Demeter (Principle of Least Knowledge)**: Un objeto solo debe interactuar con sus referencias directas. Evitar el encadenamiento excesivo de métodos (ej. `objeto.getA().getB().doSomething()`).
* **Separación de Intereses (SoC)**: Delimitar estrictamente responsabilidades a nivel arquitectónico (Capas: controladores, servicios, repositorios) y de programación.
* **Patrones GRASP**: Asignar responsabilidades correctamente (Creador, Experto en Información, Bajo Acoplamiento, Alta Cohesión, Controlador).

## 3. Seguridad Avanzada en APIs y Autenticación (JWT)

* **Gestión Segura de JWT (JSON Web Tokens)**:
    * **Validación de Algoritmo Server-Side**: Nunca confiar en el encabezado `alg` del token proporcionado por el cliente. El servidor debe forzar y verificar explícitamente el algoritmo (ej. `RS256` o `HS256`) para prevenir ataques de degradación a `none`.
    * **Ciclo de Vida Corto**: Implementar **Access Tokens** de vida corta (15 a 60 minutos) junto con **Refresh Tokens** de mayor duración, limitando así la ventana de exposición.
    * **Validación Exhaustiva de Claims**: El backend siempre debe validar las reclamaciones clave: expiración (`exp`), emisión (`iat`), emisor (`iss`) y audiencia (`aud`).
    * **Carga Útil (Payload) Ligera y Pública**: No incluir información sensible (contraseñas, PII, llaves) dentro del JWT, ya que está codificado en Base64, no encriptado.
* **Políticas CSP (Content Security Policy) Estrictas**:
    * Evitar a toda costa directivas vulnerables como `unsafe-inline` o `unsafe-eval`.
    * Utilizar listas de origen (whitelists) explícitas o, preferentemente, *nonces* (valores aleatorios únicos generados por el servidor por cada carga) o *hashes* para autorizar la ejecución de scripts.
* **Defensa de Infraestructura**: Integrar Rate Limiting (limitación de tasa) y bloqueos por intentos fallidos para prevenir fuerza bruta en los *endpoints* públicos.

## 4. Codificación Segura (Secure Coding Backend / Java)

* **Prevención de Inyecciones SQL/NoSQL**: Prohibición absoluta de concatenar cadenas para consultas a base de datos. Uso obligatorio de **Prepared Statements** (consultas parametrizadas) u ORMs seguros (como Hibernate/JPA con parámetros nombrados).
* **Peligros de la Serialización Nativa**: En ecosistemas como Java, evitar `java.io.Serializable` debido a los riesgos críticos de ejecución remota de código (RCE). Utilizar formatos seguros como JSON (ej. mediante Jackson, deshabilitando el tipado por defecto) o Protocol Buffers.
* **Criptografía Moderna y Segura**:
    * Nunca usar algoritmos obsoletos como MD5 o SHA-1. Estandarizar el uso de algoritmos fuertes como AES-GCM y utilizar protocolos TLS 1.2 o superior en el tránsito.
    * Evitar generadores de números pseudoaleatorios débiles (ej. `java.util.Random`); usar siempre alternativas criptográficamente seguras (`java.security.SecureRandom`).
* **Gestión Estricta de Secretos**: Ninguna credencial, token o clave de API debe vivir en el código fuente ni en archivos `application.properties` en texto plano. Obligatorio el uso de variables de entorno o sistemas como Vault.
* **Validación de Dependencias (SBOM)**: Mantener un seguimiento estricto de paquetes y librerías de terceros. Fijar (*pinning*) las versiones y analizarlas activamente en busca de CVEs (Common Vulnerabilities and Exposures).

## 5. Diseño de Base de Datos

* **Normalización Estricta**: Estructurar las bases de datos relacionales hasta la **Tercera Forma Normal (3NF)** para eliminar redundancia y anomalías de datos.
* **Problema de Impedancia**: Aplicar correctamente el patrón DAO (Data Access Object) o el uso de un framework de persistencia para mapear de forma limpia el paradigma orientado a objetos al modelo relacional.

## Instrucción de Ejecución para la IA:
Al momento de generar cualquier bloque de código a partir de esta guía, la IA debe:
1. Validar las entradas rigurosamente y sanitizar todas las salidas (especialmente en contextos web para prevenir XSS).
2. Asegurar que las clases sean altamente cohesivas y presenten el acoplamiento más bajo posible, separando limpiamente la capa de infraestructura de la capa de negocio.
3. Entregar código donde todo número o cadena estática esté documentado y refactorizado como constante.
4. Redactar lógica simple, enfocada a resolver un problema a la vez, con nombres declarativos en cada variable y función.
5. Aplicar validaciones seguras a los JWT y las transacciones con bases de datos por defecto, asumiendo un entorno hostil.
