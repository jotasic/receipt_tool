# Documentation Guide

Principles and rules for maintaining project documentation.

## Core Principle: Documentation = Code State

```
Feature added   → Add to docs
Feature removed → Remove from docs
Feature changed → Update docs
```

**Never document unimplemented or planned features.**

## Documentation Structure

### Recommended Layout

```
/docs/
├── architecture.md          ← Summary + Index
├── architecture/
│   ├── data-models.md
│   ├── database.md
│   ├── folder-structure.md
│   └── tech-stack.md
│
├── services.md              ← Summary + Index
├── services/
│   ├── {service-name}.md
│   └── ...
│
└── guides/                  ← Usage guides
    ├── getting-started.md
    └── {topic}.md
```

### Structure Rules

| Document Type | Content |
|--------------|---------|
| Main doc (e.g., `architecture.md`) | Quick Reference + Links to details |
| Sub docs (e.g., `architecture/*.md`) | Detailed content by logical unit |
| Guides | Step-by-step instructions |

## Update Rules

### When to Update

| Change Type | Update Target |
|-------------|---------------|
| New service/component | architecture.md |
| New DB function | services.md |
| Complex feature | guides/{feature}.md |

### How to Update

- Include doc changes in the same commit as the feature
- Example: `feat: add push notifications` includes architecture.md update
- Do NOT create separate documentation commits

## File Naming

**Use kebab-case** (except README.md)

```
✅ architecture.md, services.md, migration-guide.md
✅ getting-started.md, item-service.md
❌ ARCHITECTURE.md, API.md, MIGRATION_GUIDE.md
```

## Modularization (From the Start)

**Principle: Modularize from the beginning, not later**

Why:
- Later splitting breaks links and history
- Initial structure makes adding content location obvious

### Guidelines

- Main docs: Quick Reference + link index
- Detailed content: Separate by logical unit in subfolders
- No character limit (organize by logical units)
- Include Quick Reference section for fast lookup

## Language

**Follow project's CLAUDE.md language settings.**

Typically:
- Documentation text: Project's primary language
- Code examples: English
- Variable/function names in examples: English

## References

When documenting, always check:
1. Project's `CLAUDE.md` for specific conventions
2. Existing documentation structure in `/docs/`
3. Recent commits for documentation patterns
