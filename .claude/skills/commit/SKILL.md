---
name: commit
description: Commit changes (한글 커밋)
argument-hint: [message] [--amend]
disable-model-invocation: true
allowed-tools: Bash, Read, Grep
model: haiku
category: workflow
---

# Git Commit

변경사항을 한글 커밋 메시지로 커밋합니다.

## Triggers (사용 조건)

- "커밋해줘", "commit"
- "변경사항 저장"
- 코드 작업 완료 후

## Arguments

- `$ARGUMENTS`: 커밋 메시지
- `--amend`: 이전 커밋 수정

## Workflow

```
┌─────────────────────────────────────┐
│  1. git status & diff 확인          │
│  2. 변경사항 스테이징                 │
│  3. 커밋 생성                        │
│  4. 커밋 확인                        │
└─────────────────────────────────────┘
```

## 커밋 메시지 형식

```
{타입}({범위}): {한글 설명}

{본문 (선택)}

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types

| Type | 용도 |
|------|-----|
| feat | 새 기능 |
| fix | 버그 수정 |
| docs | 문서 변경 |
| refactor | 리팩토링 |
| chore | 설정, 빌드 등 |

## 예시

```bash
/commit feat(아이템): 태그 필터링 기능 추가
/commit fix(OCR): 금액 파싱 오류 수정
/commit docs: API 문서 업데이트
```

## 규칙

- **한글로 작성**
- 제목 50자 이내
- 원자적 커밋 (1 기능 = 1 커밋)
- 문서 변경은 관련 기능 커밋에 포함

## Related Skills

- `/lint`: 커밋 전 린트
- `/code-quality`: 품질 검사 후 커밋
