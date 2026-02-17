---
name: gh-orchestrate
description: Execute orchestrate flow using current-issue.json context
allowed-tools: Task, TodoWrite, Bash
model: sonnet
category: workflow
---

# GH Orchestrate

Reads `.claude/current-issue.json` (created by `/gh-issue`) and executes the same flow as `/orchestrate`.

## Pre-flight Check

```bash
cat .claude/current-issue.json
```

**On failure:**
```
Error: No issue context found.
Run /gh-issue <number> first.
```

## Execution

Use the extracted context as the task description and follow:

→ `.claude/skills/orchestrate/SKILL.md`

The `agent`, `files`, and `checklist` fields from the JSON replace pm-agent's analysis step — execution begins immediately with the specified agent.

## Related Skills

- `/gh-issue`: Create context file
- `/gh-pr`: Create PR after completion
- `/orchestrate`: Argument-based version (no context file)
