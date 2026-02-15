---
name: type-check-improve
description: Improve TypeScript type checking
argument-hint: [path] [--strict]
allowed-tools: Bash, Read, Grep, Glob, Edit
model: haiku
category: development
---

# Type Check & Improve

## Immediate Execution

```bash
npx tsc --noEmit
```

## On Error

1. Identify error location
2. Fix or add type definitions
3. Re-check

## Options

- `--strict`: Check in strict mode
- `[path]`: Check specific file/folder only

## Common Fix Patterns

```typescript
// 1. Type assertion
const value = data as string;

// 2. Optional chaining
const name = user?.name;

// 3. Type guard
if (typeof value === 'string') { ... }

// 4. Interface extension
interface Item extends BaseItem { ... }
```

## Related Skills

- `/lint --fix`: Auto-fix code style
- `/code-quality`: Full quality check
