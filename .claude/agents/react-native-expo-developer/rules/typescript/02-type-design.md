# Type Design Rules (HIGH)

**Essential patterns for maintainable and flexible type definitions**

---

## Rule 1: interface vs type (When to Use Each)

### ❌ Incorrect

```typescript
// Using type for objects that should be extensible
type User = {
  id: number;
  name: string;
  email: string;
};

// Using interface for unions (not allowed)
interface Status = 'pending' | 'approved' | 'rejected';  // Syntax error

// Mixing patterns inconsistently
type Product = {
  id: number;
  name: string;
};

interface Order {
  id: number;
  items: any[];  // Should have proper type
}

type Config = {
  debug: boolean;
  apiUrl: string;
};
```

### ✅ Correct

```typescript
// Use interface for object contracts
interface User {
  id: number;
  name: string;
  email: string;
}

// Interface inheritance is natural
interface AdminUser extends User {
  permissions: string[];
  role: 'admin';
}

// Use type for unions, literals, and primitives
type Status = 'pending' | 'approved' | 'rejected';
type Priority = 'low' | 'medium' | 'high';
type Id = string & { readonly brand: 'Id' };  // Branded type

// Use type for complex type operations
type Result<T> = { success: true; data: T } | { success: false; error: string };
type Nullable<T> = T | null | undefined;
type Flatten<T> = T extends Array<infer U> ? U : T;

// Use interface for class contracts
interface Database {
  connect(): Promise<void>;
  query<T>(sql: string): Promise<T[]>;
  disconnect(): Promise<void>;
}

// Consistent pattern: interfaces for data structures
interface ApiResponse {
  status: number;
  data: unknown;
  timestamp: Date;
}

interface ErrorResponse extends ApiResponse {
  status: 400 | 401 | 403 | 404 | 500;
  data: {
    code: string;
    message: string;
  };
}
```

### Guidelines Table

| Use Case | interface | type | Reason |
|----------|-----------|------|--------|
| Object shape | ✅ Preferred | ⚠️ Works | Declaration merging, extends naturally |
| Union types | ❌ No | ✅ Only | Unions require `type` |
| Literal types | ❌ No | ✅ Only | Literals require `type` |
| Generic objects | ✅ Preferred | ✅ Works | Both work, interface is clearer |
| Generics with constraints | ✅ Preferred | ✅ Works | Both work well |
| Function signatures | ✅ Preferred | ✅ Works | Both work, interface for contracts |
| Tuples | ❌ No | ✅ Only | Tuples require `type` |
| Mapped types | ❌ No | ✅ Only | Complex operations need `type` |

### Declaration Merging (interface advantage)

```typescript
// Interfaces can be merged across files
interface User {
  id: number;
  name: string;
}

// Later, extend the same interface
interface User {
  email: string;
}

// Result: User has id, name, and email
const user: User = { id: 1, name: 'John', email: 'john@example.com' };

// Types cannot be merged (would error)
type UserType = { id: number; name: string };
// type UserType = { email: string };  // Error: duplicate identifier

// This is useful for library augmentation
declare global {
  interface Window {
    customProp: string;
  }
}

window.customProp = 'value';  // Now available
```

---

## Rule 2: Generic Types (Reusability Patterns)

### ❌ Incorrect

```typescript
// Duplicated type definitions
interface UserResponse {
  status: number;
  data: User;
  error: null;
}

interface ProductResponse {
  status: number;
  data: Product;
  error: null;
}

interface OrderResponse {
  status: number;
  data: Order;
  error: null;
}

// Generic constraints ignored
function getValue<T>(obj: T, key: any): any {
  return obj[key];  // No type safety
}

// Generic not used effectively
function mapArray<T, U>(items: T[]): any[] {
  return items.map(item => item);  // Loses type information
}

// Overly broad generics
interface Container<T> {
  value: T;
}

const container: Container<any> = { value: 'anything' };  // Defeats purpose
```

### ✅ Correct

