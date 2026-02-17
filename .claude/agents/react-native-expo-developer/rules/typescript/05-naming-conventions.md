# Naming Conventions Rules (LOW)

**Essential patterns for consistent and clear naming across the codebase**

---

## Rule 1: Type Naming (PascalCase, No I Prefix)

### ❌ Incorrect

```typescript
// Using I prefix (C# convention, not TypeScript)
interface IUser {
  id: number;
  name: string;
}

interface IUserService {
  getUser(id: number): Promise<IUser>;
}

// Lowercase type names
type user = { id: number; name: string };
type userResponse = { data: user; status: number };

// Mixing conventions
interface user {
  id: number;
}

type User = {
  id: number;
};

// Generic types with unclear names
type T<X> = X extends any[] ? X[0] : X;
type Obj<K, V> = { [key: K]: V };

// Private type with underscore (not standard)
type _InternalUser = { id: number };
type __privateConfig = {};

// Type names that don't indicate type
type data = any;
type result = { success: boolean };
type options = { [key: string]: any };
```

### ✅ Correct

```typescript
// PascalCase for all type names
interface User {
  id: number;
  name: string;
}

interface UserService {
  getUser(id: number): Promise<User>;
}

// Consistent with PascalCase
type UserResponse = { data: User; status: number };
type ApiError = { code: string; message: string };

// Generic types with meaningful names
type Flatten<T> = T extends Array<infer U> ? U : T;
type Record<K extends string | number | symbol, V> = { [P in K]: V };

// PascalCase applies to all type-like constructs
type Status = 'pending' | 'approved' | 'rejected';
type Priority = 'low' | 'medium' | 'high';
type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Union types
type Result<T> = { success: true; data: T } | { success: false; error: string };
type Nullable<T> = T | null | undefined;

// Readonly/const types
type ApiEndpoints = {
  readonly users: '/api/users';
  readonly posts: '/api/posts';
};

// Branded types (advanced)
type UserId = string & { readonly brand: 'UserId' };
type Email = string & { readonly brand: 'Email' };
```

### Naming Conventions by Type Category

```typescript
// Data Model Types
interface User {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

// Request/Response Types
interface CreateUserRequest {
  name: string;
  email: string;
}

interface UserResponse extends User {
  createdAt: Date;
}

// API Error Types
interface ApiError {
  code: string;
  message: string;
}

interface ValidationError extends ApiError {
  field: string;
}

// Handler/Callback Types
type EventHandler<T> = (event: T) => void;
type Middleware = (req: Request, res: Response, next: NextFunction) => void;
type Transform<T, U> = (item: T) => U;

// State/Configuration Types
interface AppConfig {
  debug: boolean;
  apiUrl: string;
}

interface UserState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

// Utility/Helper Types
type Partial<T> = { [K in keyof T]?: T[K] };
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Nullable<T> = T | null | undefined;

// Discriminated Union Types
type Message = TextMessage | ImageMessage | VideoMessage;

interface TextMessage {
  type: 'text';
  content: string;
}

interface ImageMessage {
  type: 'image';
  url: string;
}

interface VideoMessage {
  type: 'video';
  url: string;
  duration: number;
}

// Status/Enum-like Types
type HttpStatus = 200 | 201 | 400 | 401 | 403 | 404 | 500;
type RequestStatus = 'pending' | 'success' | 'error';
type SortOrder = 'asc' | 'desc';

// Branded/Opaque Types
type UUID = string & { readonly brand: 'UUID' };
type Email = string & { readonly brand: 'Email' };
type PhoneNumber = string & { readonly brand: 'PhoneNumber' };
type ISO8601Date = string & { readonly brand: 'ISO8601Date' };
```

---

## Rule 2: Generic Naming (T, K, V or Meaningful Names)

### ❌ Incorrect

