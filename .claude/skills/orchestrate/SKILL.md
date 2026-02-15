---
name: orchestrate
description: Automatically orchestrate multiple specialized agents for complex features
argument-hint: <feature-description>
allowed-tools: Task, TodoWrite, Bash
model: sonnet
category: workflow
---

# Orchestrator

Automatically coordinates multiple agents for complex features.

## When to Use

- Features spanning multiple domains
- Requests for "auto-execute" or "parallel processing"

**Do NOT use for:** Single-domain tasks (call agents directly)

## Execution Flow

```
Plan → Execute (parallel) → Verify → Review
```

1. **Plan**: Create task board with pm-agent
2. **Execute**: Run agents by priority (max 3 parallel)
3. **Verify**: Run `/code-quality`
4. **Review**: Final review with code-reviewer

## Available Agents

| Agent | Purpose |
|-------|---------|
| `pm-agent` | Analysis/Planning |
| `react-native-expo-developer` | UI/Screens/Services |
| `database-specialist` | DB Schema/Queries |
| `architect` | Architecture Design |
| `doc-writer` | Documentation |
| `code-reviewer` | Code Review |

## Rules

- Max 3 concurrent agents
- Verify after each phase
- Max 2 retries on failure

## References

- [Execution Protocol](resources/execution-protocol.md)
- [Output Format](resources/output-format.md)

## Related Skills

- `/plan`: Create plan only
- `/new-feature`: Single feature implementation
- `/code-quality`: Quality check
