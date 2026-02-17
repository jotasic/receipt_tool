---
name: plan
description: Create task plan for a feature without executing
argument-hint: <feature-description>
allowed-tools: Task
model: haiku
category: workflow
---

# Plan

## ⚡ Immediate Execution

**Call the PM agent to create a task plan:**

```
Use the pm-agent to create task board for: $ARGUMENTS
```

## After Planning

The PM agent will output:
- Task board with priorities (P0, P1, P2)
- Agent assignments for each task
- Dependency graph
- Execution order

## Next Steps

To execute the plan:
- **Automated**: `/orchestrate [feature]`
- **Manual**: `/workflow-guide [feature]`

## Related Skills

- `/orchestrate`: Auto-execute the plan
- `/new-feature`: Execute single feature manually
