# Function Patterns Rules (MEDIUM)

**Essential patterns for type-safe and flexible function definitions**

---

## Rule 1: Return Type Annotation (When Required)

### ❌ Incorrect

```typescript
// No return type - can infer wrong type
function calculateTotal(prices: number[]) {
  const total = prices.reduce((sum, price) => sum + price, 0);
  return total;  // TypeScript infers number
}

// Later, accidental change breaks callers
function calculateTotal(prices: number[]) {
  const total = prices.reduce((sum, price) => sum + price, 0);
  return total.toString();  // Now returns string, but callers expect number
}

// Promise function without explicit return type
async function fetchUser(id: number) {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  return data;  // Returns unknown (dangerous)
}

// Complex return might infer incorrectly
function createObject(name: string, age?: number) {
  return { name, age };  // { name: string; age: number | undefined }
  // Should be { name: string; age?: number } for better type
}

// No return type, might cause issues
function processArray(items: number[]) {
  if (items.length === 0) {
    return;  // undefined
  }
  return items.map(x => x * 2);  // number[] | undefined
}
```

### ✅ Correct

```typescript
// Explicit return type prevents accidental changes
function calculateTotal(prices: number[]): number {
  const total = prices.reduce((sum, price) => sum + price, 0);
  return total;
}

// Now this causes error:
// function calculateTotal(prices: number[]): number {
//   return total.toString();  // Error: string not assignable to number
// }

// Async functions with explicit return type
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data: unknown = await response.json();

  if (isUser(data)) {
    return data;  // Type-safe
  }
  throw new Error('Invalid user data');
}

// Return type clarifies intent
function createObject(name: string, age?: number): { name: string; age?: number } {
  return { name, age };  // Clear what object looks like
}

// Return type shows multiple returns are handled
function processArray(items: number[]): number[] {
  if (items.length === 0) {
    return [];  // Error: undefined not assignable to number[]
  }
  return items.map(x => x * 2);
}

// Correctly: handle all cases with same return type
function processArray(items: number[]): number[] {
  return items.length === 0 ? [] : items.map(x => x * 2);
}
```

### When to Annotate Return Types

```typescript
// REQUIRED: Public API functions
export function getUserById(id: number): Promise<User | null> {
  // Clear contract for callers
}

// REQUIRED: Exported functions
export async function syncData(): Promise<{ success: boolean; count: number }> {
  // Public consumers need to know exact type
}

// REQUIRED: Functions with multiple return paths
function handleInput(value: unknown): string | number | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  return null;
}

// RECOMMENDED: Async functions always annotate
async function loadData(): Promise<Data[]> {
  // Clear that it returns Promise<Data[]>, not Data[]
}

// RECOMMENDED: Functions used widely in codebase
function calculateDiscount(price: number, percentage: number): number {
  return price * (1 - percentage / 100);
}

// OPTIONAL: Simple callbacks with obvious type
items.map(item => item.name);  // Type is inferred from context

// OPTIONAL: Internal helper functions
const double = (x: number) => x * 2;  // Used only locally
```

### Return Type Patterns

```typescript
// Pattern 1: Union return types
function parseValue(value: string): number | null | { error: string } {
  try {
    return parseInt(value, 10);
  } catch (e) {
    return { error: 'Invalid number' };
  }
}

// Pattern 2: Generic return types
function transformArray<T, U>(items: T[], transform: (item: T) => U): U[] {
  return items.map(transform);
}

// Pattern 3: Discriminated union returns
function tryParse<T>(data: unknown, validate: (d: unknown) => data is T): { success: true; data: T } | { success: false; error: string } {
  if (validate(data)) {
    return { success: true, data };
  }
  return { success: false, error: 'Validation failed' };
}

// Pattern 4: Function returning function
function createMultiplier(factor: number): (x: number) => number {
  return (x: number) => x * factor;
}

const double = createMultiplier(2);
const result = double(5);  // result: number

// Pattern 5: Never return (function never completes normally)
function throwError(message: string): never {
  throw new Error(message);
}

// Pattern 6: Void return (intentionally returns nothing)
function logMessage(message: string): void {
  console.log(message);
  // return;  // Optional, returns undefined
}
```

---

## Rule 2: Optional vs Default Parameters

### ❌ Incorrect