```typescript
// Single-letter generics that are unclear
type Container<A> = { value: A };  // What is A?
function process<X>(items: X[]): X { return items[0]; }

// Inconsistent generic naming
function map<T, U>(items: T[]): U[] { }  // Fine
function map2<Input, Output>(items: Input[]): Output[] { }  // Different style

type Dict<K, V> = { [key: K]: V };  // Mixing K and V
type Pair<T, U> = { first: T; second: U };  // Mixing styles

// Generic names that collide with actual names
interface Generic<Generic> {  // Confusing!
  value: Generic;
}

// No indication of constraints
function process<T>(value: T): T { }  // T could be anything
function find<T>(items: T[], predicate: T): T { }  // Unclear constraints

// Overly verbose generic names
interface GenericContainer<TypeContainedInThisGeneric> {
  value: TypeContainedInThisGeneric;
}
```

### ✅ Correct

```typescript
// Standard single-letter generics for simple cases
type Container<T> = { value: T };
type Array<T> = T[];
function identity<T>(value: T): T { return value; }

// T, K, V for common patterns
type Record<K extends string | number | symbol, V> = { [P in K]: V };
type Dictionary<K, V> = { [key in K]: V };

// Meaningful names when T is not clear enough
type Result<Data, Error> = { success: true; data: Data } | { success: false; error: Error };
type Callback<Input, Output> = (input: Input) => Output;
type Repository<Entity, Id> = {
  findById(id: Id): Promise<Entity | null>;
  save(entity: Entity): Promise<Entity>;
};

// Generic constraints make intent clear
function process<T extends { id: number }>(items: T[]): T {
  // T must have an id property
  return items[0];
}

function find<T, K extends keyof T>(items: T[], key: K): T[K] {
  // K must be a key of T
  return items[0][key];
}

// Multiple generics with clear purpose
type AsyncResult<T, E = Error> = Promise<{ success: true; data: T } | { success: false; error: E }>;

interface Repository<T, Id = number> {
  findById(id: Id): Promise<T | null>;
}

// Generics in functions with constraints
function mapArray<T, U>(items: T[], transform: (item: T) => U): U[] {
  return items.map(transform);
}

function flatMap<T, U extends any[]>(items: T[], transform: (item: T) => U): U[] {
  return items.flatMap(transform);
}

// Advanced: multiple generics with relationships
type Pair<First, Second = First> = { first: First; second: Second };
type Either<Left, Right> = { type: 'left'; value: Left } | { type: 'right'; value: Right };
type Tuple<T, Len extends number = 2> = [T, ...T[]];
```

### Generic Naming Guidelines

```typescript
// Standard conventions:
// T = Type (default for single generic)
// K = Key
// V = Value
// E = Error
// U = Unit/Utility (second type parameter)

// Standard patterns
type Maybe<T> = T | null | undefined;
type Observable<T> = { subscribe(callback: (value: T) => void): void };
type Promise<T> = { then<U>(onSuccess: (value: T) => U): Promise<U> };
type Iterator<T> = { next(): { value: T; done: boolean } };

// Function generic patterns
interface Repository<T, Id = number> {
  findById(id: Id): Promise<T>;
  save(item: T): Promise<Id>;
}

interface Mapper<From, To> {
  map(value: From): To;
  reverse(value: To): From;
}

interface EventEmitter<T> {
  on(listener: (event: T) => void): void;
  emit(event: T): void;
}

// Conditional generics
type If<Condition, Then, Else> = Condition extends true ? Then : Else;
type IsArray<T> = T extends any[] ? true : false;
type Flatten<T> = T extends Array<infer U> ? U : T;

// Constrained generics with meaningful names
function filterByType<Type, FilterType extends Type>(
  items: Type[],
  typeGuard: (item: Type): item is FilterType
): FilterType[] {
  return items.filter(typeGuard);
}

// Multiple constraints
type ValidKey = string | number | symbol;

function createRecord<K extends ValidKey, V>(
  keys: K[],
  getValue: (key: K) => V
): Record<K, V> {
  return Object.fromEntries(keys.map(k => [k, getValue(k)])) as Record<K, V>;
}
```

---

## Rule 3: import type (Type-Only Imports)

### ❌ Incorrect

```typescript
// Importing both types and values without distinction
import { User, getUser, UserService } from './user';
import { Config, loadConfig } from './config';

// Default import mixing types and values
import app from './app';  // Is it a value or type?

// Type used in extends but not marked as type import
import { BaseRepository } from './repository';

class UserRepository extends BaseRepository {
  // TypeScript might include BaseRepository in compiled output
}

// Importing only types but not using type import
import { User, Product, Order } from './models';

const users: User[] = [];  // Type-only usage
const products: Product[] = [];  // Type-only usage

// Deeply nested type imports
import { api } from './api';

type MyRequest = api.Request;  // Type should be imported separately
type MyResponse = api.Response;
```

