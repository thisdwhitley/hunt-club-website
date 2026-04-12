---
description: Use at the start of a work session to establish a clear goal. Prompts for what "done" looks like and holds the session accountable to it.
---

# Session Start

**Before saying anything to the user, complete Steps 1 and 2 in order. Do not ask the user a question until both steps are done.**

## Step 1 — Check for pending plans (do this first, no exceptions)

Use the Glob tool to list files in `~/.claude/plans/`. Read any `.md` files there. If a pending plan exists, note it — you'll surface it in your opening message.

## Step 2 — Pull open GitHub issues (do this second, before responding)

Call `mcp__github__list_issues` on `thisdwhitley/hunt-club-website` with `state: OPEN`. Review the results. Identify the 2–3 best candidates to work on next, based on:
- In-progress or blocked work that should be unblocked first
- Real bugs over enhancements
- Dependencies (schema work before UI work)
- Impact (features that unlock other work)

## Step 3 — Open with context, then ask

Only after Steps 1 and 2 are complete, send a single opening message that:

1. Mentions any pending plan (if found): "There's a pending plan for [topic] — want to continue that?"
2. Lists 2–3 recommended issues with a one-sentence reason each
3. Ends with: **"What does done look like for this session?"**

Example format:
> There's a pending plan for **[topic]** — want to pick that back up?
>
> Based on open issues, here are the best candidates:
> - **#NN — [title]**: [one sentence reason]
> - **#NN — [title]**: [one sentence reason]
>
> My top pick is **#NN** because [reason]. What does done look like for this session?

## Step 4 — Confirm the session goal

Once the user picks a direction, confirm in one sentence:
> "Got it — we're done when [specific outcome]. I'll flag if we drift."

If the goal is vague (e.g. "work on cameras"), push back once: "Can you be more specific? What exact outcome should be committed by the end?"

Do not begin any work until the goal is confirmed.

## During the session

Hold the confirmed goal in mind. If the conversation drifts, say: "This is drifting from our stated goal ([goal]). Should we finish that first, or are we intentionally switching?"