```typescript
// Using undefined instead of optional parameter
function greet(name: string, greeting: string | undefined): void {
  console.log(`${greeting || 'Hello'} ${name}`);
}

greet('John');  // Error: greeting is required
greet('John', undefined);  // Ugly call site

// Default parameter not used consistently
function createUser(name: string, role: string = 'user', active?: boolean) {
  // active might be undefined, need to check
  if (active === undefined) {
    // handle
  }
}

// Function doesn't handle missing parameters
function format(template: string, ...args: string[]): string {
  return template.replace(/%s/g, () => args.shift() || '');  // May run out of args
}

// Optional parameters used incorrectly
function connect(host: string, port?: number, ssl?: boolean) {
  // Can't tell which combinations are valid
  // What if port is omitted but ssl is provided?
}
```

### ✅ Correct

```typescript
// Use optional parameter (with ?)
function greet(name: string, greeting?: string): void {
  console.log(`${greeting ?? 'Hello'} ${name}`);
}

greet('John');  // Works
greet('John', 'Hi');  // Works

// Use default parameter when you have a default
function createUser(
  name: string,
  role: string = 'user',
  active: boolean = true
): void {
  console.log(`${name} (${role}): ${active ? 'active' : 'inactive'}`);
}

createUser('John');  // role='user', active=true
createUser('Jane', 'admin');  // role='admin', active=true
createUser('Bob', 'user', false);  // role='user', active=false

// Default parameters always have value
function createConnection(
  host: string = 'localhost',
  port: number = 3306,
  ssl: boolean = false
): Connection {
  return new Connection(host, port, ssl);
}

createConnection();  // All defaults
createConnection('example.com');  // Custom host
createConnection('example.com', 5432);  // Custom host and port

// Optional object parameter for multiple optionals
interface ConnectOptions {
  host?: string;
  port?: number;
  ssl?: boolean;
  timeout?: number;
}

function connect(options: ConnectOptions = {}): void {
  const {
    host = 'localhost',
    port = 3306,
    ssl = false,
    timeout = 5000,
  } = options;

  // All values have defaults
  console.log(`Connecting to ${host}:${port}`);
}

connect();  // All defaults
connect({ host: 'example.com', ssl: true });  // Some options

// Function with rest parameters and defaults
function log(prefix: string = '[INFO]', ...messages: string[]): void {
  console.log(prefix, ...messages);
}

log();  // Uses default prefix
log('[ERROR]', 'Something failed');
```

### Parameter Pattern Guidelines

```typescript
// Pattern 1: Optional single parameters (few options)
function setColor(color?: string): void {
  const finalColor = color ?? '#000000';
}

// Pattern 2: Default parameters (common values)
function setTimeout(callback: () => void, delay: number = 1000): void {
  // delay always has a value
}

// Pattern 3: Options object for many parameters
interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

function fetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    method = 'GET',
    headers = {},
    timeout = 5000,
  } = options;
}

// Pattern 4: Required + optional mix
function createUser(
  // Required
  name: string,
  email: string,
  // Optional with defaults
  role: string = 'user',
  active: boolean = true
): void {
  // Clear which params are required
}

// Pattern 5: Constructor with optional parameters
class Logger {
  constructor(
    private name: string,
    private level: string = 'info'
  ) {}
}

const logger = new Logger('app');  // Uses default level

// Pattern 6: Type guard for undefined
function getValue<T>(obj: Record<string, T>, key: string, defaultValue?: T): T {
  if (key in obj) {
    return obj[key];
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Key ${key} not found and no default provided`);
}
```

---

## Rule 3: Function Overloads (Multiple Signatures)

### ❌ Incorrect

```typescript
// No overloads, function tries to handle all cases
function find(items: any[], key: any): any {
  if (typeof key === 'number') {
    return items[key];  // Find by index
  } else if (typeof key === 'string') {
    return items.find(item => item.id === key);  // Find by id
  } else if (typeof key === 'object') {
    return items.find(item => Object.entries(key).every(([k, v]) => item[k] === v));  // Find by object
  }
}

const byIndex = find(users, 0);  // Returns any
const byId = find(users, 'user-123');  // Returns any
const byProp = find(users, { role: 'admin' });  // Returns any

