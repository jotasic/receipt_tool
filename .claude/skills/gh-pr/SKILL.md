---
name: gh-pr
description: Create a pull request from the current branch to main
allowed-tools: Bash
model: haiku
category: workflow
---

# GH PR

Creates a pull request from the current branch targeting `main`.
Uses `.claude/current-issue.json` for PR title and body if available.

## Execution Flow

```
Check branch → Load context → Create PR
```

---

## Step 1: Check Current Branch

```bash
git branch --show-current
```

**On failure:**
- On `main` → abort: `Error: Cannot create PR from main branch. Switch to a work branch first.`
- No commits ahead of main → abort: `Error: No commits to PR. Make changes and commit first.`

---

## Step 2: Load Context (optional)

```bash
cat .claude/current-issue.json
```

If found → use `type`, `title`, `issue` for PR title and body.
If not found → derive title from branch name, leave body minimal.

---

## Step 3: Create PR

```bash
gh pr create \
  --base main \
  --head <current-branch> \
  --title "<type>(<scope>): <title>" \
  --body "$(cat <<'EOF'
## Summary
<summary from briefing or branch name>

## Changes
<files from context or inferred>

## Checklist
<checklist items from context>

---
Resolves #<issue number from current-issue.json>
EOF
)"
```

**Note:** If `current-issue.json` has an `issue` field, always append `Closes #<issue>` at the bottom of the body. This auto-closes the linked issue when the PR is merged.

**On failure:**
- PR already exists for this branch → output existing PR URL: `PR already open: <url>`
- Not pushed → abort: `Error: Branch not pushed. Run 'git push -u origin <branch>' first.`
- gh not authenticated → abort: `Error: Run 'gh auth login' first.`

---

## Output

```
✅ PR created: https://github.com/<owner>/<repo>/pull/42

Title:  fix(ItemCard): fix layout header overlap
Base:   main ← 24-fix-layout-header-overlap
```

---

## Related Skills

- `/gh-issue`: Create context and branch
- `/gh-orchestrate`: Execute implementation
- `/commit`: Commit changes before PR
