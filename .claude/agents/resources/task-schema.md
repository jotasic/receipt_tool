# Task Schema

## Task Definition

```yaml
Task:
  id: "TASK-001"
  title: "Implement OCR result parsing"
  agent: react-native-expo-developer
  priority: P0  # P0=critical, P1=important, P2=nice-to-have
  dependencies: []  # List of task IDs this depends on
  acceptance_criteria:
    - "Extract amount/date from OCR results"
    - "Implement error handling"
    - "Define TypeScript types"
  estimated_complexity: medium  # low, medium, high
```

## Available Agents

| Agent | Scope |
|-------|-------|
| `react-native-expo-developer` | UI, service logic |
| `database-specialist` | DB schema, queries |
| `architect` | Structural design |
| `doc-writer` | Documentation |
| `code-reviewer` | Code review |

## Priority Levels

| Priority | Description | Example |
|----------|-------------|---------|
| P0 | Critical path, blocks others | DB schema, core services |
| P1 | Important, not blocking | Main features |
| P2 | Nice to have | Optimization, improvements |

## Complexity Estimation

| Level | Criteria |
|-------|----------|
| Low | Single file, <50 lines change |
| Medium | Multiple files, 50-200 lines |
| High | Architectural change, >200 lines |

## Dependency Rules

1. Tasks with no dependencies can run in parallel
2. P0 tasks typically have no dependencies
3. Minimize dependencies to maximize parallelization
4. Circular dependencies are not allowed
