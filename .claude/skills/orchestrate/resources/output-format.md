# Output Format

## Completion Summary

```
Orchestration Complete
═══════════════════════════════════════

Feature: [feature name]
Status: ✅ SUCCESS / ⚠️ PARTIAL / ❌ FAILED

Tasks Completed: X/Y
├─ ✅ T-001: [task] (react-native-expo-developer)
├─ ✅ T-002: [task] (database-specialist)
└─ ❌ T-003: [task] (doc-writer) - [reason]

Verification:
├─ Build: ✅ PASS
├─ Lint: ✅ PASS
├─ Type Check: ✅ PASS
└─ Tests: ✅ PASS

Next Steps:
- [any remaining work]
- [recommended follow-up]
═══════════════════════════════════════
```

## Status Definitions

| Status | Meaning |
|--------|---------|
| ✅ SUCCESS | All tasks completed, all verifications passed |
| ⚠️ PARTIAL | Some tasks completed, others blocked/failed |
| ❌ FAILED | Critical tasks failed, feature not functional |

## Progress Updates

During execution:
```
[Phase 2/5] Executing...
├─ ✅ T-001 complete
├─ 🔄 T-002 in progress (react-native-expo-developer)
├─ 🔄 T-003 in progress (database-specialist)
└─ ⏳ T-004 pending
```
