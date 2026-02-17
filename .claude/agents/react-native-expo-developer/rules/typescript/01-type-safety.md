# Type Safety Rules (CRITICAL)

**Essential rules to prevent runtime errors and type-related bugs**

---

## Rule 1: any Usage Forbidden (Use unknown + Type Guards)

### ❌ Incorrect

```typescript
// Using any bypasses all type checking
function processData(data: any): void {
  console.log(data.name);  // Unsafe: may not exist
  const length = data.length;  // No error, but might crash at runtime
}

// In async operations
async function fetchUser(): Promise<any> {
  const response = await fetch('/api/user');
  const data: any = await response.json();
  return data;  // Could be anything
}

// Type assertion with any
const items: any[] = [];
items.push({ name: 'John' });
items.push('string');  // No error
items.push(123);  // No error
```

### ✅ Correct

```typescript
// Use unknown + type guard
function processData(data: unknown): void {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    console.log(data.name);  // Safe: TypeScript knows it exists
  }
}

// Use type predicate for complex validation
interface User {
  id: number;
  name: string;
  email: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value &&
    typeof (value as any).id === 'number' &&
    typeof (value as any).name === 'string' &&
    typeof (value as any).email === 'string'
  );
}

async function fetchUser(): Promise<User> {
  const response = await fetch('/api/user');
  const data: unknown = await response.json();

  if (isUser(data)) {
    return data;  // TypeScript knows it's User
  }
  throw new Error('Invalid user data');
}

// Type-safe arrays
interface Item {
  id: number;
  name: string;
}

const items: Item[] = [];
items.push({ id: 1, name: 'John' });
// items.push('string');  // ✅ Error caught at compile time
// items.push(123);  // ✅ Error caught at compile time
```

### Why Critical?

- `any` disables **all type checking**, defeating TypeScript's purpose
- Runtime errors occur only when the code runs
- `unknown` forces explicit validation before use
- Type guards make intent clear and catch errors early

### Type Guard Patterns

```typescript
// Basic type guards
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

// Object type guard
interface Config {
  apiUrl: string;
  timeout: number;
}

function isConfig(value: unknown): value is Config {
  return (
    typeof value === 'object' &&
    value !== null &&
    'apiUrl' in value &&
    'timeout' in value &&
    typeof (value as any).apiUrl === 'string' &&
    typeof (value as any).timeout === 'number'
  );
}

// Discriminated union type guard
type Result = { success: true; data: any } | { success: false; error: string };

function isSuccessResult(result: Result): result is { success: true; data: any } {
  return result.success === true;
}

// Array type guard
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

// Usage
const config: unknown = JSON.parse(configJson);
if (isConfig(config)) {
  console.log(config.apiUrl);  // Safe
}
```

---

## Rule 2: Type Assertions (as) Minimization (Use Type Guards Instead)

### ❌ Incorrect

```typescript
// Over-reliance on type assertions
const user = JSON.parse(userJson) as User;
console.log(user.name);  // May crash if data doesn't match

// Multiple assertions
const data = fetchData() as unknown as string;

// In event handlers
function handleClick(event: any): void {
  const target = event.target as HTMLInputElement;  // Unsafe
  console.log(target.value);
}

// After filter (losing type safety)
const numbers = [1, '2', 3, 'four'];
const onlyNumbers = numbers.filter(n => typeof n === 'number') as number[];
```

### ✅ Correct

```typescript
// Use type guards instead of assertions
function parseUser(data: unknown): User | null {
  if (isUser(data)) {
    return data;  // Type narrowed by guard
  }
  return null;
}

// In event handlers with type safety
function handleClick(event: React.MouseEvent<HTMLInputElement>): void {
  const value = event.currentTarget.value;  // Typed correctly
  console.log(value);
}

// Type-safe filtering with assertion only as last resort
const numbers: (number | string)[] = [1, '2', 3, 'four'];

// Option 1: Filter with proper type predicate (preferred)
function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}
const onlyNumbers = numbers.filter(isNumber);  // Type is number[]

// Option 2: Filter with inline type guard
const onlyNumbers2 = numbers.filter((n): n is number => typeof n === 'number');

// Option 3: Use satisfies (TypeScript 4.9+)
const config = { apiUrl: 'https://api.example.com', timeout: 5000 } satisfies Config;
```

