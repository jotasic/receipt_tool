---
name: new-feature
description: Implement new feature
argument-hint: [feature description]
allowed-tools: Task, Bash, Read
model: haiku
category: development
---

# Implement New Feature

## Immediate Execution

**Call the appropriate agent based on task type:**

### UI/Screens/Components/Service Logic:
```
Use the react-native-expo-developer agent to implement: $ARGUMENTS
```

### DB Schema/Queries/Migrations:
```
Use the database-specialist agent to implement: $ARGUMENTS
```

### Architecture Design (analysis only):
```
Use the architect agent to analyze: $ARGUMENTS
```

## After Agent Completion

1. Type check: `npx tsc --noEmit`
2. If docs need update: Call `doc-writer` agent
3. If code review needed: Call `code-reviewer` agent

## Related Skills

- `/plan`: Create plan only
- `/orchestrate`: Complex features (multi-agent)
- `/code-quality`: Quality check
