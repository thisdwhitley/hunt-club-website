---
description: Use at the start of a work session to establish a clear goal. Prompts for what "done" looks like and holds the session accountable to it.
---

# Session Start

## Step 1 — Check for pending plans

Check `~/.claude/plans/` for any approved implementation plans. If one exists, mention it briefly: "There's a pending plan for [topic] — want to continue that?"

## Step 2 — Pull open GitHub issues and recommend one

Use the GitHub MCP to list open issues on `thisdwhitley/hunt-club-website`. Review them and recommend the single best next thing to work on, based on:
- In-progress or blocked work that should be unblocked first
- Dependencies (e.g. schema work before UI work)
- Momentum (small completable items when energy is low)
- Impact (features that unlock other work)

Present it like:
> "Based on open issues, I'd suggest tackling **#NN — [title]** next because [one sentence reason]. Want to go with that, or is something else on your mind?"

## Step 3 — Confirm the session goal

Once the user picks a direction, confirm the goal in one sentence:
> "Got it — we're done when [specific outcome]. I'll flag if we drift."

If the goal is vague (e.g. "work on cameras"), push back once: "Can you be more specific? What exact outcome should be committed by the end?"

Do not begin any work until the goal is confirmed.

## During the session

Hold the confirmed goal in mind. If the conversation drifts, say: "This is drifting from our stated goal ([goal]). Should we finish that first, or are we intentionally switching?"
