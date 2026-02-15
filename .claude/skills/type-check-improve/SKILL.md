---
name: type-check-improve
description: Improve TypeScript type checking
argument-hint: [path] [--strict]
allowed-tools: Bash, Read, Grep, Glob, Edit
model: haiku
category: development
---

# Type Check & Improve

## ⚡ 즉시 실행

```bash
npx tsc --noEmit
```

## 에러 발견 시

1. 에러 위치 확인
2. 타입 정의 수정 또는 추가
3. 재검사

## 옵션

- `--strict`: 엄격 모드로 검사
- `[path]`: 특정 파일/폴더만 검사

## 일반적인 수정 패턴

```typescript
// 1. 타입 단언
const value = data as string;

// 2. 옵셔널 체이닝
const name = user?.name;

// 3. 타입 가드
if (typeof value === 'string') { ... }

// 4. 인터페이스 확장
interface Item extends BaseItem { ... }
```

## Related Skills

- `/lint --fix`: 코드 스타일 자동 수정
- `/code-quality`: 전체 품질 검사
