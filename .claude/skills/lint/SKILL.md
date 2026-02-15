---
name: lint
description: Run code linting and formatting
argument-hint: [path] [--fix]
allowed-tools: Bash, Read, Grep, Glob
model: haiku
category: workflow
---

# Lint & Format

Checks code style and auto-fixes issues.

## Triggers

- "lint", "format"
- "check code style", "run eslint"
- Before commit to clean up code

## Arguments

- `$ARGUMENTS`: Target file/path
- `--fix`: Apply auto-fix

## Workflow

```
┌─────────────────────────────────────┐
│  1. Detect linter config            │
│  2. Run linter                      │
│  3. Run formatter                   │
│  4. Report issues                   │
└─────────────────────────────────────┘
```

## Lint Commands

| Tool | Check | Fix |
|------|-------|-----|
| ESLint | `npx eslint .` | `npx eslint . --fix` |
| Prettier | `npx prettier --check .` | `npx prettier --write .` |
| Ruff | `ruff check .` | `ruff check . --fix` |
| Black | `black --check .` | `black .` |
| golangci-lint | `golangci-lint run` | `golangci-lint run --fix` |

## Agent Integration

**For issues that cannot be auto-fixed:**
```
Use the refactorer agent to fix lint issues that cannot be auto-fixed
```

**For code quality improvements:**
```
Use the code-reviewer agent to review code quality beyond lint rules
```

## Output Format

```
Lint Results
═══════════════════════════════════════
Errors: 3
Warnings: 7
Auto-fixable: 8

Issues:
  src/App.tsx:15 [no-unused-vars] 'x' is unused
  src/utils.ts:23 [prefer-const] Use const

To auto-fix: /lint --fix
═══════════════════════════════════════
```

## Examples

```bash
/lint                  # Check all
/lint --fix            # Auto-fix
/lint src/components   # Specific path
```

## Related Skills

- `/build`: Build
- `/code-quality`: Full quality pipeline
- `/commit`: Commit (after lint)