```typescript
// Use generic for common patterns
interface ApiResponse<T> {
  status: number;
  data: T;
  error: null;
}

interface ApiError<E = string> {
  status: number;
  data: null;
  error: E;
}

// Now reuse for all response types
type UserResponse = ApiResponse<User>;
type ProductResponse = ApiResponse<Product>;
type OrderResponse = ApiResponse<Order>;

// Generic with constraints
function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];  // Type-safe return
}

// Generic with transform
function mapArray<T, U>(items: T[], transform: (item: T) => U): U[] {
  return items.map(transform);  // Preserves types
}

const numbers = [1, 2, 3];
const doubled = mapArray(numbers, n => n * 2);  // number[]
const strings = mapArray(numbers, n => n.toString());  // string[]

// Multiple generics with relationships
interface Pair<T, U> {
  first: T;
  second: U;
}

interface KeyValue<K extends string | number, V> {
  key: K;
  value: V;
}

// Generic with defaults
interface Repository<T, Id = number> {
  findById(id: Id): Promise<T | null>;
  save(item: T): Promise<Id>;
  delete(id: Id): Promise<void>;
}

type UserRepository = Repository<User>;
type ProductRepository = Repository<Product, string>;  // Custom ID type
```

### Advanced Generic Patterns

```typescript
// Pattern 1: Generic with constraint + default
interface PagedResult<T, PageToken extends string | number = number> {
  items: T[];
  pageToken?: PageToken;
  hasMore: boolean;
}

// Pattern 2: Conditional generics
type Flatten<T> = T extends Array<infer U> ? U : T;

const arr = [1, 2, 3];
type Item = Flatten<typeof arr>;  // Item = number

// Pattern 3: Generic factory pattern
function createRepository<T extends { id: number }>(
  endpoint: string
): Repository<T> {
  return {
    async findById(id: number) {
      const response = await fetch(`${endpoint}/${id}`);
      return response.json() as Promise<T>;
    },
    async save(item: T) {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(item),
      });
      const saved = await response.json() as T;
      return saved.id;
    },
    async delete(id: number) {
      await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
    },
  };
}

// Pattern 4: Generic with multiple constraints
interface Logger<T extends string | object = object> {
  log(message: string, context: T): void;
}

// Pattern 5: Recursive generics
interface TreeNode<T> {
  value: T;
  children?: TreeNode<T>[];
}

const tree: TreeNode<string> = {
  value: 'root',
  children: [
    { value: 'child1' },
    { value: 'child2', children: [{ value: 'grandchild' }] },
  ],
};
```

---

## Rule 3: Type Guards (is, asserts Patterns)

### ❌ Incorrect

```typescript
// No type guard validation
function handleResponse(data: unknown): void {
  console.log(data.name);  // TypeScript doesn't catch error

  if (data instanceof User) {  // User is interface, not class
    console.log(data.email);
  }
}

// Type guard without assertion
function isValidUser(data: unknown) {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data
  );
}

// Function uses result but TypeScript doesn't narrow
if (isValidUser(user)) {
  console.log(user.id);  // Error: TypeScript doesn't know type narrowed
}

// Assert without type predicate
function assertIsUser(data: unknown): void {
  if (!(typeof data === 'object' && data !== null && 'id' in data)) {
    throw new Error('Not a user');
  }
}

assertIsUser(data);
console.log(data.id);  // Error: TypeScript still doesn't know type
```

### ✅ Correct

```typescript
// Type guard with 'is' predicate
interface User {
  id: number;
  name: string;
  email: string;
}

function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data &&
    typeof (data as any).id === 'number' &&
    typeof (data as any).name === 'string' &&
    typeof (data as any).email === 'string'
  );
}

// Usage: TypeScript narrows type automatically
const data: unknown = getUserData();
if (isUser(data)) {
  console.log(data.id);  // ✅ TypeScript knows data is User
  console.log(data.email);  // ✅ Safe
}

// Type assertion with 'asserts' predicate
function assertIsUser(data: unknown): asserts data is User {
  if (!isUser(data)) {
    throw new Error('Expected User, got ' + typeof data);
  }
}

// Usage: After assertion, variable is narrowed
const apiData: unknown = fetchUser();
assertIsUser(apiData);
console.log(apiData.id);  // ✅ TypeScript knows apiData is User
console.log(apiData.email);  // ✅ Safe

// Combine for robust validation
async function loadUser(userId: number): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  const data: unknown = await response.json();

  assertIsUser(data);  // Throws if invalid
  return data;  // TypeScript: User
}
```

### Common Type Guard Patterns

