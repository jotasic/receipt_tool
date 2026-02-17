# Utility Types Rules (MEDIUM)

**Essential patterns for type transformation and field manipulation**

---

## Rule 1: Partial/Required (Field Manipulation)

### ❌ Incorrect

```typescript
// Duplicating types for optional versions
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

interface UserUpdate {
  id?: number;
  name?: string;
  email?: string;
  age?: number;
}

// Manually repeating field definitions
interface Config {
  debug: boolean;
  apiUrl: string;
  timeout: number;
}

interface PartialConfig {
  debug?: boolean;
  apiUrl?: string;
  timeout?: number;
}

// Required fields without proper types
type PartialUser = {
  id?: number;
  name?: string;
  email?: string;
};

function completeUser(user: PartialUser): User {
  return {
    // No type check - might have undefined
    id: user.id,
    name: user.name,
    email: user.email,
    age: 0,
  } as User;  // Unsafe cast
}
```

### ✅ Correct

```typescript
// Use Partial for optional fields
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Update operations with Partial
type UserUpdate = Partial<User>;
// Same as: { id?: number; name?: string; email?: string; age?: number }

function updateUser(id: number, updates: UserUpdate): User {
  // All fields are optional
  const newUser = { ...currentUser, ...updates };
  return newUser;
}

// Use Required for making optional fields required
interface Config {
  debug?: boolean;
  apiUrl?: string;
  timeout?: number;
}

type StrictConfig = Required<Config>;
// Same as: { debug: boolean; apiUrl: string; timeout: number }

function validateConfig(config: StrictConfig): boolean {
  // All fields are guaranteed to exist
  return config.debug && config.apiUrl.length > 0;
}

// Combine Partial with Record for flexible updates
type UserUpdate = Partial<User> & { id: number };  // id is required

function updateUser(update: UserUpdate): User {
  // id must be present, other fields are optional
  const { id, ...rest } = update;
  return { ...currentUser, id, ...rest };
}

// Using Required to narrow optional types
function ensureConfig(config: Partial<Config>): Required<Config> {
  return {
    debug: config.debug ?? false,
    apiUrl: config.apiUrl ?? 'http://localhost:3000',
    timeout: config.timeout ?? 5000,
  };
}

const strict: Required<Config> = ensureConfig(partialConfig);
```

### Advanced Partial/Required Patterns

```typescript
// Pattern 1: Partial for constructor-like functions
interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
}

function connectToDatabase(config: Partial<DatabaseConfig>): Connection {
  const finalConfig = {
    host: config.host ?? 'localhost',
    port: config.port ?? 5432,
    username: config.username ?? 'admin',
    password: config.password ?? 'password',
  };
  return new Connection(finalConfig);
}

// Pattern 2: Required for narrowing types
interface ApiResponse {
  status?: number;
  data?: any;
  error?: string;
}

function processResponse(response: ApiResponse): Required<ApiResponse> {
  return {
    status: response.status ?? 500,
    data: response.data ?? null,
    error: response.error ?? '',
  };
}

// Pattern 3: Partial with specific fields
type UserUpdatePayload = Partial<Pick<User, 'name' | 'email' | 'age'>>;
// Only these three fields, all optional

// Pattern 4: Required for validation
interface FormData {
  username?: string;
  password?: string;
  email?: string;
}

function validateFormData(data: FormData): data is Required<FormData> {
  return !!(data.username && data.password && data.email);
}

const data: FormData = { username: 'john', password: '123', email: 'john@example.com' };

if (validateFormData(data)) {
  // All fields are now Required
  console.log(data.username.length);  // Safe
}

// Pattern 5: Conditional Required/Partial
type ConfigShape<T extends 'dev' | 'prod'> = T extends 'dev'
  ? Partial<Config>  // Dev can have partial config
  : Required<Config>;  // Prod requires all fields

function createConfig<T extends 'dev' | 'prod'>(mode: T, config: ConfigShape<T>) {
  // Type depends on mode
}

createConfig('dev', { debug: true });  // Partial OK
createConfig('prod', { debug: true });  // Error: missing fields
```

---

## Rule 2: Pick/Omit (Field Selection)

### ❌ Incorrect

