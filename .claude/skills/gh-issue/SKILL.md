---
name: gh-issue
description: Read GitHub issue, create work branch, and save context for gh-orchestrate
argument-hint: <issue-number>
allowed-tools: Bash, TodoWrite
model: sonnet
category: workflow
---

# GH Issue

Reads a GitHub issue and its Claude Code briefing, syncs main, creates a work branch, and saves context to `.claude/current-issue.json` for `/gh-orchestrate` to use.

## Execution Flow

```
Read issue → Parse or Analyze → Sync main → Create branch → Save context
```

---

## Step 1: Read Issue

```bash
gh issue view $ARGUMENTS --comments
```

**On failure:**
- Issue not found → abort: `Error: Issue #$ARGUMENTS not found.`
- gh not authenticated → abort: `Error: Run 'gh auth login' first.`

---

## Step 2: Parse Briefing or Analyze

### Case A: Briefing exists

Look for `🤖 Claude Code 작업 브리핑` comment (posted by @github-actions or @claude).

Extract:
- `type` → feat / fix / refactor / docs / chore
- `priority` → P0 / P1 / P2
- `agent` → agent name
- `files` → affected files/modules
- `hints` → implementation hints
- `checklist` → completion criteria

→ Proceed to Step 3.

### Case B: No briefing found

Analyze the issue title + body directly and:

1. Fill in all fields (type, priority, agent, files, hints, checklist)
2. Post analysis as a comment on the issue:

```bash
gh issue comment $ARGUMENTS --body "$(cat <<'EOF'
## 🤖 Claude Code 작업 브리핑

### 작업 유형
- **타입**: <feat/fix/refactor/docs/chore>
- **우선순위**: <P0/P1/P2>

### 요약
<1-2줄 핵심 내용>

### 영향 범위
- **에이전트**: <agent>
- **파일/모듈**: <files>

### 구현 힌트
- <hint>

### 완료 조건
- [ ] <condition>

### 주의사항
<dark mode, type safety, Korean UI, etc.>
EOF
)"
```

3. Use the analyzed content to proceed to Step 3.

---

## Step 3: Sync Main

```bash
git checkout main && git pull origin main
```

**On failure:**
- Uncommitted changes → abort: `Error: Uncommitted changes on current branch. Stash or commit first.`
- Network error → abort: `Error: Failed to pull from origin. Check network connection.`
- Merge conflict → abort: `Error: Merge conflict detected. Resolve manually.`

---

## Step 4: Create Branch

Branch name format based on `type`:

| Type | Format | Example |
|------|--------|---------|
| `fix` / `bug` | `fix/<issue-number>-<kebab-slug>` | `fix/24-layout-header-overlap` |
| `feat` | `feature/<issue-number>-<kebab-slug>` | `feature/15-calendar-initial-load` |
| `refactor` | `refactor/<issue-number>-<kebab-slug>` | `refactor/30-item-service` |
| `docs` | `docs/<issue-number>-<kebab-slug>` | `docs/8-update-readme` |
| `chore` | `chore/<issue-number>-<kebab-slug>` | `chore/5-update-deps` |

Rules:
- Max 60 characters total
- Lowercase kebab-case for the slug part
- Non-ASCII characters → translate to English meaning

```bash
git checkout -b <branch-name>
```

**On failure:**
- Branch already exists →
  ```
  ⚠️  Branch fix/24-layout already exists.
  Switch to existing branch? [Y/n]
  ```
  If Y → `git checkout fix/24-layout`
  If N → abort

---

## Step 5: Save Context

Write `.claude/current-issue.json`:

```json
{
  "issue": 24,
  "title": "Fix layout header overlap",
  "branch": "fix/24-layout-header-overlap",
  "type": "fix",
  "priority": "P1",
  "agent": "react-native-expo-developer",
  "files": ["components/item/ItemCard.tsx"],
  "hints": ["Check Header component props"],
  "checklist": ["Header no longer overlaps", "Dark mode verified"]
}
```

---

## Output

```
✅ Issue #24 context ready

Branch:   fix/24-layout-header-overlap
Type:     fix  |  Priority: P1
Agent:    react-native-expo-developer
Files:    components/item/ItemCard.tsx

Next step: /gh-orchestrate
```

---

## Related Skills

- `/gh-orchestrate`: Execute implementation using saved context
- `/gh-pr`: Create PR after implementation is complete