// No type safety on parameters
function format(template: string, ...args: any[]): string {
  // Can't enforce argument count or types
  return template;
}

format('Hello %s', 'John');  // OK
format('Hello %s %d', 'John');  // Should error: missing second arg
format('Hello %s', 'John', 'extra');  // Should warn: extra arg
```

### ✅ Correct

```typescript
// Function overloads with specific signatures
function find(items: User[], index: number): User | undefined;
function find(items: User[], id: string): User | undefined;
function find(items: User[], predicate: (item: User) => boolean): User | undefined;

function find(items: User[], keyOrPredicate: number | string | ((item: User) => boolean)): User | undefined {
  if (typeof keyOrPredicate === 'number') {
    return items[keyOrPredicate];
  } else if (typeof keyOrPredicate === 'string') {
    return items.find(item => item.id === keyOrPredicate);
  } else {
    return items.find(keyOrPredicate);
  }
}

// Now with type safety
const byIndex = find(users, 0);  // User | undefined
const byId = find(users, 'user-123');  // User | undefined
const byPredicate = find(users, u => u.role === 'admin');  // User | undefined

// Template literal format with exact overloads
function format(template: '${0}', arg0: string): string;
function format(template: '${0} ${1}', arg0: string, arg1: string): string;
function format(template: '${0} ${1} ${2}', arg0: string, arg1: string, arg2: string): string;

function format(template: string, ...args: string[]): string {
  return template.replace(/\$\{(\d+)\}/g, (_, index) => args[parseInt(index, 10)] ?? '');
}

// Type-safe format calls
format('${0}', 'Hello');  // OK
format('${0} ${1}', 'Hello', 'World');  // OK
// format('${0}', 'Hello', 'World');  // Error: too many arguments
// format('${0} ${1}', 'Hello');  // Error: not enough arguments

// Generic function with overloads
function map<T, U>(items: T[], transform: (item: T) => U): U[];
function map<T, U>(items: readonly T[], transform: (item: T) => U): readonly U[];

function map<T, U>(items: readonly T[], transform: (item: T) => U): readonly U[] {
  return items.map(transform);
}
```

### Overload Pattern Examples

```typescript
// Pattern 1: Different return types based on input
function getValue<T>(obj: T, key: keyof T): T[typeof key];
function getValue<T>(obj: T, key: keyof T, defaultValue: T[typeof key]): T[typeof key];

function getValue<T>(obj: T, key: keyof T, defaultValue?: T[typeof key]): T[typeof key] {
  return (obj[key] ?? defaultValue) as T[typeof key];
}

// Pattern 2: Optional parameters creating different signatures
function createLogger(name: string): Logger;
function createLogger(name: string, level: 'debug' | 'info' | 'warn' | 'error'): Logger;

function createLogger(name: string, level: string = 'info'): Logger {
  return new Logger(name, level);
}

// Pattern 3: Rest parameters with overloads
function join(): string;
function join(first: string): string;
function join(first: string, second: string): string;
function join(first: string, second: string, ...rest: string[]): string;

function join(...parts: string[]): string {
  return parts.join(' ');
}

// Pattern 4: Generic with constraints
function process<T extends string>(value: T): string;
function process<T extends number>(value: T): number;
function process<T extends string | number>(value: T): string | number;

function process<T extends string | number>(value: T): string | number {
  if (typeof value === 'string') return value.toUpperCase();
  return value * 2;
}

// Usage
const str = process('hello');  // string
const num = process(5);  // number

// Pattern 5: Callback-based overloads
function fetch(url: string): Promise<Response>;
function fetch(url: string, callback: (response: Response) => void): void;

function fetch(url: string, callback?: (response: Response) => void): Promise<Response> | void {
  const promise = fetch(url).then(r => r.json());

  if (callback) {
    promise.then(callback);
  } else {
    return promise;
  }
}
```

---

## Rule 4: Callback Types (() => void vs () => unknown)

### ❌ Incorrect

```typescript
// Using any for callbacks (no type safety)
function onClick(callback: any): void {
  callback();  // Unsafe
}

// void callback can be assigned wrong function
interface ButtonProps {
  onClick: () => void;
}

// But this compiles:
<Button onClick={() => { return 42; }} />  // Returns value, but onClick expects void