```typescript
// Creating types by duplicating fields
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PublicUser {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  // password omitted manually - maintenance burden
}

interface UserPreview {
  id: number;
  name: string;
  email: string;
  // Other fields omitted manually
}

// No type safety on field removal
function createPublicUser(user: User): PublicUser {
  const { password, ...rest } = user;  // Manual property filtering
  return rest as PublicUser;  // Unsafe cast
}

// Difficult to maintain when User changes
function serializeUser(user: User): object {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    // If User gains a new field, must remember to exclude it
  };
}
```

### ✅ Correct

```typescript
// Use Pick to select specific fields
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// Select specific fields
type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'createdAt' | 'updatedAt'>;
// Same as: { id: number; name: string; email: string; createdAt: Date; updatedAt: Date }

// Shorter: use Omit to exclude
type PublicUser = Omit<User, 'password'>;
// Same result, clearer intent

// Use Omit for removing sensitive fields
type UserResponse = Omit<User, 'password'>;

function createPublicUser(user: User): UserResponse {
  const { password, ...rest } = user;
  return rest;  // Type-safe, no cast needed
}

// Use Pick for specific views
type UserPreview = Pick<User, 'id' | 'name'>;
// Only id and name

type UserEmail = Pick<User, 'email'>;
// Only email

// API response types with Omit
type ApiUser = Omit<User, 'password' | 'updatedAt'>;

// GraphQL-like field selection
type UserMinimal = Pick<User, 'id' | 'name'>;
type UserFull = Omit<User, 'password'>;
type UserWithPassword = User;

// Flexible field selection
function serializeUser<T extends Pick<User, 'id' | 'name' | 'email'>>(user: T): T {
  return user;  // Type-safe serialization
}
```

### Advanced Pick/Omit Patterns

```typescript
// Pattern 1: Dynamic field selection
type SelectFields<T, K extends keyof T> = Pick<T, K>;

type UserNameOnly = SelectFields<User, 'name'>;  // { name: string }
type UserIdEmail = SelectFields<User, 'id' | 'email'>;  // { id: number; email: string }

// Pattern 2: Exclude sensitive fields
interface DbUser {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: Date;
  lastLogin: Date | null;
}

type SafeUser = Omit<DbUser, 'passwordHash' | 'salt'>;

// Pattern 3: Response types for different endpoints
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  cost: number;
  inventory: number;
  supplier: string;
}

type ProductPublic = Omit<Product, 'cost' | 'inventory' | 'supplier'>;
type ProductAdmin = Product;
type ProductList = Pick<Product, 'id' | 'name' | 'price'>;

// Pattern 4: Conditional field selection
type IsAdmin = true;

type UserData<IsAdmin> = IsAdmin extends true
  ? User  // Admin sees all
  : Omit<User, 'password'>;  // User sees safe version

// Pattern 5: Combining Pick and Partial
type UserPartialFields = Partial<Pick<User, 'name' | 'email' | 'age'>>;
// { name?: string; email?: string; age?: number }

// Pattern 6: Required fields from type
interface Config {
  required1: string;
  optional1?: string;
  required2: number;
  optional2?: string;
}

// This is harder - no built-in utility, but can create
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type ConfigRequired = Pick<Config, RequiredKeys<Config>>;
// { required1: string; required2: number }
```

---

## Rule 3: Record (Object Type Definition)

### ❌ Incorrect

```typescript
// Using any for object types
const config: any = {
  debug: true,
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};

// Manually typed key-value with duplicates
interface ColorMap {
  red: string;
  green: string;
  blue: string;
  yellow: string;
  black: string;
  white: string;
}

// No type safety on dynamic keys
function getConfig(key: string): any {
  return config[key];
}

// Object with unknown structure
type Settings = { [key: string]: any };
```

### ✅ Correct

```typescript
// Use Record for key-value types
type ColorMap = Record<'red' | 'green' | 'blue' | 'yellow' | 'black' | 'white', string>;
// { red: string; green: string; blue: string; ... }

const colors: ColorMap = {
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
  yellow: '#FFFF00',
  black: '#000000',
  white: '#FFFFFF',
};

// Type-safe key access
function getColor(name: keyof ColorMap): string {
  return colors[name];
}

getColor('red');  // OK
// getColor('orange');  // Error: not in union

// Record with enum keys
enum Status {
  Pending = 'pending',
  Active = 'active',
  Inactive = 'inactive',
}

type StatusCount = Record<Status, number>;
// { pending: number; active: number; inactive: number }

const counts: StatusCount = {
  [Status.Pending]: 0,
  [Status.Active]: 5,
  [Status.Inactive]: 2,
};

// Record with string | number keys
type NumberStringMap = Record<string, number>;
// { [key: string]: number }

const metrics: NumberStringMap = {
  'response-time': 150,
  'cpu-usage': 45,
  'memory-usage': 78,
};

// Record with complex value types
interface User {
  id: number;
  name: string;
}

type UserById = Record<number, User>;
// { [key: number]: User }

const users: UserById = {
  1: { id: 1, name: 'John' },
  2: { id: 2, name: 'Jane' },
  3: { id: 3, name: 'Bob' },
};

// Type-safe lookup
function getUser(id: number): User | undefined {
  return users[id];
}
```

