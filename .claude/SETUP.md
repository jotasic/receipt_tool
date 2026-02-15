# .claude Setup Guide

Guide for setting up this `.claude/` configuration in a new project.

## Quick Start

1. Copy `.claude/` folder to your project root
2. Create `CLAUDE.md` in project root (see template below)
3. Create `/docs/` structure as needed

## CLAUDE.md Template

Create `CLAUDE.md` in your project root with these sections:

```markdown
# CLAUDE.md

## Project

[Brief project description]

## Documentation References

| Document | Content |
|----------|---------|
| [/docs/architecture.md](/docs/architecture.md) | Architecture, tech stack |
| [/docs/services.md](/docs/services.md) | Service reference |

## Development Environment

\`\`\`bash
# Development commands
npm start
npm test
\`\`\`

## Language Rules

| Target | Language | Notes |
|--------|----------|-------|
| Commit messages | [Korean/English] | Type in English (feat, fix) |
| Documentation | [Korean/English] | Code examples in English |
| UI messages | [Korean/English] | Errors, alerts, labels |
| Code comments | [Any] | Free choice |
| Variables/functions | English | camelCase |

## Agent Selection

| Task Type | Agent |
|-----------|-------|
| UI/Screens/Services | `react-native-expo-developer` |
| DB Schema/Queries | `database-specialist` |
| Documentation | `doc-writer` |
| Code Review | `code-reviewer` |
| Architecture | `architect` |

## Quality Criteria

- [ ] No TypeScript errors
- [ ] Error handling implemented
- [ ] Loading states handled
```

## Required Customization

### 1. Language Rules

Set your project's language conventions:

```markdown
## Language Rules

| Target | Language |
|--------|----------|
| Commit messages | English |
| Documentation | English |
| UI messages | English |
```

### 2. Agent Selection

Adjust agents based on your tech stack:

| Tech Stack | Primary Agent |
|------------|---------------|
| React Native / Expo | `react-native-expo-developer` |
| React / Next.js | `frontend-developer` |
| Node.js / Express | `backend-developer` |
| Python / FastAPI | `backend-developer` |

### 3. Development Commands

Update build/test commands for your project:

```markdown
## Development Environment

\`\`\`bash
# Your project's commands
npm run dev
npm run build
npm test
\`\`\`
```

## Documentation Structure

Create `/docs/` folder with this structure:

```
/docs/
├── architecture.md      ← Main architecture doc
├── architecture/        ← Detailed architecture docs
├── services.md          ← Main services doc
├── services/            ← Detailed service docs
└── guides/              ← Usage guides
```

## Available Agents

| Agent | Purpose |
|-------|---------|
| `react-native-expo-developer` | React Native UI, components, services |
| `database-specialist` | DB schema, queries, migrations |
| `architect` | System design (analysis only) |
| `doc-writer` | Documentation |
| `code-reviewer` | Code review |
| `pm-agent` | Task planning and decomposition |

## Available Skills

| Skill | Purpose |
|-------|---------|
| `/commit` | Commit with conventional format |
| `/lint` | Run linting and formatting |
| `/code-quality` | Full quality pipeline |
| `/new-feature` | Implement single feature |
| `/orchestrate` | Multi-agent feature implementation |
| `/plan` | Create task plan without executing |

## Customizing Agents

To modify agent behavior for your project:

1. Edit agent files in `.claude/agents/`
2. Update tech stack references
3. Adjust scope and responsibilities

## References

- [Agent Assignment Guide](agents/resources/agent-assignment-guide.md)
- [Task Schema](agents/resources/task-schema.md)
- [Documentation Guide](agents/resources/documentation-guide.md)
