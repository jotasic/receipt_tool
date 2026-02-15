---
name: code-quality
description: Run code quality pipeline (lint, test, type-check, security)
argument-hint: [--fix]
allowed-tools: Bash, Read, Grep, Glob
---

# Code Quality Pipeline

Runs full code quality checks sequentially.

## Arguments

- `--fix`: Auto-fix fixable issues

## Pipeline Steps

```
┌─────────────────────────────────────────────────────┐
│  1. Type Check    → Check type errors               │
│  2. Lint          → Check code style                │
│  3. Test          → Run unit/integration tests      │
│  4. Security      → Scan security vulnerabilities   │
│  5. Build         → Verify build                    │
└─────────────────────────────────────────────────────┘
```

## Step 1: Type Check

```bash
# TypeScript
npx tsc --noEmit

# Python (mypy)
mypy .

# Go
go vet ./...
```

## Step 2: Lint

```bash
# JavaScript/TypeScript
npx eslint . $FIX_FLAG
npx prettier --check . $FIX_FLAG

# Python
ruff check . $FIX_FLAG
black --check . $FIX_FLAG

# Go
golangci-lint run $FIX_FLAG
```

## Step 3: Test

```bash
# with coverage
npm test -- --coverage
pytest --cov
go test -cover ./...
```

## Step 4: Security Scan

```bash
# Dependencies
npm audit
pip-audit
cargo audit

# Secrets
git secrets --scan
gitleaks detect
```

## Step 5: Build Verification

```bash
npm run build
python -m build
go build ./...
cargo build --release
```

## Output Summary

```
Code Quality Report
═══════════════════════════════════════
✓ Type Check    : PASSED
✓ Lint          : PASSED (3 warnings)
✓ Tests         : PASSED (42/42)
✓ Security      : PASSED (0 vulnerabilities)
✓ Build         : PASSED
═══════════════════════════════════════
Overall: PASSED
```