### Advanced Record Patterns

```typescript
// Pattern 1: Record with Union keys
type Config = Record<'debug' | 'verbose' | 'silent', boolean>;

const logLevels: Config = {
  debug: true,
  verbose: true,
  silent: false,
};

// Pattern 2: Record with Enum
enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE',
}

type EndpointConfig = Record<HttpMethod, { timeout: number; retries: number }>;

const endpoints: EndpointConfig = {
  [HttpMethod.Get]: { timeout: 5000, retries: 3 },
  [HttpMethod.Post]: { timeout: 10000, retries: 2 },
  [HttpMethod.Put]: { timeout: 10000, retries: 2 },
  [HttpMethod.Delete]: { timeout: 5000, retries: 1 },
};

// Pattern 3: Record mapping one type to another
type RolePermissions = Record<'admin' | 'user' | 'guest', string[]>;

const permissions: RolePermissions = {
  admin: ['read', 'write', 'delete', 'manage-users'],
  user: ['read', 'write'],
  guest: ['read'],
};

// Pattern 4: Nested Record
type LanguageTranslations = Record<string, Record<string, string>>;

const translations: LanguageTranslations = {
  en: { hello: 'Hello', goodbye: 'Goodbye' },
  es: { hello: 'Hola', goodbye: 'Adiós' },
  fr: { hello: 'Bonjour', goodbye: 'Au revoir' },
};

// Pattern 5: Record with function values
type Handlers = Record<'click' | 'scroll' | 'resize', (event: Event) => void>;

const handlers: Handlers = {
  click: (e) => console.log('Clicked'),
  scroll: (e) => console.log('Scrolled'),
  resize: (e) => console.log('Resized'),
};

// Pattern 6: Dynamic Record from type
interface User {
  id: number;
  name: string;
  email: string;
}

type UsersByField = Record<keyof User, Set<any>>;
// { id: Set<number>; name: Set<string>; email: Set<string> }

// Pattern 7: Record for strategy pattern
type Formatter = Record<'json' | 'xml' | 'csv', (data: any) => string>;

const formatters: Formatter = {
  json: (data) => JSON.stringify(data),
  xml: (data) => `<data>${data}</data>`,
  csv: (data) => data.join(','),
};

function format(data: any, type: keyof Formatter): string {
  return formatters[type](data);
}
```

---

## Rule 4: ReturnType/Parameters (Function Type Extraction)

### ❌ Incorrect

```typescript
// Duplicating function signatures
function fetchUser(id: number): Promise<User> {
  // implementation
}

type FetchUserReturn = Promise<User>;  // Duplicated
type FetchUserParams = [id: number];  // Manual

// Manually extracting types from functions
type ApiCallFunction = (endpoint: string, options: RequestInit) => Promise<Response>;

type ApiCallReturn = Promise<Response>;  // Manual
type ApiCallParams = [endpoint: string, options: RequestInit];  // Manual

// Hard to maintain when function signature changes
async function processData(input: string[], options: ProcessOptions): Promise<Result[]> {
  // If signature changes, type definitions won't update
}

type ProcessDataReturn = Promise<Result[]>;  // Must update manually
type ProcessDataParams = [input: string[], options: ProcessOptions];  // Must update manually
```

### ✅ Correct