### ✅ Correct

```typescript
// Separate type imports from value imports
import type { User, UserService } from './user';
import { getUser } from './user';

import type { Config } from './config';
import { loadConfig } from './config';

// Type-only imports are clearly marked
import type { BaseRepository } from './repository';

class UserRepository extends BaseRepository {
  // BaseRepository won't be included in compiled output
}

// Type imports for types only
import type { User, Product, Order } from './models';

const users: User[] = [];
const products: Product[] = [];
const orders: Order[] = [];

// Nested type imports
import type { api } from './api';

type MyRequest = api.Request;
type MyResponse = api.Response;

// Mixed case: some types, some values
import { getUser, updateUser } from './user';
import type { User, UserRole } from './user';

// Import entire namespace as type
import type * as Models from './models';

type MyUser = Models.User;
type MyProduct = Models.Product;

// Re-export types properly
export type { User, UserRole };
export { getUser, updateUser };
```

### Why Type Imports Matter

```typescript
// Without type import (potential issue)
import { Logger } from './logger';

interface AppConfig {
  logger: Logger;  // Type-only usage
}

// Compiled output includes Logger even though it's only used as a type
// This increases bundle size if Logger is only used in types

// With type import (better)
import type { Logger } from './logger';

interface AppConfig {
  logger: Logger;  // Type-only usage
}

// Compiled output doesn't include Logger - cleaner bundle

// More examples
import type { User, Product } from './models';
import { getUser, getProduct } from './api';

interface CacheState {
  user: User;
  product: Product;
}

// Only values are imported at runtime
// Types are stripped at compile time
```

### Type Import Patterns

```typescript
// Pattern 1: Separate type and value imports
import type { User, Role } from './user';
import { getUserById, createUser } from './user';

// Pattern 2: Type namespace imports
import type * as Entities from './entities';

type MyEntity = Entities.User;
type MyConfig = Entities.Config;

// Pattern 3: Mixed imports with clear separation
import type { Api } from './api';
import { createClient } from './api';

const client = createClient();
type ApiType = Api;

// Pattern 4: Re-exporting types
export type { User, UserRole, UserStatus };
export { useUserContext, UserProvider };

// Pattern 5: Type augmentation with imports
import type { Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Pattern 6: Factory pattern with types
import type { Logger } from './logger';
import { createLogger } from './logger';

const logger: Logger = createLogger();
```

---

## Rule 4: File Naming (kebab-case for Files, PascalCase for Types)

### ❌ Incorrect

```typescript
// TypeScript files with PascalCase (not standard)
// user.service.ts (has User type)
export interface User { }
export class UserService { }

// CamelCase file names
// itemService.ts
export class itemService { }

// Underscore naming
// user_model.ts
export interface user_model { }

// No pattern consistency
// getUser.ts vs GetUserRequest.ts vs user-types.ts
// Makes codebase inconsistent

// Files with confusing names
// u.ts (unclear what U is)
// helper.ts (too generic)
// index.ts in many places without context

// Capitalized folders
// Users/index.ts
// Services/UserService.ts
```

### ✅ Correct

```typescript
// kebab-case for all files
// user.ts or user-service.ts or user-types.ts

// File: user.ts
export interface User {
  id: number;
  name: string;
}

export interface UserRole {
  id: number;
  name: string;
}

// File: user-service.ts
import type { User } from './user';

export class UserService {
  async getUser(id: number): Promise<User> {
    // implementation
  }
}

// File: user-repository.ts
import type { User } from './user';

export interface UserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<User>;
}

// Consistent folder/file structure
// src/
//   models/
//     user.ts
//     product.ts
//   services/
//     user-service.ts
//     product-service.ts
//   repositories/
//     user-repository.ts
//   utils/
//     string-utils.ts
//     date-utils.ts

// kebab-case file names with PascalCase types
export type UserId = string & { readonly brand: 'UserId' };
export type Email = string & { readonly brand: 'Email' };

export interface UserProfile {
  id: UserId;
  email: Email;
}

// Hooks with kebab-case
// use-user-profile.ts
export function useUserProfile(id: UserId): UserProfile | null {
  // implementation
}

// Components with PascalCase inside kebab-case files
// user-card.tsx
export function UserCard(props: { user: User }): JSX.Element {
  // implementation
}

// Constants files
// user-constants.ts
export const USER_ROLES = ['admin', 'user', 'guest'] as const;
export const DEFAULT_USER_TIMEOUT = 5000;
```