```typescript
// Pattern 1: Discriminated union guard
type ApiResult = { type: 'success'; data: any } | { type: 'error'; error: string };

function isSuccessResult(result: ApiResult): result is { type: 'success'; data: any } {
  return result.type === 'success';
}

// Pattern 2: Array element guard
function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

const items = [1, null, 2, null, 3];
const valid = items.filter(isNotNull);  // number[] (nulls removed)

// Pattern 3: String literal union guard
type Status = 'pending' | 'approved' | 'rejected';

function isPendingStatus(status: unknown): status is 'pending' {
  return status === 'pending';
}

// Pattern 4: Class instance guard
class User {
  constructor(public id: number, public name: string) {}
}

function isUserInstance(value: unknown): value is User {
  return value instanceof User;
}

// Pattern 5: Record guard
function isRecord<K extends PropertyKey, V>(
  value: unknown,
  typeGuard?: (v: unknown) => v is V
): value is Record<K, V> {
  if (typeof value !== 'object' || value === null) return false;

  const entries = Object.entries(value);
  if (typeGuard) {
    return entries.every(([, v]) => typeGuard(v));
  }
  return true;
}

const data: unknown = { a: 1, b: 2, c: 3 };
if (isRecord<string, number>(data)) {
  Object.entries(data).forEach(([key, value]) => {
    // key: string, value: number
  });
}
```

---

## Rule 4: Discriminated Unions (Type Narrowing)

### ❌ Incorrect

```typescript
// Union without discriminator (hard to narrow)
type Result = { data: any } | { error: string };

function handleResult(result: Result): void {
  if (result.data) {  // Might have both data and error
    console.log(result.data);
  }
}

// String union without type safety
function handleStatus(status: string): void {
  if (status === 'pending') {
    // Don't know what properties are available
  }
}

// Multiple conditions to narrow (error-prone)
interface Response {
  type?: string;
  status?: number;
  data?: any;
  error?: string;
}

function process(response: Response): void {
  if (response.type === 'success' && response.status === 200) {
    console.log(response.data);  // Still might be undefined
  }
}
```

### ✅ Correct

```typescript
// Discriminated union with literal type
type SuccessResult = {
  type: 'success';  // Discriminator
  data: any;
  error: null;
};

type ErrorResult = {
  type: 'error';  // Discriminator
  data: null;
  error: string;
};

type Result = SuccessResult | ErrorResult;

// TypeScript automatically narrows based on discriminator
function handleResult(result: Result): void {
  if (result.type === 'success') {
    console.log(result.data);  // ✅ data is present, error is null
  } else {
    console.log(result.error);  // ✅ error is present, data is null
  }
}

// Multiple discriminators
type ApiResponse =
  | {
      status: 'loading';
      data: null;
      error: null;
    }
  | {
      status: 'success';
      data: any;
      error: null;
    }
  | {
      status: 'error';
      data: null;
      error: string;
    };

function renderResponse(response: ApiResponse): string {
  switch (response.status) {
    case 'loading':
      return 'Loading...';
    case 'success':
      return `Data: ${response.data}`;  // ✅ data is defined
    case 'error':
      return `Error: ${response.error}`;  // ✅ error is defined
  }
}

// Exhaustiveness checking
function processResponse(response: ApiResponse): void {
  switch (response.status) {
    case 'loading':
      break;
    case 'success':
      console.log(response.data);
      break;
    case 'error':
      console.log(response.error);
      break;
    default:
      // @ts-expect-error: exhaustive check
      const _exhaustive: never = response;
      throw new Error(`Unhandled status: ${_exhaustive}`);
  }
}
```

### Advanced Discriminated Union Patterns

```typescript
// Pattern 1: Multiple discriminator fields
type Action =
  | {
      type: 'user';
      action: 'create' | 'update' | 'delete';
      userId: number;
    }
  | {
      type: 'post';
      action: 'create' | 'delete';
      postId: number;
    }
  | {
      type: 'comment';
      action: 'create' | 'update' | 'delete';
      commentId: number;
    };

// Both type and action help narrow
function executeAction(action: Action): void {
  if (action.type === 'user' && action.action === 'create') {
    console.log(`Creating user ${action.userId}`);
  }
}

// Pattern 2: Status + data type discriminator
type Request<T extends 'query' | 'mutation'> =
  | {
      status: 'pending';
      type: T;
      result: null;
    }
  | {
      status: 'success';
      type: T;
      result: T extends 'query' ? any[] : { id: string };
    }
  | {
      status: 'error';
      type: T;
      result: Error;
    };

// Pattern 3: Tag-based narrowing
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; a: number; b: number; c: number };

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle': {
      const s = (shape.a + shape.b + shape.c) / 2;
      return Math.sqrt(s * (s - shape.a) * (s - shape.b) * (s - shape.c));
    }
  }
}

// Pattern 4: Conditional discriminated unions
type Event<T extends 'click' | 'change' | 'submit'> =
  | {
      type: 'click';
      target: HTMLElement;
      button: 0 | 1 | 2;
    }
  | {
      type: 'change';
      target: HTMLInputElement;
      value: string;
    }
  | {
      type: 'submit';
      target: HTMLFormElement;
      formData: FormData;
    };

function handleEvent<T extends 'click' | 'change' | 'submit'>(event: Event<T>): void {
  switch (event.type) {
    case 'click':
      console.log(event.button);
      break;
    case 'change':
      console.log(event.value);
      break;
    case 'submit':
      console.log(event.formData);
      break;
  }
}
```