### When Type Assertions Are Acceptable

```typescript
// 1. Working with DOM APIs (necessary evil)
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;  // Non-null assertion justified here

// 2. Exhaustive checks in discriminated unions
type Message = { type: 'text'; content: string } | { type: 'image'; url: string };

function processMessage(msg: Message): void {
  if (msg.type === 'text') {
    console.log((msg as { type: 'text'; content: string }).content);
    // Or use type guard instead
    if (msg.type === 'text') {
      console.log(msg.content);  // Better: no assertion needed
    }
  }
}

// 3. Third-party library integration (with confidence)
import { someLibraryFunction } from 'third-party';
const result = someLibraryFunction() as ExpectedType;  // Only if you're certain
```

### Assertion vs Guard Comparison

| Approach | Safety | Performance | Readability |
|----------|--------|-------------|-------------|
| `as Type` assertion | ❌ Low | ✅ Fast | ⚠️ Unclear intent |
| Type guard + narrowing | ✅ High | ✅ Same | ✅ Clear intent |
| satisfies operator | ✅ Medium | ✅ Fast | ✅ Good |

---

## Rule 3: Non-null Assertion (!) Forbidden (Use Nullish Coalescing)

### ❌ Incorrect

```typescript
// Non-null assertion hides potential null/undefined
const user: User | null = getUser();
console.log(user!.name);  // May crash if null

// In optional chains
const email = user?.email!;  // Defeats the purpose of optional chain

// React refs
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  inputRef.current!.focus();  // May crash during cleanup
});

// Array access
const items = [1, 2, 3];
const last = items[items.length - 1]!;  // Dangerous assumption
```

### ✅ Correct

```typescript
// Use nullish coalescing operator (??)
const user: User | null = getUser();
const name = user?.name ?? 'Unknown User';

// In optional chains with fallback
const email = user?.email ?? 'no-email@example.com';

// React refs with proper handling
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  if (inputRef.current) {
    inputRef.current.focus();  // Safe check
  }
});

// Array access with bounds check
const items = [1, 2, 3];
const last = items[items.length - 1];
if (last !== undefined) {
  console.log(last);
}

// Or use optional indexing (with noUncheckedIndexedAccess)
const safeItem = items.at(-1);  // Returns undefined if out of bounds
console.log(safeItem ?? 'No items');

// Function parameter with default
function greet(name: string | null | undefined): void {
  const displayName = name ?? 'Guest';
  console.log(`Hello ${displayName}`);
}
```

### Safe Null Handling Patterns

```typescript
// Pattern 1: Guard + Use
function processUser(user: User | null): void {
  if (user === null) {
    console.log('No user found');
    return;
  }
  console.log(user.name);  // Safe: user is definitely User
}

// Pattern 2: Nullish coalescing with defaults
const timeout = configTimeout ?? 5000;
const retryCount = retryCount ?? 3;

// Pattern 3: Optional chaining with coalescing
const userEmail = currentUser?.profile?.email ?? 'unknown@example.com';

// Pattern 4: Type guard with narrowing
function handleValue(value: string | null | undefined): void {
  if (typeof value === 'string') {
    console.log(value.toUpperCase());
  } else {
    console.log('Value is null or undefined');
  }
}

// Pattern 5: Logical AND for required values
if (user && user.email) {
  sendEmail(user.email);  // Both user and email exist
}
```

### Why Non-null Assertions Are Dangerous

```typescript
// Risk 1: Incorrect assumptions
interface SafeList<T> {
  items: T[];
  getFirst(): T {  // Claims to always return T
    return this.items[0]!;  // Crashes if empty
  }
}

// Risk 2: Refactoring breaks code silently
let count: number = 5;
console.log(count!.toFixed(2));  // Works now, but...

count = null;  // Someone changes type to number | null
console.log(count!.toFixed(2));  // Still compiles, crashes at runtime
```

---

## Rule 4: noUncheckedIndexedAccess (Array/Object Access Safety)

### Configuration

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true
  }
}
```

### ❌ Incorrect

```typescript
// Without noUncheckedIndexedAccess: compiles but unsafe
const items = [1, 2, 3];
const unknown: number = items[10];  // undefined assigned to number

