---
name: orchestrate
description: Automatically orchestrate multiple specialized agents for complex features
argument-hint: <feature-description>
allowed-tools: Task, TodoWrite, Bash
model: sonnet
category: workflow
---

# Orchestrator

복잡한 기능을 위해 여러 에이전트를 자동 조율합니다.

## When to Use

- 여러 도메인에 걸친 기능 구현
- "자동 실행", "병렬 처리" 요청 시

**사용하지 않을 때:** 단일 도메인 작업 (직접 에이전트 호출)

## Execution Flow

```
계획 → 실행 (병렬) → 검증 → 리뷰
```

1. **Plan**: pm-agent로 태스크 보드 생성
2. **Execute**: 우선순위별 에이전트 실행 (최대 3개 병렬)
3. **Verify**: `/code-quality` 실행
4. **Review**: code-reviewer로 최종 리뷰

## 사용 가능한 에이전트

| 에이전트 | 용도 |
|---------|------|
| `pm-agent` | 분석/계획 |
| `react-native-expo-developer` | UI/화면/서비스 |
| `database-specialist` | DB 스키마/쿼리 |
| `architect` | 구조 설계 |
| `doc-writer` | 문서 |
| `code-reviewer` | 코드 리뷰 |

## Rules

- 최대 3개 에이전트 동시 실행
- 각 단계 후 검증
- 실패 시 최대 2회 재시도

## References

- [Execution Protocol](resources/execution-protocol.md)
- [Output Format](resources/output-format.md)

## Related Skills

- `/plan`: 계획만 수립
- `/new-feature`: 단일 기능 구현
- `/code-quality`: 품질 검사
