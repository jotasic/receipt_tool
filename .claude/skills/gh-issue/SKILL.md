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
Read issue → Parse briefing → Sync main → Create branch → Save context
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

## Step 2: Parse Briefing

Look for `🤖 Claude Code 작업 브리핑` comment.

Extract:
- `type` → feat / fix / refactor / docs / chore
- `priority` → P0 / P1 / P2
- `agent` → agent name
- `files` → affected files/modules
- `hints` → implementation hints
- `checklist` → completion criteria

**On failure (no briefing comment):**
```
⚠️  Warning: No briefing comment found. GitHub Action may still be running.
    Falling back to raw issue body for context.
    Quality of analysis may be lower.

Continue with raw issue? [Y/n]
```

If Y → parse issue title + body directly to fill fields above.

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

Branch name format: `<issue-number>-<kebab-slug-from-title>`

Examples:
- Issue #24 "Fix layout header overlap" → `24-fix-layout-header-overlap`
- Issue #15 "달력 탭 초기 로드 오류" → `15-fix-calendar-initial-load`

Rules:
- Max 50 characters total
- Lowercase kebab-case
- Non-ASCII characters → translate to English meaning

```bash
git checkout -b <branch-name>
```

**On failure:**
- Branch already exists →
  ```
  ⚠️  Branch 24-fix-layout already exists.
  Switch to existing branch? [Y/n]
  ```
  If Y → `git checkout 24-fix-layout`
  If N → abort

---

## Step 5: Save Context

Write `.claude/current-issue.json`:

```json
{
  "issue": 24,
  "title": "Fix layout header overlap",
  "branch": "24-fix-layout-header-overlap",
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

Branch:   24-fix-layout-header-overlap
Type:     fix  |  Priority: P1
Agent:    react-native-expo-developer
Files:    components/item/ItemCard.tsx

Next step: /gh-orchestrate
```

---

## Related Skills

- `/gh-orchestrate`: Execute implementation using saved context
- `/gh-pr`: Create PR after implementation is complete