const user = { name: 'John' };
const age: number = user['age'];  // undefined assigned to number

// Dynamic key access
const config: Record<string, string> = { apiUrl: 'https://api.com' };
const baseUrl: string = config['apiUrl'];  // May be undefined
const timeout: string = config['timeout'];  // May be undefined
```

### ✅ Correct

```typescript
// With noUncheckedIndexedAccess enabled
const items = [1, 2, 3];
const unknown = items[10];  // TypeScript: number | undefined

// Safe access with bounds check
const items = [1, 2, 3];
if (items.length > 10) {
  const value = items[10];  // Now safely number
}

// Safe access with optional indexing
const safeValue = items.at(10);  // Returns undefined if out of bounds
const value = safeValue ?? 0;

// Object key access with type guard
const config: Record<string, string> = { apiUrl: 'https://api.com' };
const baseUrl = config['apiUrl'];  // string | undefined
const timeout = config['timeout'] ?? '5000';  // Safe with default

// Create typed getters for object access
function getConfigValue<K extends keyof Config>(key: K): Config[K] {
  return config[key];  // Always safe, returns exact type
}

const apiUrl = getConfigValue('apiUrl');  // string (not undefined)
```

### Safe Indexed Access Patterns

```typescript
// Pattern 1: Array method with bounds safety
const items = [1, 2, 3];

// Safe alternatives to indexed access
const first = items.at(0);  // 1 | undefined
const last = items.at(-1);  // 3 | undefined
const element = items[0]?? null;  // 1 | null

// Pattern 2: Destructuring with defaults
const [first, second, third = 0] = items;  // Safely assigns 0 if missing

// Pattern 3: Find instead of index access
const users = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
const user = users.find(u => u.id === 1);  // User | undefined (safe)

// Pattern 4: Object property access with strict keys
interface Config {
  apiUrl: string;
  timeout: number;
}

const config: Config = { apiUrl: 'https://api.com', timeout: 5000 };
// Always access with keys - can't accidentally access undefined
const apiUrl = config['apiUrl'];  // string (definitely exists)
const baseUrl = config['timeout'];  // number (definitely exists)

// Pattern 5: Record with utility types for flexibility
type ApiEndpoints = Record<'users' | 'posts' | 'comments', string>;
const endpoints: ApiEndpoints = {
  users: '/api/users',
  posts: '/api/posts',
  comments: '/api/comments',
};

const usersEndpoint = endpoints['users'];  // string (always exists)
// endpoints['invalid'];  // TypeScript error: not in union type
```

### Handling Dynamic Keys Safely

```typescript
// Problem: Dynamic object keys may not exist
const metadata: Record<string, any> = {
  createdAt: new Date(),
  author: 'John',
};

// Solution 1: Type guard for existence
function getValue<K extends PropertyKey>(obj: Record<K, any>, key: K): any | undefined {
  return obj[key];  // Explicit | undefined
}

// Solution 2: Create typed accessor
function getMetadata<K extends keyof typeof metadata>(key: K) {
  return metadata[key];  // Exact type, never undefined
}

// Solution 3: Validate before access
function safeAccess<T>(obj: Record<string, T>, key: string): T | undefined {
  if (key in obj) {
    return obj[key];  // Safe: we checked it exists
  }
  return undefined;
}

// Usage
const createdAt = safeAccess(metadata, 'createdAt');
const timestamp = createdAt ? createdAt.getTime() : null;
```

---

## Auto-Fix Patterns

When reviewing code, fix patterns immediately:

| Pattern | Fix | Reason |
|---------|-----|--------|
| `as any` or `as Type` | Type guard + narrowing | Type safety |
| `value!` | `value ?? default` or guard | Prevents crashes |
| `data[index]` without bounds | `data.at(index)` or guard | Handles undefined |
| `(value as any).prop` | Type guard or type assertion | Explicit safety |
| `JSON.parse() as Type` | isType() guard + parse | Validates data |

---

## References

- [TypeScript: Understanding any](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any)
- [TypeScript: Type Guards and Predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript: Unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [TypeScript: noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)
- [Optional Chaining (?.) MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- [Nullish Coalescing (??) MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