```typescript
// Use ReturnType to extract return type
function fetchUser(id: number): Promise<User> {
  // implementation
}

type FetchUserReturn = ReturnType<typeof fetchUser>;  // Promise<User>

// Use Parameters to extract parameter types
type FetchUserParams = Parameters<typeof fetchUser>;  // [id: number]

// Use ConstructorParameters for constructors
class User {
  constructor(id: number, name: string) {}
}

type UserConstructorParams = ConstructorParameters<typeof User>;  // [id: number, name: string]

// Extract types from complex functions
type ApiCall = (endpoint: string, options: RequestInit) => Promise<Response>;

type ApiCallReturn = ReturnType<ApiCall>;  // Promise<Response>
type ApiCallParams = Parameters<ApiCall>;  // [endpoint: string, options: RequestInit]

// Extract from async functions
async function processData(input: string[]): Promise<Result[]> {
  // implementation
}

type ProcessResult = ReturnType<typeof processData>;  // Promise<Result[]>
type ProcessParams = Parameters<typeof processData>;  // [input: string[]]

// Extract Awaited return from Promise-returning functions
async function getUser(): Promise<User> {
  // implementation
}

type GetUserReturn = ReturnType<typeof getUser>;  // Promise<User>
type UnwrappedUser = Awaited<GetUserReturn>;  // User (unwrapped Promise)

// Or directly:
type User = Awaited<ReturnType<typeof getUser>>;

// Usage pattern: decorator-like function
function withLogging<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => Awaited<ReturnType<T>> {
  return async (...args: Parameters<T>) => {
    console.log('Calling:', fn.name, args);
    const result = await fn(...args);
    console.log('Result:', result);
    return result;
  };
}
```

### Advanced ReturnType/Parameters Patterns

```typescript
// Pattern 1: Extract types from middleware
type Middleware = (req: Request, res: Response, next: NextFunction) => void;

type MiddlewareParams = Parameters<Middleware>;  // [req: Request, res: Response, next: NextFunction]
type MiddlewareReturn = ReturnType<Middleware>;  // void

// Pattern 2: Create matching functions
interface UserService {
  getUser(id: number): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
}

type GetUserParams = Parameters<UserService['getUser']>;  // [id: number]
type GetUserReturn = ReturnType<UserService['getUser']>;  // Promise<User>

// Pattern 3: Extract from overloaded functions
function process(data: string): string;
function process(data: number): number;
function process(data: string | number): string | number {
  return data;
}

// Gets the last overload
type ProcessParams = Parameters<typeof process>;  // [data: string | number]
type ProcessReturn = ReturnType<typeof process>;  // string | number

// Pattern 4: Conditional type extraction
type ExtractReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type FuncReturn = ExtractReturnType<(x: number) => string>;  // string
type NotFunc = ExtractReturnType<number>;  // never

// Pattern 5: Promise unwrapping
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

async function fetchUser(id: number): Promise<User> {}

type FetchReturn = ReturnType<typeof fetchUser>;  // Promise<User>
type UnwrappedUser = UnwrapPromise<FetchReturn>;  // User

// Or using Awaited (TypeScript 4.5+)
type UserDirect = Awaited<ReturnType<typeof fetchUser>>;  // User

// Pattern 6: Extract callback parameters
type EventListener<T> = (event: T) => void;

type ClickEvent = {
  x: number;
  y: number;
  button: number;
};

type ClickListenerParams = Parameters<EventListener<ClickEvent>>;  // [event: ClickEvent]

// Usage
const clickHandler: EventListener<ClickEvent> = (event) => {
  console.log(event.x, event.y);  // Type-safe
};
```

---

## Rule 5: Awaited (Promise Unwrapping)

### ❌ Incorrect

```typescript
// Manual Promise unwrapping
async function getUser(): Promise<User> {
  return { id: 1, name: 'John' };
}

type UserType = Promise<User>;  // Still wrapped
const user: UserType = getUser();  // Type is still Promise

// Accessing Promise result without unwrapping
async function loadData(): Promise<Data[]> {
  return [];
}

type LoadResult = ReturnType<typeof loadData>;  // Promise<Data[]>

function processResult(result: LoadResult): void {
  // result.length;  // Error: Promise doesn't have .length
  // Must still await or unwrap manually
}

// Nested Promises without unwrapping
async function fetchNested(): Promise<Promise<User>> {
  return getUser();
}

type NestedReturn = ReturnType<typeof fetchNested>;  // Promise<Promise<User>>
// Hard to work with!
```

### ✅ Correct

