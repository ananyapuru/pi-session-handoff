---
name: session-handoff
description: Review a completed Pi session for durable, high-value, non-brittle project learnings; present documentation candidates for approval, then document approved learnings and create a reviewable PR.
---

# Session Handoff

Use after a coding, debugging, or investigation session. This is deliberate handoff work, not automatic documentation.

## Candidate selection

Suggest a documentation item only when all apply:

1. **Non-obvious:** not discoverable from one local code path or existing docs.
2. **Stable:** likely true for months rather than only current PR or temporary state.
3. **High-value:** likely saves a future engineer 30+ minutes.

Prefer cross-file behavior, operational invariants, workflows, failure modes, ownership boundaries, and surprising constraints. Reject obvious facts, temporary state, variable/method names, and local implementation details.

Before editing, present candidates in this table, sorted by value descending then brittleness ascending:

| Learning | Why it matters | Documentation file | Source evidence | Value | Brittleness |
| --- | --- | --- | --- | --- | --- |

Verify every source path and line. Say `No durable documentation candidates found.` when nothing qualifies.

## Approved work

After explicit approval only:

- Update requested project documentation, keeping each item concise and scannable.
- Add a source provenance comment only when it captures a durable surprising constraint—not merely to restate code.
- Create a dedicated branch and PR. Include thumbs-up/thumbs-down review instructions.
- Do not mutate shell configuration or install lifecycle wrappers.

## Feedback learning

Use reviewer 👍/👎 or `keep`/`drop` feedback to improve future selections only when it establishes a specific reusable rule. Preserve existing guidance unless new evidence directly contradicts it. Do not turn one-off preferences into permanent rules.
