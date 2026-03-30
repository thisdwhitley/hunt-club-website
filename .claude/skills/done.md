---
description: Use at the end of a work session to clean up, capture decisions, and ensure nothing is left in a broken state.
---

# Session Done

Run through this checklist in order. Do not skip steps.

## Step 1 — Check git status
Run `git status` and review what is staged, unstaged, or untracked.

- If there are uncommitted changes: show them to the user and either commit them with a clear message, or explicitly confirm with the user that leaving them uncommitted is intentional.
- If there is nothing to commit: confirm that out loud.

## Step 2 — Verify before committing
If there are changes to commit, remind the user to verify them first:

```
Before committing, please verify:
□ Dev server is running (podman command from /Users/daniel/GIT/hunt-club-website)
□ Visually check the affected pages in the browser
□ npm run lint        — no new errors
□ npm run type-check  — no new errors
□ npm run build       — builds cleanly (run this if touching anything non-trivial)
```

Wait for the user to confirm verification is done before proceeding to commit.

## Step 3 — Commit and push to main
Once verified:
1. Commit with a clear message
2. Push to `origin/main`

Pushing main is always safe — it deploys to staging (Vercel preview), not the live site.

## Step 4 — Promote to production?
Ask the user: "Do you want to promote this to production (live site)?"

- If **yes**: run `git checkout production && git pull origin production && git merge main && git push origin production && git checkout main`
- If **no**: skip and note that staging has the latest changes

## Step 5 — Capture decisions in CLAUDE.md
Ask: "Were any new standards, patterns, or decisions made this session that should be recorded in CLAUDE.md?"

If yes — update CLAUDE.md immediately. A decision not written here does not exist for future sessions.

Guidelines for what belongs in CLAUDE.md:
- A new coding pattern or convention that should always be followed
- A decision about how something should work (e.g. "cameras default to active-only filter")
- A constraint or rule that was discovered (e.g. "podman must run from /Users path on macOS")

Do NOT add to CLAUDE.md:
- Temporary state or in-progress work
- Historical context about how we got here (that's git history)
- Anything already documented there

## Step 6 — Check for obsolete documentation
Look at the files in `docs/refactoring/`. Based on what was accomplished this session, identify any files that are now outdated or redundant and propose deleting them.

## Step 7 — Session summary
Summarize in 3–5 bullet points:
- What was the stated goal at the start?
- What was actually accomplished?
- What (if anything) is left unfinished and why?
- What is the recommended starting point for the next session?
