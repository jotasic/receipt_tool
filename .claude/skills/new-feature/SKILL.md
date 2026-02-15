---
name: new-feature
description: Implement new feature
argument-hint: [feature description]
allowed-tools: Task, Bash, Read
model: haiku
category: development
---

# Implement New Feature

## ⚡ 즉시 실행

**작업 유형에 따라 적절한 에이전트 호출:**

### UI/화면/컴포넌트/서비스 로직:
```
Use the react-native-expo-developer agent to implement: $ARGUMENTS
```

### DB 스키마/쿼리/마이그레이션:
```
Use the database-specialist agent to implement: $ARGUMENTS
```

### 구조 설계 (분석만):
```
Use the architect agent to analyze: $ARGUMENTS
```

## 에이전트 완료 후

1. 타입 체크: `npx tsc --noEmit`
2. 문서 업데이트 필요 시: `doc-writer` 에이전트 호출
3. 코드 리뷰 필요 시: `code-reviewer` 에이전트 호출

## Related Skills

- `/plan`: 계획만 수립
- `/orchestrate`: 복잡한 기능 (멀티 에이전트)
- `/code-quality`: 품질 검사