```typescript
// Use Awaited to unwrap Promises
async function getUser(): Promise<User> {
  return { id: 1, name: 'John' };
}

type UserType = Awaited<ReturnType<typeof getUser>>;  // User (unwrapped!)

// Direct use with Awaited
type User = Awaited<Promise<User>>;  // User (the inner type)

// Unwrapping nested Promises
async function fetchNested(): Promise<Promise<User>> {
  return getUser();
}

type NestedReturn = ReturnType<typeof fetchNested>;  // Promise<Promise<User>>
type UnwrappedOnce = Awaited<NestedReturn>;  // Promise<User>
type FullyUnwrapped = Awaited<UnwrappedOnce>;  // User

// Or directly get User:
type User = Awaited<Awaited<ReturnType<typeof fetchNested>>>;

// Usage in functions
async function processUser(): Promise<void> {
  const user: Awaited<ReturnType<typeof getUser>> = await getUser();
  // user is User, not Promise<User>
  console.log(user.name);  // Safe
}

// Extract and unwrap from async function
async function loadData(): Promise<Data[]> {
  return [];
}

type DataArray = Awaited<ReturnType<typeof loadData>>;  // Data[]

function processResult(result: DataArray): void {
  result.forEach(item => console.log(item));  // Safe
}
```

### Advanced Awaited Patterns

```typescript
// Pattern 1: Helper to extract async function return type
type AsyncReturnType<T extends (...args: any) => Promise<any>> = Awaited<ReturnType<T>>;

async function getUser(): Promise<User> {}
async function getPost(): Promise<Post> {}

type User = AsyncReturnType<typeof getUser>;  // User
type Post = AsyncReturnType<typeof getPost>;  // Post

// Pattern 2: Unwrap mixed Promise chains
type MaybePromise<T> = T | Promise<T>;

type Unwrap<T> = T extends Promise<infer U> ? U : T;

type Result1 = Unwrap<Promise<number>>;  // number
type Result2 = Unwrap<number>;  // number
type Result3 = Awaited<Promise<Promise<number>>>;  // number

// Pattern 3: Extract array element type from Promise
type AsyncArray = Promise<User[]>;

type ArrayElement = Awaited<AsyncArray>[number];  // User

// Pattern 4: Work with Promise.all
const promises = [
  getUser(),  // Promise<User>
  getPost(),  // Promise<Post>
  getComments(),  // Promise<Comment[]>
];

type PromiseResults = Awaited<(typeof promises)[number]>;  // User | Post | Comment[]

// Pattern 5: Conditional Awaited
type MaybeAsyncValue<T> = T extends Promise<infer U> ? Awaited<Promise<U>> : T;

type Result1 = MaybeAsyncValue<Promise<User>>;  // User
type Result2 = MaybeAsyncValue<User>;  // User
type Result3 = MaybeAsyncValue<Promise<Promise<User>>>;  // User (fully unwrapped)

// Pattern 6: React hooks with Awaited
import { useEffect, useState } from 'react';

async function fetchUser(id: number): Promise<User> {
  // implementation
}

export function useUser(id: number) {
  type FetchedUser = Awaited<ReturnType<typeof fetchUser>>;
  const [user, setUser] = useState<FetchedUser | null>(null);

  useEffect(() => {
    fetchUser(id).then(setUser);
  }, [id]);

  return user;
}
```

---

## Auto-Fix Patterns

When reviewing code, fix patterns immediately:

| Pattern | Fix | Reason |
|---------|-----|--------|
| Duplicated type and interface | Use `Omit<T, K>` or `Pick<T, K>` | Single source of truth |
| Manual return type extraction | Use `ReturnType<typeof fn>` | Auto-updates |
| Manual parameter extraction | Use `Parameters<typeof fn>` | Auto-updates |
| Nested Promise type | Use `Awaited<T>` | Clean unwrapping |
| Repeating optional fields | Use `Partial<T>` | Less duplication |
| Key-value object | Use `Record<K, V>` | Type-safe |

---

## References

- [TypeScript: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript: Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialt)
- [TypeScript: Required](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredt)
- [TypeScript: Pick](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktk)
- [TypeScript: Omit](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittk)
- [TypeScript: Record](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkt)
- [TypeScript: ReturnType](https://www.typescriptlang.org/docs/handbook/utility-types.html#returntypet)
- [TypeScript: Parameters](https://www.typescriptlang.org/docs/handbook/utility-types.html#parameterst)
- [TypeScript: Awaited](https://www.typescriptlang.org/docs/handbook/utility-types.html#awaitedtype)
