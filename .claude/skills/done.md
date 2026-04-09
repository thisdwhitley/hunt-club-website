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
If there are changes to commit, identify which pages/features were touched and give the user a targeted functionality checklist — not just lint commands. The goal is to confirm nothing visually or behaviorally broke, not just that the build passes.

**Always include:**
```
Before committing, please verify:
□ Dev server is running (podman command from /Users/daniel/GIT/hunt-club-website)
□ npm run lint        — no new errors introduced
□ npm run type-check  — no new errors introduced
□ npm run build       — builds cleanly (run if touching anything non-trivial)
```

**Plus a targeted UI checklist based on what changed this session.** For example:
- If hunt logging was touched → open the hunt log modal, submit a test entry, confirm it saves
- If camera page was touched → load /management/cameras, confirm cards render, filters work
- If navigation was touched → confirm nav renders, login/logout works, mobile menu opens
- If a form was touched → open the form, fill it out, submit it

List the specific pages and interactions to check based on the actual changes — not a generic "check the app."

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