// Inconsistent callback types
type EventListener = (event: Event) => void;
type ErrorHandler = (error: any) => any;
type SuccessHandler = (data: any) => void;

// No consistency in callback signatures
function onSuccess(callback: (data: unknown) => any) {
  // Doesn't care about return value
}

function onError(callback: (error: unknown) => void) {
  // Explicitly ignores return value
}
```

### ✅ Correct

```typescript
// Use specific return types
function onClick(callback: () => void): void {
  callback();
  // Callback must return void (no value)
}

interface ButtonProps {
  onClick: () => void;
}

// Now this causes error:
// <Button onClick={() => { return 42; }} />  // Error: number not assignable to void

// Consistent callback types based on usage
type AsyncCallback<T> = (result: T | Error) => void;
type SyncCallback<T> = (result: T) => void;
type Transform<T, U> = (item: T) => U;

// Specific callbacks
type OnSuccess<T> = (data: T) => void;
type OnError = (error: Error) => void;
type OnComplete = () => void;

// Usage
async function loadUser(
  onSuccess: OnSuccess<User>,
  onError: OnError,
  onComplete: OnComplete
): Promise<void> {
  try {
    const user = await fetchUser();
    onSuccess(user);
  } catch (error) {
    onError(error as Error);
  } finally {
    onComplete();
  }
}

// Difference between void and unknown returns
function withVoidCallback(callback: () => void): void {
  // Callback might return a value, but we ignore it
  callback();
}

function withUnknownCallback(callback: () => unknown): void {
  // Callback might return a value, and we might use it
  const result = callback();
  if (result instanceof Error) {
    console.error(result);
  }
}

// Safe callback assignment
const logMessage = (): void => {
  console.log('Done');
};

const getMessage = (): string => {
  return 'Done';
};

// assignable to void (return value ignored)
const callback1: () => void = logMessage;  // OK
const callback2: () => void = getMessage;  // OK: return value ignored

// NOT assignable to specific return type
// const callback3: () => string = logMessage;  // Error: void not assignable to string
```

### Callback Pattern Examples

```typescript
// Pattern 1: Promise-like callbacks
interface AsyncOperation<T> {
  onSuccess: (value: T) => void;
  onError: (error: Error) => void;
  onProgress?: (current: number, total: number) => void;
}

// Pattern 2: Event callbacks
interface EventEmitter<T> {
  on(event: string, listener: (data: T) => void): void;
  off(event: string, listener: (data: T) => void): void;
}

// Pattern 3: Transform callbacks
interface Pipeline<T, U> {
  transform: (input: T) => U;
  onComplete: (result: U) => void;
}

// Pattern 4: Conditional callback
function tryExecute<T>(
  fn: () => T,
  onSuccess: (result: T) => void,
  onError?: (error: Error) => void
): void {
  try {
    const result = fn();
    onSuccess(result);
  } catch (error) {
    onError?.(error as Error);
  }
}

// Pattern 5: Retry with callback
async function retryWithCallback<T>(
  operation: () => Promise<T>,
  onRetry: (attempt: number, error: Error) => void,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      onRetry(attempt + 1, lastError);
    }
  }

  throw lastError;
}
```

---

## Return Type vs Callback Return Type Comparison

| Context | Type | Reason |
|---------|------|--------|
| Function returns value | Specific type: `() => string` | Caller needs the value |
| Callback param ignored | `() => void` | Value is not used |
| Promise callbacks | `() => void` or `() => T` | Depends on whether result needed |
| Event listeners | `(event: T) => void` | Event listeners return void |
| Transform function | `(input: T) => U` | Must return transformed value |

---

## Auto-Fix Patterns

When reviewing code, fix patterns immediately:

| Pattern | Fix | Reason |
|---------|-----|--------|
| Function without return type | Add explicit return type | Clear contract |
| `function f(x: any)` | Use typed params | Type safety |
| `() => any` callback | Use specific or `() => void` | Callback safety |
| Multiple `if typeof` in function | Create function overloads | Clear intent |
| Mixing optional + required params | Use defaults or options object | Clear parameter intent |
| `undefined` vs optional param | Use optional parameter `?` | Cleaner API |

---

## References

- [TypeScript: Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [TypeScript: Function Overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)
- [TypeScript: Return Types](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-annotations)
- [TypeScript: Optional Parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#optional-parameters)
