# Task Schema

## Task Definition

```yaml
Task:
  id: "TASK-001"
  title: "OCR 결과 파싱 기능 구현"
  agent: react-native-expo-developer
  priority: P0  # P0=critical, P1=important, P2=nice-to-have
  dependencies: []  # List of task IDs this depends on
  acceptance_criteria:
    - "OCR 결과에서 금액/날짜 추출"
    - "에러 핸들링 구현"
    - "TypeScript 타입 정의"
  estimated_complexity: medium  # low, medium, high
```

## Available Agents

| Agent | 담당 영역 |
|-------|----------|
| `react-native-expo-developer` | UI, 서비스 로직 |
| `database-specialist` | DB 스키마, 쿼리 |
| `architect` | 구조 설계 |
| `doc-writer` | 문서 |
| `code-reviewer` | 코드 리뷰 |

## Priority Levels

| Priority | Description | Example |
|----------|-------------|---------|
| P0 | Critical path, blocks others | DB 스키마, 핵심 서비스 |
| P1 | Important, not blocking | 주요 기능 |
| P2 | Nice to have | 최적화, 개선 |

## Complexity Estimation

| Level | Criteria |
|-------|----------|
| Low | Single file, <50 lines change |
| Medium | Multiple files, 50-200 lines |
| High | Architectural change, >200 lines |

## Dependency Rules

1. Tasks with no dependencies can run in parallel
2. P0 tasks typically have no dependencies
3. Minimize dependencies to maximize parallelization
4. Circular dependencies are not allowed
