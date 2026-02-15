---
name: commit
description: Commit changes with conventional commit format
argument-hint: [message] [--amend]
disable-model-invocation: true
allowed-tools: Bash, Read, Grep
model: haiku
category: workflow
---

# Git Commit

Commits changes with conventional commit messages.

## Triggers

- "commit", "save changes"
- After completing code work

## Arguments

- `$ARGUMENTS`: Commit message
- `--amend`: Amend previous commit

## Workflow

```
┌─────────────────────────────────────┐
│  1. Check git status & diff         │
│  2. Stage changes                   │
│  3. Create commit                   │
│  4. Verify commit                   │
└─────────────────────────────────────┘
```

## Commit Message Format

```
{type}({scope}): {description}

{body (optional)}

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types

| Type | Purpose |
|------|---------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation |
| refactor | Refactoring |
| chore | Config, build, etc. |

## Examples

```bash
/commit feat(item): add tag filtering feature
/commit fix(OCR): fix amount parsing error
/commit docs: update API documentation
```

## Rules

- Keep title under 50 characters
- Atomic commits (1 feature = 1 commit)
- Include related doc changes in feature commit

## Related Skills

- `/lint`: Lint before commit
- `/code-quality`: Quality check before commit
