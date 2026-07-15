# GUIA DE ESTANDARES Y BUENAS PRACTICAS DE DESARROLLO

> **Documento oficial de arquitectura y calidad de código**
> Versión: 1.0.0 | Clasificación: Interno | Rol: Ingeniero Senior / CIO

---

## INDICE

1. [Filosofia de Desarrollo](#filosofia-de-desarrollo)
2. [Codigo Limpio (Clean Code)](#codigo-limpio-clean-code)
3. [Principios SOLID](#principios-solid)
4. [Principios de Diseno Orientado a Objetos (POO)](#principios-de-diseno-orientado-a-objetos-poo)
5. [Patrones GRASP](#patrones-grasp)
6. [Patrones de Diseno](#patrones-de-diseno)
7. [Arquitectura de Software](#arquitectura-de-software)
8. [Manejo de Errores](#manejo-de-errores)
9. [Testing y Calidad](#testing-y-calidad)
10. [Seguridad en Profundidad](#seguridad-en-profundidad)
11. [Logging Seguro y Monitoreo](#logging-seguro-y-monitoreo)
12. [Autenticacion y Gestion de Sesiones](#autenticacion-y-gestion-de-sesiones)
13. [Modelado de Datos y Persistencia](#modelado-de-datos-y-persistencia)
14. [Despliegue y Entornos](#despliegue-y-entornos)
15. [Rendimiento](#rendimiento)
16. [Documentacion y Comentarios](#documentacion-y-comentarios)
17. [Control de Versiones (Git)](#control-de-versiones-git)
18. [Checklist de Code Review](#checklist-de-code-review)
19. [Variables de Entorno](#variables-de-entorno)
20. [Estilo de Respuesta de la IA](#estilo-de-respuesta-de-la-ia)

---

## FILOSOFIA DE DESARROLLO

Como equipo de ingeniería, nos regimos por los siguientes principios fundamentales:

- **El código se escribe para humanos primero, máquinas después.**
- **La simplicidad es la máxima sofisticación.** Si un fragmento de código necesita un comentario extenso para entenderse, debe ser reescrito.
- **No repitas lógica: DRY (Don't Repeat Yourself).**
- **No hagas más de lo necesario: YAGNI (You Ain't Gonna Need It).**
- **Deja el código mejor de como lo encontraste: Boy Scout Rule.**
- **El código que funciona no es suficiente; debe ser mantenible, escalable y seguro.**

---

## CÓDIGO LIMPIO (CLEAN CODE)

### 1. Nomenclatura

```
 CORRECTO
- Variables y funciones: camelCase         → getUserById(), totalAmount
- Clases e interfaces: PascalCase          → UserService, IPaymentGateway
- Constantes: UPPER_SNAKE_CASE             → MAX_RETRY_ATTEMPTS, API_BASE_URL
- Archivos: kebab-case                     → user-service.ts, payment-gateway.ts
- Booleanos: prefijo "is", "has", "can"    → isActive, hasPermission, canEdit
```

```
 INCORRECTO
- data, info, temp, foo, bar, x, d1
- getUserData() cuando debería ser getUser()
- flag, status (sin contexto claro)
- ProcessData() mezclando convenciones
```

### 2. Funciones y Métodos

**Reglas obligatorias:**
- **Una función = una responsabilidad.** Si necesitas la palabra "y" para describirla, divídela.
- **Máximo 20 líneas por función.** Si supera esto, refactoriza.
- **Máximo 3 parámetros.** Si necesitas más, usa un objeto de configuración.
- **No uses flags/booleanos como parámetros** — indican que la función hace dos cosas.

```typescript
//  MAL: hace demasiado, nombre vago
function process(data: any, flag: boolean, type: string) {
  if (flag) {
    // lógica A...
  } else {
    // lógica B...
  }
}

//  BIEN: separado, claro, enfocado
function sendWelcomeEmail(user: User): Promise<void> {
  // solo envía el email de bienvenida
}

function activateUserAccount(userId: string): Promise<void> {
  // solo activa la cuenta
}
```

### 3. Variables y Estado

```typescript
//  MAL
let d = new Date();
let arr = users.filter(u => u.a === true);

//  BIEN
const currentDate = new Date();
const activeUsers = users.filter(user => user.isActive);
```

- Preferir `const` sobre `let`. Nunca `var`.
- Declarar variables cerca de donde se usan.
- Evitar variables globales. El estado compartido es la raíz de muchos bugs.
- Inmutabilidad por defecto: no mutar objetos, retornar nuevas instancias.

### 4. Números Mágicos y Strings Mágicos

```typescript
//  MAL
if (user.role === 2) { ... }
setTimeout(callback, 86400000);

//  BIEN
const ADMIN_ROLE_ID = 2;
const ONE_DAY_IN_MS = 86_400_000;

if (user.role === ADMIN_ROLE_ID) { ... }
setTimeout(callback, ONE_DAY_IN_MS);
```

---

## PRINCIPIOS SOLID

### S — Single Responsibility Principle (SRP)
> Una clase/módulo debe tener **una sola razón para cambiar**.

```typescript
//  MAL: UserService hace demasiado
class UserService {
  getUser() { ... }
  sendEmail() { ... }        // responsabilidad del EmailService
  generateReport() { ... }  // responsabilidad del ReportService
  saveToDatabase() { ... }  // responsabilidad del Repository
}

//  BIEN: cada clase tiene un único propósito
class UserService { getUser() { ... } }
class EmailService { sendWelcomeEmail() { ... } }
class UserRepository { save() { ... } }
```

### O — Open/Closed Principle (OCP)
> El código debe estar **abierto a extensión, cerrado a modificación**.

```typescript
//  BIEN: agregar nuevos descuentos sin tocar la lógica existente
interface DiscountStrategy {
  calculate(price: number): number;
}

class SeasonalDiscount implements DiscountStrategy {
  calculate(price: number) { return price * 0.9; }
}

class LoyaltyDiscount implements DiscountStrategy {
  calculate(price: number) { return price * 0.85; }
}

class PriceCalculator {
  constructor(private discount: DiscountStrategy) {}
  getPrice(price: number) { return this.discount.calculate(price); }
}
```

### L — Liskov Substitution Principle (LSP)
> Las subclases deben poder **reemplazar a su clase base** sin romper el sistema.

### I — Interface Segregation Principle (ISP)
> Muchas interfaces específicas son mejores que una **interfaz general**.

```typescript
//  MAL
interface Animal {
  fly(): void;
  swim(): void;
  run(): void;
}

//  BIEN
interface Flyable { fly(): void; }
interface Swimmable { swim(): void; }
interface Runnable { run(): void; }

class Duck implements Flyable, Swimmable { ... }
class Dog implements Runnable, Swimmable { ... }
```

### D — Dependency Inversion Principle (DIP)
> Depender de **abstracciones, no de implementaciones concretas**.

```typescript
//  MAL: acoplado a la implementación
class OrderService {
  private db = new MySQLDatabase(); // dependencia concreta
}

//  BIEN: depende de la abstracción (interfaz)
interface IDatabase { save(data: any): Promise<void>; }

class OrderService {
  constructor(private db: IDatabase) {} // inyección de dependencias
}
```

---

## PRINCIPIOS DE DISEÑO ORIENTADO A OBJETOS (POO)

Estos son los pilares fundamentales del paradigma orientado a objetos que todo el codigo del proyecto debe respetar. Extraidos del marco conceptual de la catedra DSI.

### Abstraccion

Centrarse en las caracteristicas esenciales de un objeto con relacion a la perspectiva del observador. Una clase es una abstraccion de la realidad que representa un conjunto de objetos con el mismo estado y comportamiento.

### Cohesion

Mide la fuerza con la que se relacionan las responsabilidades dentro de una clase. Una clase con alta cohesion tiene un numero reducido de operaciones con funcionalidad relacionada y evita hacer trabajo no relacionado. La cohesion evita duplicaciones porque cada pieza de informacion o funcionalidad existe en un unico lugar.

**Alta cohesion — beneficios:**
- Mejoran la claridad y la facilidad de comprension.
- Simplifican la evolucion y el mantenimiento.
- Generan bajo acoplamiento como efecto natural.
- Soportan mayor capacidad de reutilizacion.

**Baja cohesion — problemas:**
- Dificiles de entender y reutilizar.
- Dificiles de mantener.
- Constantemente afectadas por cambios no relacionados.

### Encapsulamiento

Permite ocultar el estado e implementacion interna de un objeto. El mundo exterior solo interactua mediante la interfaz publica. Nunca exponer el estado interno directamente.

```typescript
// INCORRECTO: estado interno expuesto
class BankAccount {
  public balance: number = 0;
}

// CORRECTO: estado encapsulado, acceso controlado
class BankAccount {
  private balance: number = 0;

  deposit(amount: number): void {
    if (amount <= 0) throw new Error("El monto debe ser positivo");
    this.balance += amount;
  }

  getBalance(): number {
    return this.balance;
  }
}
```

### Polimorfismo

Un metodo u operacion puede tener diferentes implementaciones en distintas clases, pero con la misma firma o interfaz. Permite tratar objetos de distintas clases de manera uniforme.

```typescript
interface Shape {
  area(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  area(): number { return Math.PI * this.radius ** 2; }
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  area(): number { return this.width * this.height; }
}

// El codigo cliente no sabe ni le importa que Shape especifica esta usando
function printArea(shape: Shape): void {
  console.log(`Area: ${shape.area()}`);
}
```

### Bajo Acoplamiento

El acoplamiento mide la fuerza con que un elemento esta conectado a, tiene conocimiento de, o confia en otros elementos. Se busca que las clases tengan la menor dependencia posible entre si.

**Alto acoplamiento — problemas:**
- Los cambios en clases relacionadas fuerzan cambios locales.
- Son dificiles de entender de forma aislada.
- Son dificiles de reutilizar porque requieren la presencia de otras clases.

**Regla:** Un grado moderado de acoplamiento es normal en un sistema OO. El objetivo no es cero acoplamiento (eso aisla completamente la clase), sino minimizarlo de forma razonada.

---

## PATRONES GRASP

Los Patrones de Principios Generales para Asignar Responsabilidades (GRASP) definen a quien se le asigna cada responsabilidad en el diseno orientado a objetos. Son la base para construir diagramas de secuencia y de clases coherentes.

### 1. Controlador

**Problema:** Quien debe tener la responsabilidad de controlar un mensaje de un actor externo hacia el sistema?

**Solucion:** Usar una clase de control que estructura, coordina y ejecuta la logica. El controlador no pertenece a la GUI; es responsable de recibir o manejar un evento del sistema. Se usa el Controlador de Caso de Uso: una clase controladora por cada caso de uso.

**Beneficios:**
- Garantiza que los procesos del dominio sean manejados por la capa del dominio, no por la de interfaz.
- Permite razonar sobre el estado de un caso de uso y asegurar que las operaciones ocurran en la secuencia correcta.

### 2. Experto en Informacion

**Problema:** Cual es el principio general para asignar responsabilidades a los objetos?

**Solucion:** Asignar la responsabilidad a la clase que tiene la informacion necesaria para realizarla. El metodo se pone donde estan los atributos que ese metodo necesita para funcionar.

**Beneficio:** Produce bajo acoplamiento porque el comportamiento se distribuye entre las clases que cuentan con la informacion requerida.

### 3. Creador

**Problema:** Donde conviene poner la invocacion del constructor (`new`) para crear un objeto? En que clase ponemos la responsabilidad de crear a otra clase?

**Solucion:** Asignar a la clase A la responsabilidad de crear instancias de B si se cumple alguna de estas condiciones:
- A agrega objetos de B (agregacion).
- A esta compuesta por objetos de B (composicion).
- A contiene o registra objetos de B.
- A tiene la informacion de inicializacion de B.

**Beneficio:** Ayuda al bajo acoplamiento porque la clase creada ya es visible al creador por razones de dominio, sin agregar dependencias artificiales.

### 4. Bajo Acoplamiento

**Problema:** Como soportar bajas dependencias, bajo impacto del cambio e incremento de la reutilizacion?

**Solucion:** Asignar las responsabilidades de manera que el acoplamiento permanezca bajo. La clase no debe necesitar muchas relaciones con otras para cumplir su funcion.

### 5. Alta Cohesion

**Problema:** Como mantener la complejidad manejable?

**Solucion:** Asignar las responsabilidades de manera que la cohesion permanezca alta. Una clase de alta cohesion tiene pocas operaciones, todas con funcionalidad relacionada, y colabora con otros objetos para compartir el esfuerzo si la tarea es grande.

---

## PATRONES DE DISEÑO

Los patrones de diseno son soluciones reutilizables a problemas recurrentes en el diseno de software. Se dividen en tres categorias: creacionales, estructurales y de comportamiento.

### PATRONES CREACIONALES

Tratan sobre la creacion de objetos, evitando dependencias rigidas entre clases concretas.

#### Singleton
**Cuando usarlo:** Para recursos compartidos como conexiones a base de datos, loggers, configuraciones de sistema.

```typescript
class DatabaseConnection {
  private static instance: DatabaseConnection;

  private constructor() {
    // inicializacion costosa solo una vez
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
}
```

#### Factory Method
**Cuando usarlo:** Para crear objetos sin especificar la clase exacta, delegando la decision a subclases. Proporciona una interfaz en la superclase mientras permite a las subclases alterar el tipo de objeto que se creara.

```typescript
interface Notification { send(message: string): void; }

class EmailNotification implements Notification {
  send(message: string) { console.log(`Email: ${message}`); }
}

class SMSNotification implements Notification {
  send(message: string) { console.log(`SMS: ${message}`); }
}

class NotificationFactory {
  static create(type: "email" | "sms"): Notification {
    const types = { email: EmailNotification, sms: SMSNotification };
    return new types[type]();
  }
}
```

#### Abstract Factory
**Cuando usarlo:** Para producir familias de objetos relacionados sin especificar sus clases concretas. Util cuando el sistema debe ser independiente de como sus productos se crean.

```typescript
interface Button { render(): void; }
interface Checkbox { toggle(): void; }

interface UIFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

class WindowsUIFactory implements UIFactory {
  createButton(): Button { return new WindowsButton(); }
  createCheckbox(): Checkbox { return new WindowsCheckbox(); }
}

class MacUIFactory implements UIFactory {
  createButton(): Button { return new MacButton(); }
  createCheckbox(): Checkbox { return new MacCheckbox(); }
}
```

#### Builder
**Cuando usarlo:** Para construir objetos complejos con muchos parametros opcionales. Evita constructores con listas largas de argumentos.

```typescript
class QueryBuilder {
  private query: string = "";
  private conditions: string[] = [];
  private limitValue?: number;

  select(table: string): this {
    this.query = `SELECT * FROM ${table}`;
    return this;
  }

  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }

  limit(n: number): this {
    this.limitValue = n;
    return this;
  }

  build(): string {
    let sql = this.query;
    if (this.conditions.length) sql += ` WHERE ${this.conditions.join(" AND ")}`;
    if (this.limitValue) sql += ` LIMIT ${this.limitValue}`;
    return sql;
  }
}

const query = new QueryBuilder()
  .select("users")
  .where("is_active = true")
  .where("role = 'admin'")
  .limit(10)
  .build();
```

#### Prototype
**Cuando usarlo:** Para copiar objetos existentes sin que el codigo dependa de sus clases concretas. Util cuando la creacion de un objeto es costosa y se necesitan variantes.

```typescript
interface Cloneable<T> {
  clone(): T;
}

class UserProfile implements Cloneable<UserProfile> {
  constructor(
    public name: string,
    public permissions: string[],
    public settings: Record<string, unknown>
  ) {}

  clone(): UserProfile {
    return new UserProfile(
      this.name,
      [...this.permissions],
      { ...this.settings }
    );
  }
}

const adminTemplate = new UserProfile("Admin", ["read", "write", "delete"], { theme: "dark" });
const newAdmin = adminTemplate.clone();
newAdmin.name = "Carlos";
```

---

### PATRONES ESTRUCTURALES

Explican como ensamblar objetos y clases en estructuras mas grandes, manteniendo la flexibilidad y eficiencia.

#### Repository Pattern
**Cuando usarlo:** Para abstraer el acceso a datos y desacoplar la logica de negocio de la persistencia. Obligatorio en toda aplicacion con base de datos.

```typescript
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

class UserRepository implements IUserRepository {
  constructor(private db: IDatabase) {}

  async findById(id: string): Promise<User | null> {
    return this.db.query("SELECT * FROM users WHERE id = ?", [id]);
  }
}

class UserService {
  constructor(private userRepo: IUserRepository) {}

  async getActiveUser(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new UserNotFoundError(id);
    if (!user.isActive) throw new InactiveUserError(id);
    return user;
  }
}
```

#### Adapter
**Cuando usarlo:** Para permitir la colaboracion entre objetos con interfaces incompatibles. Muy util para integrar librerias externas o APIs de terceros sin contaminar el codigo propio.

```typescript
class StripePaymentAPI {
  chargeCard(amount: number, token: string) { /* implementacion de Stripe */ }
}

interface IPaymentGateway {
  processPayment(order: Order): Promise<PaymentResult>;
}

class StripeAdapter implements IPaymentGateway {
  constructor(private stripe: StripePaymentAPI) {}

  async processPayment(order: Order): Promise<PaymentResult> {
    const token = this.generateToken(order.card);
    this.stripe.chargeCard(order.amount, token);
    return { success: true, transactionId: token };
  }
}
```

#### Bridge
**Cuando usarlo:** Para dividir una clase grande en dos jerarquias separadas (abstraccion e implementacion) que pueden desarrollarse independientemente. Evita la explosion de subclases.

```typescript
interface Renderer {
  renderShape(shape: string, color: string): void;
}

class SVGRenderer implements Renderer {
  renderShape(shape: string, color: string) {
    console.log(`SVG: <${shape} fill="${color}" />`);
  }
}

class CanvasRenderer implements Renderer {
  renderShape(shape: string, color: string) {
    console.log(`Canvas: drawShape(${shape}, ${color})`);
  }
}

abstract class Shape {
  constructor(protected renderer: Renderer) {}
  abstract draw(color: string): void;
}

class Circle extends Shape {
  draw(color: string) { this.renderer.renderShape("circle", color); }
}
```

#### Composite
**Cuando usarlo:** Para componer objetos en estructuras de arbol y trabajar con esas estructuras como si fueran objetos individuales. Util para representar jerarquias parte-todo.

```typescript
interface FileSystemItem {
  getName(): string;
  getSize(): number;
}

class File implements FileSystemItem {
  constructor(private name: string, private size: number) {}
  getName() { return this.name; }
  getSize() { return this.size; }
}

class Directory implements FileSystemItem {
  private items: FileSystemItem[] = [];
  constructor(private name: string) {}
  add(item: FileSystemItem) { this.items.push(item); }
  getName() { return this.name; }
  getSize() { return this.items.reduce((total, item) => total + item.getSize(), 0); }
}
```

#### Decorator
**Cuando usarlo:** Para agregar funcionalidades a objetos colocandolos dentro de objetos encapsuladores que contienen esas funcionalidades. Alternativa flexible a la herencia.

```typescript
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string) { console.log(message); }
}

class TimestampLogger implements Logger {
  constructor(private wrapped: Logger) {}
  log(message: string) {
    this.wrapped.log(`[${new Date().toISOString()}] ${message}`);
  }
}

class PrefixLogger implements Logger {
  constructor(private wrapped: Logger, private prefix: string) {}
  log(message: string) {
    this.wrapped.log(`${this.prefix} ${message}`);
  }
}

// Composicion de decoradores
const logger = new PrefixLogger(new TimestampLogger(new ConsoleLogger()), "[ERROR]");
logger.log("Algo salio mal");
```

#### Facade
**Cuando usarlo:** Para proporcionar una interfaz simplificada a una libreria, framework o cualquier grupo complejo de clases. Reduce la complejidad visible al cliente.

```typescript
// Sistema complejo interno con multiples subsistemas
class AuthService { authenticate(token: string): User { /* ... */ return {} as User; } }
class CacheService { get(key: string): unknown { /* ... */ return null; } set(key: string, value: unknown): void { /* ... */ } }
class DatabaseService { query(sql: string): unknown[] { /* ... */ return []; } }

// Facade que simplifica el acceso
class UserFacade {
  constructor(
    private auth: AuthService,
    private cache: CacheService,
    private db: DatabaseService
  ) {}

  getUserProfile(token: string): unknown {
    const user = this.auth.authenticate(token);
    const cached = this.cache.get(`user:${user.id}`);
    if (cached) return cached;

    const profile = this.db.query(`SELECT * FROM profiles WHERE user_id = ${user.id}`);
    this.cache.set(`user:${user.id}`, profile);
    return profile;
  }
}
```

#### Flyweight
**Cuando usarlo:** Para mantener mas objetos dentro de la memoria RAM disponible, compartiendo las partes comunes del estado entre varios objetos en lugar de mantener toda la informacion en cada uno.

```typescript
class CharacterStyle {
  constructor(
    public readonly font: string,
    public readonly size: number,
    public readonly color: string
  ) {}
}

class FlyweightFactory {
  private styles = new Map<string, CharacterStyle>();

  getStyle(font: string, size: number, color: string): CharacterStyle {
    const key = `${font}-${size}-${color}`;
    if (!this.styles.has(key)) {
      this.styles.set(key, new CharacterStyle(font, size, color));
    }
    return this.styles.get(key)!;
  }
}
```

#### Proxy
**Cuando usarlo:** Para proporcionar un sustituto que controla el acceso al objeto original, permitiendo ejecutar logica antes o despues de que la solicitud llegue al objeto real (cache, autorizacion, logging).

```typescript
interface DataService {
  fetchData(id: string): Promise<unknown>;
}

class RealDataService implements DataService {
  async fetchData(id: string): Promise<unknown> {
    // llamada costosa a la DB o API
    return { id, data: "..." };
  }
}

class CachingProxyDataService implements DataService {
  private cache = new Map<string, unknown>();
  constructor(private real: RealDataService) {}

  async fetchData(id: string): Promise<unknown> {
    if (this.cache.has(id)) return this.cache.get(id);
    const data = await this.real.fetchData(id);
    this.cache.set(id, data);
    return data;
  }
}
```

---

### PATRONES DE COMPORTAMIENTO

Tratan sobre algoritmos y la asignacion de responsabilidades entre objetos.

#### Observer / Event-Driven
**Cuando usarlo:** Para definir un mecanismo de suscripcion que notifica a varios objetos sobre cualquier evento que le suceda al objeto observado. Comunicacion desacoplada entre componentes.

```typescript
type EventHandler<T> = (data: T) => void;

class EventEmitter<Events extends Record<string, unknown>> {
  private listeners: Partial<{ [K in keyof Events]: EventHandler<Events[K]>[] }> = {};

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(handler);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners[event]?.forEach(handler => handler(data));
  }
}
```

#### Strategy
**Cuando usarlo:** Para definir una familia de algoritmos, colocar cada uno en una clase separada y hacer sus objetos intercambiables. Cuando tienes multiples variantes de un mismo algoritmo.

```typescript
interface SortStrategy<T> {
  sort(data: T[]): T[];
}

class QuickSort<T> implements SortStrategy<T> {
  sort(data: T[]): T[] { return [...data].sort(); }
}

class DataProcessor<T> {
  constructor(private strategy: SortStrategy<T>) {}

  setStrategy(strategy: SortStrategy<T>) { this.strategy = strategy; }

  process(data: T[]): T[] { return this.strategy.sort(data); }
}
```

#### Command
**Cuando usarlo:** Para convertir una solicitud en un objeto independiente que contiene toda la informacion sobre la solicitud. Permite colas de trabajo, historial, undo/redo.

```typescript
interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
}

class CreateUserCommand implements Command {
  private createdUserId?: string;

  constructor(private userService: UserService, private userData: CreateUserDto) {}

  async execute(): Promise<void> {
    const user = await this.userService.create(this.userData);
    this.createdUserId = user.id;
  }

  async undo(): Promise<void> {
    if (this.createdUserId) await this.userService.delete(this.createdUserId);
  }
}
```

#### Chain of Responsibility
**Cuando usarlo:** Para pasar solicitudes a lo largo de una cadena de manejadores. Cada manejador decide si procesa la solicitud o la pasa al siguiente en la cadena.

```typescript
abstract class RequestHandler {
  protected next?: RequestHandler;

  setNext(handler: RequestHandler): RequestHandler {
    this.next = handler;
    return handler;
  }

  handle(request: Request): Response | null {
    if (this.next) return this.next.handle(request);
    return null;
  }
}

class AuthMiddleware extends RequestHandler {
  handle(request: Request): Response | null {
    if (!request.headers.authorization) {
      return { status: 401, body: "Unauthorized" };
    }
    return super.handle(request);
  }
}

class RateLimitMiddleware extends RequestHandler {
  handle(request: Request): Response | null {
    if (this.isRateLimited(request.ip)) {
      return { status: 429, body: "Too Many Requests" };
    }
    return super.handle(request);
  }
  private isRateLimited(ip: string): boolean { return false; }
}
```

#### Iterator
**Cuando usarlo:** Para recorrer elementos de una coleccion sin exponer su representacion interna (lista, pila, arbol, etc.).

```typescript
class NumberRange implements Iterable<number> {
  constructor(private start: number, private end: number) {}

  [Symbol.iterator](): Iterator<number> {
    let current = this.start;
    const end = this.end;
    return {
      next(): IteratorResult<number> {
        if (current <= end) {
          return { value: current++, done: false };
        }
        return { value: 0, done: true };
      }
    };
  }
}

for (const num of new NumberRange(1, 5)) {
  console.log(num); // 1, 2, 3, 4, 5
}
```

#### Mediator
**Cuando usarlo:** Para reducir las dependencias caoticas entre objetos. Restringe las comunicaciones directas y fuerza a los objetos a colaborar unicamente a traves de un objeto mediador.

```typescript
interface ChatMediator {
  sendMessage(message: string, sender: User): void;
  addUser(user: User): void;
}

class ChatRoom implements ChatMediator {
  private users: User[] = [];

  addUser(user: User): void { this.users.push(user); }

  sendMessage(message: string, sender: User): void {
    this.users
      .filter(user => user !== sender)
      .forEach(user => user.receive(message, sender.name));
  }
}
```

#### Memento
**Cuando usarlo:** Para guardar y restaurar el estado previo de un objeto sin revelar los detalles de su implementacion. Util para implementar undo/redo.

```typescript
class EditorMemento {
  constructor(private readonly content: string) {}
  getContent(): string { return this.content; }
}

class TextEditor {
  private content: string = "";

  type(text: string): void { this.content += text; }

  save(): EditorMemento { return new EditorMemento(this.content); }

  restore(memento: EditorMemento): void { this.content = memento.getContent(); }
}

class EditorHistory {
  private history: EditorMemento[] = [];

  push(memento: EditorMemento): void { this.history.push(memento); }

  pop(): EditorMemento | undefined { return this.history.pop(); }
}
```

#### State
**Cuando usarlo:** Cuando un objeto debe alterar su comportamiento cuando su estado interno cambia. Parece como si el objeto cambiara su clase.

```typescript
interface OrderState {
  next(order: Order): void;
  cancel(order: Order): void;
  toString(): string;
}

class PendingState implements OrderState {
  next(order: Order): void { order.setState(new ProcessingState()); }
  cancel(order: Order): void { order.setState(new CancelledState()); }
  toString() { return "Pendiente"; }
}

class ProcessingState implements OrderState {
  next(order: Order): void { order.setState(new ShippedState()); }
  cancel(order: Order): void { throw new Error("No se puede cancelar un pedido en proceso"); }
  toString() { return "En proceso"; }
}
```

#### Template Method
**Cuando usarlo:** Para definir el esqueleto de un algoritmo en la superclase pero permitir que las subclases sobrescriban pasos del algoritmo sin cambiar su estructura.

```typescript
abstract class DataExporter {
  // Template method: define el esqueleto del algoritmo
  export(data: unknown[]): string {
    const filtered = this.filter(data);
    const transformed = this.transform(filtered);
    return this.format(transformed);
  }

  protected filter(data: unknown[]): unknown[] { return data; }
  protected abstract transform(data: unknown[]): unknown[];
  protected abstract format(data: unknown[]): string;
}

class CSVExporter extends DataExporter {
  protected transform(data: unknown[]): unknown[] { return data; }
  protected format(data: unknown[]): string {
    return data.map(row => Object.values(row as object).join(",")).join("\n");
  }
}
```

#### Visitor
**Cuando usarlo:** Para separar algoritmos de los objetos sobre los que operan. Permite agregar nuevas operaciones a una jerarquia de clases sin modificarlas.

```typescript
interface ShapeVisitor {
  visitCircle(circle: Circle): number;
  visitRectangle(rectangle: Rectangle): number;
}

class AreaCalculator implements ShapeVisitor {
  visitCircle(circle: Circle): number { return Math.PI * circle.radius ** 2; }
  visitRectangle(rect: Rectangle): number { return rect.width * rect.height; }
}

class PerimeterCalculator implements ShapeVisitor {
  visitCircle(circle: Circle): number { return 2 * Math.PI * circle.radius; }
  visitRectangle(rect: Rectangle): number { return 2 * (rect.width + rect.height); }
}
```

---

## ARQUITECTURA DE SOFTWARE

### Estructura de Directorios Recomendada

```
src/
 application/          # Casos de uso / lógica de aplicación
    use-cases/
    dtos/
 domain/               # Entidades, Value Objects, reglas de negocio puras
    entities/
    repositories/     # Interfaces (contratos)
    services/
 infrastructure/       # Implementaciones concretas (DB, APIs externas)
    database/
    repositories/     # Implementaciones de las interfaces del dominio
    external-services/
 presentation/         # Controllers, resolvers, handlers HTTP
    controllers/
    middleware/
    validators/
 shared/               # Utilidades, helpers, constantes globales
     errors/
     types/
     utils/
```

### Reglas de Arquitectura

1. **La lógica de negocio vive en el dominio.** Nunca en controllers ni en la base de datos.
2. **Las capas internas no conocen las externas.** El dominio no importa de infraestructura.
3. **Los datos fluyen hacia adentro:** HTTP → Controller → UseCase → Domain → Repository.
4. **Cada módulo es una isla.** La comunicación entre módulos se hace por interfaces, no por importaciones directas.

---

## MANEJO DE ERRORES

### Errores Tipados y Semánticos

```typescript
// Crear jerarquía de errores del dominio
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class UserNotFoundError extends AppError {
  constructor(userId: string) {
    super(`Usuario con ID "${userId}" no encontrado`, 'USER_NOT_FOUND', 404);
  }
}

class UnauthorizedError extends AppError {
  constructor() {
    super('No tienes permisos para realizar esta acción', 'UNAUTHORIZED', 403);
  }
}
```

### Reglas de Manejo de Errores

```typescript
//  MAL: error silenciado, debugging imposible
try {
  await processPayment(order);
} catch (e) {
  // silencio total
}

//  MAL: catch demasiado genérico
} catch (error) {
  console.log(error);
  return null;
}

//  BIEN: manejo explícito, logging apropiado, re-throw si corresponde
try {
  await processPayment(order);
} catch (error) {
  if (error instanceof PaymentDeclinedError) {
    logger.warn('Pago rechazado', { orderId: order.id, reason: error.message });
    throw error; // el caller decide qué hacer
  }
  logger.error('Error inesperado al procesar pago', { error, orderId: order.id });
  throw new AppError('Error interno al procesar el pago', 'PAYMENT_ERROR');
}
```

---

## TESTING Y CALIDAD

### Pirámide de Tests

```
        /\
       /E2E\          ← Pocos, lentos, costosos. Solo flujos críticos.
      /\
     / Integ. \       ← Tests de integración entre capas.
    /\
   /  Unit Tests \    ← Muchos, rápidos, baratos. Base de la pirámide.
  /\
```

### Estándares de Testing

- **Nomenclatura:** `should_[resultado]_when_[condición]`
- **Patrón AAA:** Arrange → Act → Assert
- **Cobertura mínima:** 80% en lógica de negocio. No perseguir el 100% a costo de calidad.
- **Tests independientes:** Cada test debe poder correr solo, sin depender de otros.

```typescript
describe('UserService', () => {
  describe('getActiveUser', () => {
    it('should return user when user exists and is active', async () => {
      // Arrange
      const mockUser = { id: '1', name: 'Juan', isActive: true };
      const mockRepo = { findById: jest.fn().mockResolvedValue(mockUser) };
      const service = new UserService(mockRepo as any);

      // Act
      const result = await service.getActiveUser('1');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockRepo.findById).toHaveBeenCalledWith('1');
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      const mockRepo = { findById: jest.fn().mockResolvedValue(null) };
      const service = new UserService(mockRepo as any);

      // Act & Assert
      await expect(service.getActiveUser('999')).rejects.toThrow(UserNotFoundError);
    });
  });
});
```

---


## SEGURIDAD EN PROFUNDIDAD

La seguridad no es una caracteristica opcional. Es un requisito fundamental que debe tejerse en cada capa de la arquitectura, desde la captura de entrada hasta la respuesta al cliente. Esta seccion cubre las vulnerabilidades mas criticas identificadas en 2024 por OWASP.

### OWASP Top 10 2024: Las 10 Vulnerabilidades Mas Criticas

#### 1. Broken Access Control (Control de Acceso Roto)

Usuarios pueden acceder a recursos o realizar acciones que no deberian. Es la vulnerabilidad numero 1 en 2024.

Ejemplos de fallos:
- Usuarios modifican URLs para acceder a datos de otros usuarios (horizontal privilege escalation)
- APIs sin validacion de permisos
- Falta de comprobacion de propiedad de recursos

Mitigacion en Java:

```java
// INCORRECTO: el endpoint acepta cualquier ID sin validar permisos
@GetMapping("/users/{userId}")
public ResponseEntity<UserDTO> getUser(@PathVariable Long userId) {
    return ResponseEntity.ok(userService.findById(userId));
}

// CORRECTO: validar que el usuario solo vea sus propios datos o sea admin
@GetMapping("/users/{userId}")
public ResponseEntity<UserDTO> getUser(@PathVariable Long userId,
                                       @AuthenticationPrincipal UserDetails userDetails) {
    Long currentUserId = getCurrentUserId(userDetails);
    
    if (!userId.equals(currentUserId) && !hasAdminRole(userDetails)) {
        throw new AccessDeniedException("No tienes permiso para acceder a este recurso");
    }
    
    return ResponseEntity.ok(userService.findById(userId));
}

// Usar annotations para control de acceso declarativo
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    
    @GetMapping("/{orderId}")
    @PreAuthorize("@orderSecurity.canViewOrder(#orderId, authentication)")
    public ResponseEntity<OrderDTO> getOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.findById(orderId));
    }
}

@Component("orderSecurity")
public class OrderSecurity {
    @Autowired
    private OrderRepository orderRepository;
    
    public boolean canViewOrder(Long orderId, Authentication authentication) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        String currentUsername = authentication.getName();
        return order.getOwner().getUsername().equals(currentUsername) 
            || hasAdminRole(authentication);
    }
    
    private boolean hasAdminRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
            .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
    }
}
```

#### 2. Cryptographic Failures (Fallos de Criptografia)

Datos sensibles expuestos debido a cifrado debil o inexistente.

```java
// INCORRECTO: almacenar passwords sin hash o con MD5
user.setPassword(plainPassword);
user.setPassword(DigestUtils.md5Hex(plainPassword)); // NUNCA

// CORRECTO: usar BCrypt con minimo 12 rondas
@Service
public class PasswordService {
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);
    
    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
    
    public boolean verifyPassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }
}

// Para datos en transito: AES-256
@Service
public class EncryptionService {
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int KEY_SIZE = 256;
    
    public String encryptSensitiveData(String plaintext, SecretKey key) throws Exception {
        byte[] iv = generateRandomIV();
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
        
        byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(concatenate(iv, ciphertext));
    }
    
    private byte[] generateRandomIV() {
        byte[] iv = new byte[12];
        new SecureRandom().nextBytes(iv);
        return iv;
    }
    
    private byte[] concatenate(byte[] a, byte[] b) {
        byte[] result = new byte[a.length + b.length];
        System.arraycopy(a, 0, result, 0, a.length);
        System.arraycopy(b, 0, result, a.length, b.length);
        return result;
    }
}
```

#### 3. Injection (Inyeccion de Codigo)

Entrada no validada se envia a un interprete permitiendo ejecucion de codigo malicioso.

SQL Injection Prevention:
```java
// INCORRECTO: concatenar strings en SQL
String query = "SELECT * FROM users WHERE email = '" + userEmail + "'";
Statement stmt = connection.createStatement();
ResultSet rs = stmt.executeQuery(query);

// CORRECTO: usar Prepared Statements
String query = "SELECT * FROM users WHERE email = ?";
PreparedStatement pstmt = connection.prepareStatement(query);
pstmt.setString(1, userEmail);
ResultSet rs = pstmt.executeQuery();

// O con Spring Data JPA
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmail(@Param("email") String email);
}
```

Command Injection Prevention:
```java
// INCORRECTO: pasar entrada del usuario directamente a ProcessBuilder
ProcessBuilder pb = new ProcessBuilder("sh", "-c", userCommand);

// CORRECTO: usar whitelist y evitar shell interpretation
List<String> safeCommands = new ArrayList<>();
safeCommands.add("/bin/ls");
safeCommands.add("-la");
safeCommands.add("/safe/directory"); // path fijo, no del usuario
ProcessBuilder pb = new ProcessBuilder(safeCommands);
```

#### 4. Insecure Design (Diseno Inseguro)

Falta de controles de seguridad desde la fase de diseno. Implementar limites de velocidad (rate limiting).

```java
@Configuration
public class RateLimitingConfig {
    @Bean
    public RateLimiter apiRateLimiter() {
        return RateLimiter.create(10.0); // 10 requests/segundo
    }
}

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private RateLimiter rateLimiter;
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (!rateLimiter.tryAcquire()) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new ApiError("RATE_LIMIT_EXCEEDED", "Demasiados intentos de login"));
        }
        // Logica de login
        return ResponseEntity.ok(new LoginResponse(token));
    }
}

// Validacion de limites de negocio
@Service
public class OrderService {
    public Order createOrder(CreateOrderRequest request, User user) {
        // Validar limites de negocio
        BigDecimal maxOrderAmount = BigDecimal.valueOf(100_000);
        if (request.getTotalAmount().compareTo(maxOrderAmount) > 0) {
            throw new BusinessRuleException("Monto excede el limite permitido");
        }
        
        // Validar estado del usuario
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessRuleException("Usuario no puede crear ordenes en este estado");
        }
        
        return orderRepository.save(new Order(request, user));
    }
}
```

#### 5-10. Otras Vulnerabilidades OWASP 2024

Ver secciones especializadas:
- Broken Authentication: [Autenticacion y Sesiones](#autenticacion-y-gestion-de-sesiones)
- Sensitive Data Exposure: [Manejo de Datos Sensibles](#manejo-de-datos-sensibles)
- XXE (XML External Entity): Usar parsers seguros y deshabilitar DTD
- Broken Access Control: cubierto arriba
- CSRF: [Proteccion CSRF](#proteccion-csrf)
- Using Components with Known Vulnerabilities: Actualizar dependencias regularmente
- Insufficient Logging & Monitoring: [Logging y Monitoreo](#logging-y-monitoreo-de-seguridad)

### Manejo de Excepciones: Nunca Expongas Detalles del Backend

El stacktrace del servidor es informacion valiosa para atacantes. NUNCA lo devuelvas al cliente.

```java
// INCORRECTO: exponiendo stacktrace al cliente
@GetMapping("/data/{id}")
public ResponseEntity<?> getData(@PathVariable Long id) {
    try {
        return ResponseEntity.ok(service.findData(id));
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500)
            .body(new ErrorResponse(e.getMessage(), e.getStackTrace())); // NUNCA
    }
}

// CORRECTO: Global Exception Handler que oculta detalles internos
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFound(
            ResourceNotFoundException ex,
            HttpServletRequest request) {
        
        // Loguear completo internamente para debugging
        logger.warn("Recurso no encontrado en {}: {}", request.getRequestURI(), ex.getMessage());
        
        // Responder con mensaje generico al cliente (sin detalles internos)
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ApiError(
                "RESOURCE_NOT_FOUND",
                "El recurso solicitado no existe",
                System.currentTimeMillis()
            ));
    }
    
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrityViolation(
            DataIntegrityViolationException ex,
            HttpServletRequest request) {
        
        // Loguear detalles completos para el desarrollo
        logger.error("Violacion de integridad en {}: {}", request.getRequestURI(), ex, ex);
        
        // Responder con mensaje generico al usuario
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ApiError(
                "INVALID_DATA",
                "Los datos proporcionados no son validos",
                System.currentTimeMillis()
            ));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(
            Exception ex,
            HttpServletRequest request) {
        
        // SIEMPRE loguear excepciones inesperadas con stacktrace completo
        logger.error("Error no manejado en {} - {} {}", 
            request.getRequestURI(), 
            request.getMethod(),
            request.getQueryString(), 
            ex);
        
        // Responder generico al cliente
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ApiError(
                "INTERNAL_ERROR",
                "Se produjo un error procesando tu solicitud. Por favor intenta mas tarde.",
                System.currentTimeMillis()
            ));
    }
}

@Data
@AllArgsConstructor
public class ApiError {
    private String errorCode;
    private String message;
    private Long timestamp;
    // NUNCA incluir: stackTrace, internalException, dbError, framework version, etc.
}
```

### Validacion y Sanitizacion de Entrada

Todo input del usuario es un potencial vector de ataque.

```java
@Service
public class InputValidationService {
    
    // Validar contra whitelist (no blacklist)
    public boolean isValidUsername(String username) {
        if (username == null || username.isEmpty()) {
            return false;
        }
        return username.matches("^[a-zA-Z0-9_-]{3,20}$") && username.length() <= 20;
    }
    
    public boolean isValidEmail(String email) {
        if (email == null || email.isEmpty()) {
            return false;
        }
        return email.matches("^[A-Za-z0-9+_.-]+@(.+)$") && email.length() <= 254;
    }
    
    // Prevenir XSS escapando HTML
    public String sanitizeHtmlInput(String input) {
        return StringEscapeUtils.escapeHtml4(input);
    }
    
    // Prevenir inyecciones removiendo caracteres peligrosos
    public String sanitizeFilePath(String path) {
        return path.replaceAll("[^a-zA-Z0-9._/-]", "");
    }
}

// Usar Bean Validation con reglas estrictas
@Data
public class UserCreateRequest {
    @NotNull(message = "Email no puede ser null")
    @Email(message = "Email debe ser valido")
    @Size(min = 5, max = 254)
    private String email;
    
    @NotNull(message = "Username no puede ser null")
    @Size(min = 3, max = 20)
    @Pattern(regexp = "^[a-zA-Z0-9_-]+$", 
        message = "Username solo puede contener letras, numeros, guiones y guiones bajos")
    private String username;
    
    @NotNull(message = "Password no puede ser null")
    @Size(min = 12, max = 128, message = "Password debe tener entre 12 y 128 caracteres")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
        message = "Password debe contener mayusculas, minusculas, numeros y caracteres especiales")
    private String password;
}

@RestController
@RequestMapping("/api/users")
public class UserController {
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserCreateRequest request) {
        // Spring valida automaticamente gracias a @Valid
        // Retorna 400 Bad Request si hay errores de validacion
        return ResponseEntity.ok(userService.create(request));
    }
}
```

### Manejo de Datos Sensibles

```java
// INCORRECTO: loguear o retornar datos sensibles
logger.info("Login exitoso para usuario con password: " + password);
return ResponseEntity.ok(user); // retorna SSN, creditCard, etc.

// CORRECTO: usar DTO y masking para logs
@Data
public class UserDTO {
    private Long id;
    private String email;
    private String name;
    // NUNCA incluir: password, ssn, creditCard, etc.
    
    public static UserDTO fromEntity(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(maskEmail(user.getEmail()));
        dto.setName(user.getName());
        return dto;
    }
}

@Service
public class LogMaskingService {
    public String maskPassword(String password) {
        return "***" + password.substring(password.length() - 2);
    }
    
    public String maskEmail(String email) {
        String[] parts = email.split("@");
        String localPart = parts[0].replaceAll("(?<=^.{2}).(?=.*@)", "*");
        return localPart + "@" + parts[1];
    }
    
    public String maskCreditCard(String cardNumber) {
        return cardNumber.replaceAll("(?<=.{4}).(?=.{4})", "*");
        // 4111-1111-1111-1111 -> 4111-****-****-1111
    }
    
    public String maskSSN(String ssn) {
        return "***-**-" + ssn.substring(7);
        // 123-45-6789 -> ***-**-6789
    }
}

// Loguear solo informacion no sensible
@Slf4j
public class AuthService {
    public void handleLogin(String email, String password) {
        try {
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthenticationException("Credenciales invalidas"));
            
            if (!passwordEncoder.matches(password, user.getPassword())) {
                log.warn("Failed login attempt for user ID: {}", user.getId());
                throw new AuthenticationException("Credenciales invalidas");
            }
            
            log.info("Successful login for user ID: {} at {}", user.getId(), Instant.now());
        } catch (Exception e) {
            log.error("Login error", e); // stacktrace solo en logs internos
        }
    }
}
```

### Proteccion CSRF

CSRF permite que atacantes ejecuten acciones no autorizadas en nombre del usuario autenticado.

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf()
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .and()
            .sessionManagement()
                .sessionFixationProtection(SessionFixationProtectionStrategy.MIGRATEOSESSION)
                .sessionConcurrency(sessionConcurrency -> sessionConcurrency
                    .maximumSessions(1)
                    .expiredUrl("/login?expired"))
                .and()
            .authorizeHttpRequests()
                .antMatchers("/", "/login", "/register", "/public/**").permitAll()
                .anyRequest().authenticated();
        
        return http.build();
    }
}

// En templates (Thymeleaf)
<form method="POST" action="/api/users/profile" th:action="@{/api/users/profile}">
    <!-- Spring incluye automaticamente el token CSRF -->
    <input type="hidden" th:name="${_csrf.parameterName}" th:value="${_csrf.token}"/>
    <input type="text" name="name" required/>
    <button type="submit">Guardar</button>
</form>

// En AJAX/Fetch
fetch('/api/users/profile', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="_csrf"]').getAttribute('content')
    },
    body: JSON.stringify({ name: 'nuevo nombre' })
});
```

### Headers de Seguridad HTTP

```java
@Configuration
public class SecurityHeadersConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .headers()
                // Prevenir clickjacking
                .frameOptions()
                    .sameOrigin()
                    .and()
                // Forzar HTTPS (HSTS)
                .httpStrictTransportSecurity()
                    .maxAgeInSeconds(31536000) // 1 ano
                    .includeSubDomains(true)
                    .preload(true)
                    .and()
                // Prevenir content-type sniffing
                .xssProtection()
                    .and()
                .contentSecurityPolicy()
                    .policyDirectives("default-src 'self'; " +
                        "script-src 'self'; " +
                        "style-src 'self' 'unsafe-inline'; " +
                        "img-src 'self' https:; " +
                        "font-src 'self'; " +
                        "connect-src 'self'; " +
                        "frame-ancestors 'none'");
        
        return http.build();
    }
}

// Headers que se envian automaticamente:
// Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
// X-Frame-Options: SAMEORIGIN
// X-Content-Type-Options: nosniff
// X-XSS-Protection: 1; mode=block
// Content-Security-Policy: [directivas arriba]
// Referrer-Policy: strict-origin-when-cross-origin
```

### Logging y Monitoreo de Seguridad

Ver seccion detallada [Logging y Monitoreo](#logging-seguro-y-monitoreo)

### Autenticacion y Gestion de Sesiones

Ver seccion detallada [Autenticacion y Gestion de Sesiones](#autenticacion-y-gestion-de-sesiones)

/**
 * Calcula el precio final aplicando descuentos e impuestos.
 *
 * @param basePrice - Precio base en centavos (evita errores de floating point)
 * @param discountCode - Código de descuento opcional. Null si no aplica.
 * @returns Precio final en centavos, nunca negativo.
 * @throws {InvalidDiscountError} Si el código de descuento no existe o expiró.
 */
async function calculateFinalPrice(basePrice: number, discountCode: string | null): Promise<number>
```

### El código autodocumentado es el mejor código

El código bien escrito rara vez necesita comentarios. Si sientes la necesidad de comentar qué hace algo, primero intenta refactorizarlo para que sea obvio.

---

## CONTROL DE VERSIONES (GIT)

### Convención de Commits (Conventional Commits)

```
<tipo>(<scope>): <descripción corta en imperativo>

[cuerpo opcional - explica el qué y por qué, no el cómo]

[footer opcional - referencias a tickets, breaking changes]
```

**Tipos permitidos:**

| Tipo       | Cuándo usarlo                                      |
|------------|----------------------------------------------------|
| `feat`     | Nueva funcionalidad para el usuario                |
| `fix`      | Corrección de bug                                  |
| `refactor` | Refactorización sin cambio funcional               |
| `test`     | Agregar o corregir tests                           |
| `docs`     | Cambios en documentación                           |
| `chore`    | Tareas de mantenimiento, dependencias, config      |
| `perf`     | Mejora de rendimiento                              |
| `ci`       | Cambios en pipelines de CI/CD                      |

**Ejemplos:**
```bash
feat(auth): add JWT refresh token rotation
fix(payments): prevent double-charge on network timeout
refactor(user-service): extract email validation to shared utils
test(order): add edge cases for zero-quantity items
```

### Estrategia de Branches

```
main            → Producción. Siempre estable. Solo acepta merges de release/*
develop         → Integración continua. Base para nuevas features.
feature/<name>  → Nuevas funcionalidades. Merge a develop via PR.
fix/<name>      → Correcciones. Merge a develop (o main si es crítico).
release/<v>     → Preparación de release. Merge a main y develop.
```

### Reglas de Pull Requests

- Un PR = una funcionalidad o fix. PRs pequeños y enfocados.
- Toda PR requiere al menos **1 code review** antes de mergear.
- Los tests deben pasar. Si no, no se mergea.
- El título del PR sigue la convención de commits.
- Describir **qué** cambia y **por qué**, no el cómo.

---

## CHECKLIST DE CODE REVIEW

Antes de solicitar un review, verificar:

### Correctitud
- [ ] El código hace lo que debe hacer (tests lo verifican)
- [ ] Los edge cases están contemplados (null, vacío, límites)
- [ ] No hay condiciones de carrera en código concurrente

### Calidad
- [ ] Los nombres son claros y descriptivos
- [ ] No hay funciones que hagan más de una cosa
- [ ] No hay código duplicado (DRY)
- [ ] No hay números o strings mágicos sin constante

### Seguridad
- [ ] No hay secretos hardcodeados
- [ ] El input del usuario está validado/sanitizado
- [ ] Los errores no exponen información sensible

### Rendimiento
- [ ] No hay N+1 queries en base de datos
- [ ] Las operaciones asíncronas independientes van en paralelo
- [ ] Las colecciones tienen paginación

### Mantenibilidad
- [ ] Hay tests para la lógica de negocio crítica
- [ ] El código sigue los patrones del proyecto
- [ ] Las dependencias nuevas están justificadas

---

## INSTRUCCION FINAL PARA IA (SISTEMA)

> Este documento es la **constitucion de codigo** de este proyecto.
> Toda generacion de codigo debe adherirse estrictamente a estas guias.
>
> **Como asistente de desarrollo, debes:**
> - Aplicar siempre los principios SOLID sin que se te pida explicitamente.
> - Preferir patrones establecidos sobre soluciones ad-hoc.
> - Nunca generar codigo con secretos, passwords o datos sensibles hardcodeados.
> - Siempre incluir manejo de errores explicito y tipado.
> - Seguir la estructura de directorios definida al crear nuevos archivos.
> - Escribir tests junto con el codigo de produccion cuando se solicite nueva funcionalidad.
> - Usar la convencion de nombrado establecida en todos los artefactos generados.
> - Si el codigo existente viola alguna practica, indicarlo y sugerir la refactorizacion.
> - **Nunca usar emojis en ninguna respuesta, comentario de codigo, ni documentacion generada.**
> - **Nunca exponer API keys, tokens ni credenciales. Siempre leerlos desde variables de entorno.**

---

## VARIABLES DE ENTORNO

Este proyecto utiliza variables de entorno para almacenar configuracion sensible. Nunca hardcodear credenciales, API keys o secretos directamente en el codigo.

### Estructura de variables de entorno

Las variables de entorno se organizan por categoria: IA, base de datos, aplicacion y servicios externos. Todas las credenciales deben ser leidas desde `process.env` (Node.js) u `os.environ` (Python).

Crear un archivo `.env` en la raiz del proyecto con el siguiente contenido:

```bash
# =============================================================================
# VARIABLES DE ENTORNO - NO COMMITEAR ESTE ARCHIVO AL REPOSITORIO
# Este archivo contiene credenciales reales y debe estar en .gitignore
# Para configurar el proyecto inicial, copiar .env.example y completar valores
# =============================================================================


# INTELIGENCIA ARTIFICIAL
# ------
# Proveedor de LLM: Groq, OpenAI, Anthropic, etc.
# Obtener keys desde: https://console.groq.com (Groq) / https://platform.openai.com (OpenAI)

LLM_PROVIDER=groq
LLM_API_KEY=
LLM_MODEL=llama3-8b-8192
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=1000


# ------
# BASE DE DATOS
# -----------------------------------------------------------------------------

# URL de conexion completa (incluye usuario, password, host, puerto y nombre de DB)
DATABASE_URL=postgresql://usuario:password@localhost:5432/nombre_db

# Configuracion individual (alternativa a DATABASE_URL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nombre_db
DB_USER=usuario
DB_PASSWORD=


# -----------------------------------------------------------------------------
# APLICACION
# -----------------------------------------------------------------------------

# Entorno de ejecucion: development | staging | production
NODE_ENV=development

# Puerto donde corre el servidor
PORT=3000

# URL base de la aplicacion
APP_URL=http://localhost:3000

# Clave secreta para firmar JWT y sesiones (minimo 32 caracteres, generada aleatoriamente)
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Clave de cifrado para datos sensibles en DB
ENCRYPTION_KEY=


# -----------------------------------------------------------------------------
# SERVICIOS EXTERNOS
# -----------------------------------------------------------------------------

# Servicio de emails (SendGrid / Resend / SMTP)
EMAIL_API_KEY=
EMAIL_FROM=no-reply@tudominio.com

# Almacenamiento en la nube (AWS S3 / Cloudflare R2)
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
STORAGE_REGION=us-east-1

# Servicio de pagos (Stripe)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Servicio de autenticacion (Auth0 / Clerk)
AUTH_SECRET=
AUTH_ISSUER_URL=


# -----------------------------------------------------------------------------
# MONITORING Y LOGS
# -----------------------------------------------------------------------------

# Sentry para monitoreo de errores en produccion
SENTRY_DSN=

# Nivel de log: debug | info | warn | error
LOG_LEVEL=debug
```

**Contenido del archivo `.env.example` (SI commitear — sin valores reales):**

```bash
# VARIABLES DE ENTORNO - EJEMPLO
# Copiar este archivo como .env y completar los valores reales
# Comando: cp .env.example .env
# Este archivo .env.example SI debe commitearse. El archivo .env NO.

LLM_PROVIDER=groq
LLM_API_KEY=
LLM_MODEL=llama3-8b-8192
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=1000

DATABASE_URL=postgresql://usuario:password@localhost:5432/nombre_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nombre_db
DB_USER=usuario
DB_PASSWORD=

NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
JWT_SECRET=
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=

EMAIL_API_KEY=
EMAIL_FROM=no-reply@tudominio.com
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
STORAGE_REGION=us-east-1
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
AUTH_SECRET=
AUTH_ISSUER_URL=

SENTRY_DSN=
LOG_LEVEL=debug
```

**Contenido del archivo `.gitignore` (SI commitear):**

```gitignore
# =============================================================================
# ARCHIVOS DE ENTORNO Y SECRETOS
# ESTOS ARCHIVOS NUNCA DEBEN SUBIRSE AL REPOSITORIO
# =============================================================================
.env
.env.local
.env.development
.env.staging
.env.production
.env.test
.env.*.local

# El unico archivo .env que se commitea es .env.example (sin valores sensibles)
# .env.example  <-- este SI se commitea


# =============================================================================
# DEPENDENCIAS
# =============================================================================
node_modules/
__pycache__/
*.py[cod]
*.egg-info/
*.egg/
.Python
dist/
build/
venv/
.venv/
env/
ENV/
.pnp
.pnp.js


# =============================================================================
# BUILDS Y COMPILADOS
# =============================================================================
dist/
build/
out/
.next/
.nuxt/
.cache/
*.tsbuildinfo
*.rar
*.zip
*.7z


# =============================================================================
# LOGS Y ARCHIVOS TEMPORALES
# =============================================================================
logs/
*.log
*.log.*
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
.pnpm-debug.log*
tmp/
temp/
*.tmp


# =============================================================================
# EDITORES E IDEs
# =============================================================================
.vscode/
.idea/
*.swp
*.swo
*.swn
*~
.project
.settings/
.classpath
.c9/
*.sublime-workspace
*.sublime-project
.DS_Store
Thumbs.db


# =============================================================================
# TESTING Y COBERTURA
# =============================================================================
coverage/
.nyc_output/
*.lcov
.coverage
.pytest_cache/
htmlcov/


# =============================================================================
# CLAVES PRIVADAS Y CERTIFICADOS
# =============================================================================
*.pem
*.key
*.cert
*.crt
*.cer
*.p12
*.pfx
*.jks
*.keystore
.ssh/


# =============================================================================
# ARCHIVOS DE CONFIGURACION CON SECRETOS
# =============================================================================
config/secrets.*
secrets/
.secrets/
private/


# =============================================================================
# BACKUPS DE BASE DE DATOS
# =============================================================================
*.sql
*.dump
*.bak
*.backup
*.db-backup


# =============================================================================
# ARCHIVOS DE SISTEMA OPERATIVO
# =============================================================================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
Desktop.ini


# =============================================================================
# ARCHIVOS COMPILADOS ESPECÍFICOS DE LENGUAJES
# =============================================================================
*.o
*.a
*.so
*.dylib
*.dll
*.exe
*.class
*.jar
*.pyc
*.pyo
*.pyd
.RData
.Rhistory
```

---

## ESTILO DE RESPUESTA DE LA IA

Estas reglas aplican al asistente de IA dentro del entorno de desarrollo (VSCode, Cursor, Cline, etc.).

### Prohibiciones absolutas

- **Prohibido usar emojis** en cualquier respuesta, comentario de codigo, docstring, o mensaje de commit sugerido.
- **Prohibido usar lenguaje informal** o coloquial en codigo, documentacion o comentarios generados.
- **Prohibido exponer, sugerir o completar** valores reales de API keys, tokens o credenciales bajo ninguna circunstancia.
- **Prohibido generar codigo** que lea credenciales de fuentes distintas a variables de entorno.

### Formato de respuestas esperado

- Las respuestas deben ser directas y tecnicas, sin introducciones innecesarias.
- El codigo generado debe incluir tipos, manejo de errores y seguir los patrones definidos en este documento.
- Si se detecta una violacion a estas guias en el codigo existente, indicarlo como advertencia antes de generar nuevo codigo.
- Los comentarios en el codigo deben explicar el "por que", nunca el "que".

---

*Mantenido por el equipo de arquitectura. Version sujeta a revision trimestral.*
*Ante dudas o sugerencias, abrir un issue en el repositorio de estandares internos.*

---

## LOGGING SEGURO Y MONITOREO

El logging es fundamental para auditoría y debugging, pero NUNCA debe exponerse información sensible.

### Principios de Logging Seguro

```java
@Slf4j
@Service
public class SecureLoggingService {
    
    // Niveles apropiados de logging
    public void processTransaction(TransactionRequest request) {
        try {
            // DEBUG: informacion detallada para desarrollo
            log.debug("Iniciando procesamiento de transaccion para usuario ID: {}", request.getUserId());
            
            // INFO: eventos importantes del negocio
            log.info("Transaccion creada: {} de {}", 
                request.getId(), 
                request.getAmount());
            
            // WARN: situaciones inesperadas pero recuperables
            if (request.getAmount().compareTo(BigDecimal.valueOf(10000)) > 0) {
                log.warn("Transaccion de alto monto detectada: {} - revisar manualmente", request.getId());
            }
            
        } catch (BusinessException ex) {
            // ERROR: errores que afectan la operación
            log.error("Error procesando transaccion {}: {}", request.getId(), ex.getMessage());
        } catch (Exception ex) {
            // ERROR con stacktrace para excepciones no esperadas
            log.error("Error critico procesando transaccion", ex);
        }
    }
    
    // Usar structured logging (JSON)
    public void logStructured(User user, String action) {
        Map<String, Object> logData = new HashMap<>();
        logData.put("timestamp", Instant.now());
        logData.put("user_id", user.getId());
        logData.put("action", action);
        logData.put("ip_address", getClientIpAddress());
        logData.put("session_id", getSessionId());
        
        log.info(convertToJson(logData));
    }
    
    // Enmascarar datos sensibles
    private String logSafeUserInfo(User user) {
        return String.format("User[id=%d, email=%s]", 
            user.getId(), 
            maskEmail(user.getEmail()));
    }
    
    private String maskEmail(String email) {
        String[] parts = email.split("@");
        return parts[0].replaceAll("(?<=^.{2}).(?=.*@)", "*") + "@" + parts[1];
    }
    
    // Nunca loguear credenciales
    public void handleAuthentication(String username, String password) {
        log.info("Intento de autenticacion para usuario: {}", username);
        // NUNCA: log.info("Intento de autenticacion - password: {}", password);
    }
}

// Configuracion de logging (logback.xml)
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/application.log</file>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>logs/application-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <maxFileSize>10MB</maxFileSize>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
    </appender>
    
    <!-- Reducir verbosidad de librerias externas -->
    <logger name="org.springframework.web" level="INFO"/>
    <logger name="org.hibernate" level="WARN"/>
    
    <!-- Nivel de root logger -->
    <root level="INFO">
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

### Centralizacion de Logs

```java
// Usar herramientas como ELK Stack, Splunk, o Datadog para centralizar
// Todos los logs deben incluir:
// - Timestamp uniforme (UTC)
// - Session/Trace ID para correlacionar requests
// - User ID (si aplica)
// - Severity level
// - Mensaje descriptivo

@Slf4j
@Component
public class LoggingInterceptor implements HandlerInterceptor {
    
    private static final String TRACE_ID = "X-Trace-ID";
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) throws Exception {
        String traceId = request.getHeader(TRACE_ID);
        if (traceId == null) {
            traceId = UUID.randomUUID().toString();
            request.setAttribute(TRACE_ID, traceId);
        }
        
        MDC.put("traceId", traceId);
        MDC.put("userId", getUserId(request));
        MDC.put("ipAddress", getClientIpAddress(request));
        
        log.info("Incoming request: {} {} from {}", 
            request.getMethod(), 
            request.getRequestURI(),
            getClientIpAddress(request));
        
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, 
                               HttpServletResponse response, 
                               Object handler, 
                               Exception ex) throws Exception {
        log.info("Request completed with status: {}", response.getStatus());
        MDC.clear();
    }
}
```

---

## AUTENTICACION Y GESTION DE SESIONES

### Autenticacion Segura

```java
@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Validar entrada
            if (!isValidEmail(loginRequest.getEmail()) || !isValidPassword(loginRequest.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthError("Invalid credentials"));
            }
            
            // Usar Spring Security para autenticacion
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getPassword()
                )
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Generar JWT
            String jwtToken = jwtTokenProvider.generateToken(authentication);
            String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);
            
            return ResponseEntity.ok(new JwtAuthenticationResponse(jwtToken, refreshToken));
            
        } catch (AuthenticationException ex) {
            log.warn("Fallido intento de login para email: {}", loginRequest.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AuthError("Credenciales invalidas"));
        }
    }
    
    @PostMapping("/logout")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> logoutUser(@AuthenticationPrincipal UserDetails userDetails) {
        SecurityContextHolder.clearContext();
        log.info("Usuario {} ha cerrado sesion", userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Logout exitoso"));
    }
}

// JWT Provider seguro
@Component
public class JwtTokenProvider {
    
    @Value("${app.jwtSecret}")
    private String jwtSecret;
    
    @Value("${app.jwtExpirationMs:86400000}") // 24 hours
    private long jwtExpirationMs;
    
    @Value("${app.jwtRefreshExpirationMs:604800000}") // 7 days
    private long jwtRefreshExpirationMs;
    
    // Generar token con informacion minima
    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        
        return Jwts.builder()
            .setSubject(userPrincipal.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }
    
    // Validar token en cada request
    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException ex) {
            log.error("Token JWT invalido: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.error("Token JWT expirado: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("Token JWT no soportado: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("String de JWT vacio: {}", ex.getMessage());
        }
        return false;
    }
    
    public String getUserNameFromToken(String token) {
        return Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }
    
    // Generar refresh token (validez mas larga)
    public String generateRefreshToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        
        return Jwts.builder()
            .setSubject(userPrincipal.getUsername())
            .claim("type", "refresh")
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtRefreshExpirationMs))
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }
}

@Configuration
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // minimo 12 rondas
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable() // Si usas JWT, CSRF menos critico (pero aun importante con cookies)
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // JWT es stateless
                .and()
            .authorizeRequests()
                .antMatchers("/api/auth/**").permitAll()
                .antMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated()
                .and()
            .addFilterBefore(new JwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling()
                .authenticationEntryPoint(new RestAuthenticationEntryPoint());
        
        return http.build();
    }
}
```

### Mejor Practica: Usar HTTP-Only Cookies para JWT

```java
// En lugar de guardar JWT en localStorage (vulnerable a XSS)
// Usar HTTP-Only cookies que el navegador maneja automaticamente

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String jwtToken = authService.authenticate(request);
        
        // Crear cookie HTTP-Only
        ResponseCookie cookie = ResponseCookie
            .from("authToken", jwtToken)
            .httpOnly(true)
            .secure(true) // Solo HTTPS
            .path("/")
            .maxAge(24 * 60 * 60) // 24 horas
            .sameSite("Strict") // Proteccion CSRF
            .build();
        
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(new LoginResponse("Login exitoso"));
    }
}
```

---

## MODELADO DE DATOS Y PERSISTENCIA

### Normalizacion de Tablas

La normalizacion elimina redundancia y asegura integridad de datos. La mayoría de aplicaciones benefician de alcanzar 3NF (Third Normal Form).

```java
// INCORRECTO: datos desnormalizados (1NF violation)
@Entity
@Table(name = "orders")
public class Order {
    @Id
    private Long id;
    
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String productNames;      // Multiples productos en un campo
    private String productPrices;     // Datos repetidos
    private Integer productQuantities;
    
    // Problemas:
    // - Anomalia de actualizacion: cambiar email de cliente requiere actualizar multiples ordenes
    // - Anomalia de insercion: no puedes insertar un cliente sin orden
    // - Anomalia de borrado: borrar una orden borra info del cliente
    // - Redundancia: datos de cliente repetidos en cada orden
}

// CORRECTO: dados normalizados (3NF)
@Entity
@Table(name = "customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String email;
    
    private String name;
    private String phone;
    
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    private Set<Order> orders = new HashSet<>();
}

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
    
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private Set<OrderItem> items = new HashSet<>();
}

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String sku;
    
    private String name;
    private BigDecimal price;
    private Integer quantity;
}

@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    private Integer quantity;
    private BigDecimal unitPrice; // snapshot del precio al momento de venta
}

// Ventajas:
// - Sin redundancia: cada hecho se almacena una sola vez
// - Integridad: cambiar email de cliente actualiza un solo lugar
// - Escalabilidad: easy to add nuevas ordenes o productos
// - Queries eficientes: indices y relaciones claras
```

### Foreign Keys e Integridad Referencial

```java
@Configuration
public class DataIntegrityConfig {
    
    @Bean
    public DatabasePopulator databasePopulator() {
        // Las Foreign Keys deben estar habilitadas
        // En H2: SET REFERENTIAL_INTEGRITY TRUE;
        // En PostgreSQL: CREATE CONSTRAINT ... FOREIGN KEY
        return new ResourceDatabasePopulator(
            new ClassPathResource("schema.sql"),
            new ClassPathResource("data.sql")
        );
    }
}

// En schema.sql:
/*
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(254) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
*/
```

### Transacciones ACID

```java
@Service
@Transactional
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private OrderItemRepository orderItemRepository;
    
    @Autowired
    private InventoryService inventoryService;
    
    // Las transacciones garantizan consistency
    public Order createOrder(CreateOrderRequest request, User user) {
        // A: Atomicity - todo o nada
        // C: Consistency - estado valido antes y despues
        // I: Isolation - cambios no visibles hasta commit
        // D: Durability - persiste despues de commit
        
        Order order = new Order();
        order.setCustomer(user);
        order.setCreatedAt(LocalDateTime.now());
        
        for (OrderItemRequest itemRequest : request.getItems()) {
            Product product = inventoryService.reserveProduct(
                itemRequest.getProductId(), 
                itemRequest.getQuantity()
            );
            
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setUnitPrice(product.getPrice());
            
            order.getItems().add(orderItem);
        }
        
        // Si cualquier cosa falla, TODO se revierte (rollback)
        return orderRepository.save(order);
    }
    
    // Configurar isolation level si necesario
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Order getOrderWithLocking(Long orderId) {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new EntityNotFoundException("Order not found"));
    }
}
```

---

## DESPLIEGUE Y ENTORNOS

Separar configuracion por entorno es critico para seguridad y escalabilidad.

```
Estructura recomendada:
src/main/resources/
├── application.properties          # Base
├── application-dev.properties      # Development
├── application-staging.properties  # Staging
└── application-prod.properties     # Production

Cada archivo contiene:
- Spring profiles: spring.profiles.active=dev
- Base de datos: diferentes URLs, usuarios, passwords
- Logging: DEBUG en dev, INFO en prod
- Cache: habilitado en prod, deshabilitado en dev
- SSL: disabled en dev, required en prod
```

```properties
# application-dev.properties
spring.profiles.active=dev
spring.application.name=myapp-dev

# Database: local development
spring.datasource.url=jdbc:postgresql://localhost:5432/myapp_dev
spring.datasource.username=dev_user
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Logging
logging.level.root=INFO
logging.level.com.mycompany=DEBUG
logging.file.name=logs/dev.log

# Security - disabled para desarrollo
security.jwt.secret=${JWT_SECRET}
security.require-https=false

# Cache disabled
spring.cache.type=none
```

```properties
# application-prod.properties
spring.profiles.active=prod
spring.application.name=myapp-prod

# Database: production (managed service)
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.jdbc.batch_size=20

# Logging: minimo, enviado a servicio centralizado
logging.level.root=WARN
logging.file.name=/var/log/myapp/application.log
logging.file.max-size=100MB
logging.file.max-history=30

# Security: obligatorio
security.jwt.secret=${JWT_SECRET}
security.require-https=true
server.ssl.key-store=${SSL_KEYSTORE_PATH}
server.ssl.key-store-password=${SSL_PASSWORD}

# Cache enabled para performance
spring.cache.type=redis
spring.redis.host=${REDIS_HOST}
spring.redis.port=6379

# Actuator: exponer salud pero no todos los endpoints
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when-authorized

# Rate limiting
server.tomcat.max-threads=200
server.tomcat.max-connections=10000
```