---

## Rule 5: readonly for Immutability

### ❌ Incorrect

```typescript
// Mutable type definition
interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
}

const config: Config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
};

config.timeout = 10000;  // Can be modified (unexpected)

// Mutable array in interface
interface User {
  id: number;
  name: string;
  tags: string[];  // Can be modified
}

const user: User = { id: 1, name: 'John', tags: ['admin'] };
user.tags.push('moderator');  // Mutated!

// No readonly protection on params
function updateConfig(cfg: Config): void {
  cfg.apiUrl = 'https://evil.com';  // Mutation risk
}
```

### ✅ Correct

```typescript
// Readonly type definition
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
  readonly retries: number;
}

const config: Config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
};

// config.timeout = 10000;  // TypeScript error: readonly

// Readonly array
interface User {
  readonly id: number;
  readonly name: string;
  readonly tags: readonly string[];  // Immutable array
}

const user: User = {
  id: 1,
  name: 'John',
  tags: ['admin'],
};

// user.tags.push('moderator');  // TypeScript error: readonly

// Readonly in function parameters
function updateConfig(cfg: Readonly<Config>): void {
  // cfg.apiUrl = 'https://evil.com';  // Error: readonly
  console.log(cfg.apiUrl);
}

// Make copy for modification
function modifyConfig(cfg: Config): Config {
  return {
    ...cfg,
    timeout: 10000,  // Create new object, don't mutate
  };
}

// Const assertion for literals
const ENDPOINTS = {
  users: '/api/users',
  posts: '/api/posts',
} as const;  // Infers { readonly users: '/api/users'; ... }

type Endpoint = typeof ENDPOINTS[keyof typeof ENDPOINTS];  // '/api/users' | '/api/posts'
```

### Immutability Patterns

```typescript
// Pattern 1: Readonly utility types
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// Make all properties readonly
type ReadonlyUser = Readonly<User>;

// Make specific properties readonly
type UserWithReadonlyEmail = User & { readonly email: string };

// Pattern 2: ReadonlyArray
const items: ReadonlyArray<number> = [1, 2, 3];
// items.push(4);  // Error

// Const array
const items2 = [1, 2, 3] as const;  // readonly [1, 2, 3]
type Item = (typeof items2)[number];  // 1 | 2 | 3

// Pattern 3: Readonly Record
type ReadonlyConfig = Readonly<Record<string, string>>;

const config: ReadonlyConfig = {
  apiUrl: 'https://api.com',
};
// config.apiUrl = 'new-url';  // Error

// Pattern 4: Deep readonly (requires external lib or manual definition)
type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};

interface NestedConfig {
  server: {
    host: string;
    port: number;
  };
}

const config: DeepReadonly<NestedConfig> = {
  server: {
    host: 'localhost',
    port: 3000,
  },
};
// config.server.port = 4000;  // Error: readonly

// Pattern 5: Immutable factory pattern
function createUser(id: number, name: string): Readonly<User> {
  return Object.freeze({
    id,
    name,
    email: '',
    createdAt: new Date(),
  });
}

const user = createUser(1, 'John');
// user.name = 'Jane';  // Error: readonly (and Object.freeze prevents it)
```

---

## Auto-Fix Patterns

When reviewing code, fix patterns immediately:

| Pattern | Fix | Reason |
|---------|-----|--------|
| `type X = { ... }` for data | `interface X { ... }` | Extensibility |
| Repeated generic types | Extract to `type Base<T>` | DRY principle |
| Union without discriminator | Add `type` or `status` field | Type narrowing |
| `instanceof` for interfaces | Type guard with `is` | Type safety |
| Mutable config/constants | Add `readonly` modifier | Immutability |
| Multiple conditions to narrow | Use discriminated union | Clarity |

---

## References

- [TypeScript: Handbook - Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript: Handbook - Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript: Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript: Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [TypeScript: readonly](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)
