# Agent Assignment Guide

## Domain to Agent Mapping

| Domain | Agent | Example Tasks |
|--------|-------|---------------|
| UI/Screens/Components | `react-native-expo-developer` | Screens, forms, styles, navigation |
| Service Logic | `react-native-expo-developer` | OCR, backup, data processing |
| DB Schema/Queries | `database-specialist` | Table design, migrations, indexes |
| Architecture | `architect` | System design, structural decisions |
| Code Review | `code-reviewer` | PR review, quality checks |
| Documentation | `doc-writer` | Guides, README, API docs |
| Feature Analysis/Planning | `pm-agent` | Task decomposition, priorities, agent assignment |

## Selection Criteria

1. **Match domain expertise**
   - UI/Components/Service → react-native-expo-developer
   - DB Schema/Queries → database-specialist
2. **Consider complexity** - Simple → haiku, Complex → opus
3. **Check dependencies** - DB schema change needed? → database-specialist first
4. **Plan verification** - Important changes → include code-reviewer

## Common Combinations

| Task Type | Agent Combination |
|-----------|-------------------|
| New feature (with DB changes) | database-specialist → react-native-expo-developer |
| New feature (no DB changes) | react-native-expo-developer |
| DB schema only | database-specialist |
| Structural changes | architect → implementation agents |

## Anti-Patterns

- ❌ Assigning service logic to database-specialist
- ❌ Assigning DB schema work to react-native-expo-developer
- ❌ Skipping code-reviewer for important changes
- ❌ Using architect for simple implementations
