# Agent Assignment Guide

## Domain to Agent Mapping

| Domain | Agent | Example Tasks |
|--------|-------|---------------|
| UI/화면/컴포넌트 | `react-native-expo-developer` | 화면, 폼, 스타일, 네비게이션 |
| 데이터/서비스 | `database-specialist` | SQLite, 서비스 로직, 데이터 처리 |
| 아키텍처 | `architect` | 시스템 설계, 구조 결정 |
| 코드 리뷰 | `code-reviewer` | PR 리뷰, 품질 검토 |
| 문서 작업 | `doc-writer` | 가이드, README, API 문서 |
| 기능 분석/계획 | `pm-agent` | 태스크 분해, 우선순위, 에이전트 할당 |

## Selection Criteria

1. **Match domain expertise**
   - UI/컴포넌트 → react-native-expo-developer
   - DB/서비스 로직 → database-specialist
2. **Consider complexity** - Simple → haiku, Complex → opus
3. **Check dependencies** - DB + UI 변경? → 두 에이전트 조합
4. **Plan verification** - 중요 변경 → code-reviewer 포함

## Common Combinations

| 작업 유형 | 에이전트 조합 |
|----------|--------------|
| 새 기능 (풀스택) | database-specialist → react-native-expo-developer |
| UI만 변경 | react-native-expo-developer |
| DB/로직만 변경 | database-specialist |
| 구조 변경 | architect → 구현 에이전트 |

## Anti-Patterns

- ❌ 중요 변경에서 code-reviewer 생략
- ❌ 단순 구현에 architect 사용
- ❌ 하나의 태스크에 여러 에이전트 할당
