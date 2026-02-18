---
name: gh-orchestrate
description: Execute orchestrate flow using issue context file
allowed-tools: Task, TodoWrite, Bash
model: sonnet
category: workflow
---

# GH Orchestrate

Reads the current branch's issue context file (created by `/gh-issue`) and executes the same flow as `/orchestrate`.

## Pre-flight Check

Find the issue context file from the current branch name:

```bash
# Get current branch (e.g., fix/24-layout-header-overlap)
git branch --show-current

# Extract issue number from branch name (e.g., 24)
# Then load: .claude/issue-24.json
cat .claude/issue-<number>.json
```

If branch doesn't match `*/\d+-*` pattern, look for the most recently modified `issue-*.json`:

```bash
ls -t .claude/issue-*.json | head -1
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