### File Organization Patterns

```typescript
// Pattern 1: Type definition files
// user-types.ts
export interface User { }
export interface UserProfile { }
export interface UserSettings { }

// Pattern 2: Enum/const files
// user-constants.ts
export const USER_ROLES = ['admin', 'user', 'guest'] as const;
export enum UserStatus { Active, Inactive }

// Pattern 3: Utility function files
// user-utils.ts
export function isValidEmail(email: string): boolean { }
export function formatUserName(user: User): string { }

// Pattern 4: Service/class files
// user-service.ts
export class UserService {
  // implementation
}

// Pattern 5: Hook files (React)
// use-user.ts
export function useUser(id: number): User | null { }

// Pattern 6: Component files (React)
// user-profile.tsx
export function UserProfile(props: UserProfileProps): JSX.Element { }

// Pattern 7: Test files (follow source naming)
// user.test.ts (for user.ts)
// user-service.test.ts (for user-service.ts)

// Pattern 8: Index re-exports
// index.ts - re-export main exports
export { UserService } from './user-service';
export { UserRepository } from './user-repository';
export type { User, UserRole } from './user';
```

### Naming Guidelines Table

| Category | Pattern | Example | Notes |
|----------|---------|---------|-------|
| Type files | kebab-case | `user.ts`, `api-types.ts` | Stores type definitions |
| Service files | kebab-case | `user-service.ts` | Classes/functions |
| Hook files | kebab-case | `use-user.ts` | React hooks start with `use-` |
| Component files | kebab-case | `user-card.tsx` | React components inside |
| Utility files | kebab-case | `string-utils.ts`, `date-utils.ts` | Helper functions |
| Test files | kebab-case + `.test` | `user.test.ts` | Match source file name |
| Type names | PascalCase | `User`, `UserProfile`, `UserId` | Never kebab-case |
| Function names | camelCase | `getUser()`, `createUser()` | Never kebab-case |
| Variable names | camelCase | `userName`, `userId` | Never kebab-case |
| Folders | kebab-case | `user-management/`, `api-clients/` | Lowercase folders |

---

## Auto-Fix Patterns

When reviewing code, fix patterns immediately:

| Pattern | Fix | Reason |
|---------|-----|--------|
| `interface IUser` | `interface User` | TypeScript convention, no I prefix |
| `type user` | `type User` | PascalCase for types |
| `import { User }` (types only) | `import type { User }` | Cleaner compilation |
| `UserService.ts` | `user-service.ts` | kebab-case files |
| `function<X>(items: X[])` | `function<T>(items: T[])` | Standard generic naming |
| Mixing `I`, `T_`, `_Private` | Use standard conventions | Consistency |

---

## Summary Table

```typescript
// ✅ CORRECT PATTERNS

// Files
user.ts
user-service.ts
user-repository.ts
use-user-profile.ts
string-utils.ts
user-constants.ts
user.test.ts

// Types
interface User { }
type UserId = string & { brand: 'UserId' };
type ApiResponse<T> = { }

// Functions/Variables
function getUser(id: number): User { }
const userName = 'John';

// Generics
function process<T>(items: T[]): T { }
type Record<K, V> = { [P in K]: V };

// Imports
import type { User } from './user';
import { UserService } from './user-service';
```

---

## References

- [TypeScript: Naming Conventions](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html#naming-conventions)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html#naming-style)
- [ESLint TypeScript Plugin - Naming](https://typescript-eslint.io/rules/)
- [kebab-case vs camelCase](https://en.wikipedia.org/wiki/Naming_convention_(programming))
