---
name: UET Arena practice workspace
description: Student draft diagnostics and reference benchmarks within the established UET/VNU workspace
colors:
  primary: "#034ea1"
  ink: "#18344d"
  muted: "#536b80"
  line: "#d5e0ea"
  background: "#f5f8fb"
  control-surface: "#ffffff"
  control-border: "#a9bfd3"
  hover: "#e8f0f8"
  focus: "#4381bc"
  error-surface: "#fff0ec"
  error-ink: "#913421"
  message-surface: "#e7f3ee"
  message-ink: "#245e45"
typography:
  headline:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "19px"
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "13px"
    lineHeight: 1.65
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "12px"
  source:
    fontFamily: "monospace"
    fontSize: "12px"
    lineHeight: 1.7
rounded:
  control: "6px"
spacing:
  action-gap: "8px"
  field-gap: "8px"
  section: "30px"
  columns: "30px"
components:
  button:
    backgroundColor: "{colors.control-surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    padding: "10px 13px"
  button-hover:
    backgroundColor: "{colors.hover}"
  source-editor:
    backgroundColor: "{colors.control-surface}"
    textColor: "{colors.ink}"
    padding: "14px"
---

# Design System: UET Arena practice workspace

## Overview

**Creative North Star: "The UET/VNU working desk"**

This scoped inventory inherits the established blue and navy world from
`../operations/DESIGN.md`. It documents `workspace.tsx` and the shared
`../operations/workspace.css`; it does not replace global design authority.
Vietnamese task labels, a plain source editor, and flat result tables keep the
student's next action clear.

**Key Characteristics:**
- UET blue controls and navy text.
- Flat task sections and compact numeric tables.
- Explicit separation between draft diagnostics, unrated benchmarks, and Elo.
- Results identify measured data, missing data, and infrastructure failures.

This is a source inventory, not visual approval. Finish disposition: **recapture**.
Existing captures show an older green tournament surface; fresh desktop and mobile
captures of this practice workspace remain required for visual review.

## Colors

Primary UET blue identifies navigation and actions. Navy ink anchors headings and
data; muted blue-gray supports explanations. Pale background and fine divider
lines separate tasks without decorative cards. White controls gain a pale blue
hover surface. The current student's Elo row uses that same blue tint.

Error and successful-request notices use distinct text and surface pairs, always
with explanatory copy. Successful queue admission must not imply a successful
validation result.

## Typography

Be Vietnam Pro is inherited through the app font variable with a system fallback.
The headline reduces to (28px) on small screens. Body copy is limited to (80ch)
where appropriate, with compact (11px) supporting notes. Data cells use tabular
numerals; Python source uses the monospace role. Preserve Vietnamese accents and
legible status phrases rather than relying on color alone.

## Layout

The centered workspace caps at (1440px). Horizontal gutters step from (40px) to
(24px) at (1000px), then (16px) at (650px). The practice area uses two equal,
shrinkable columns with the documented column gap: source and reference setup on
the left, Elo and self-check results on the right. Below (650px), these stack in
source order. Benchmark reports occupy the full width below both columns.

Actions wrap within their row. Select fields fill their available width. The
header stacks and its navigation wraps on small screens. The source editor fills
its column with a minimum height of (280px). Tables use horizontal row separators;
long values must remain readable at narrow widths. Result disclosures permit
overflow. These are layout intentions grounded in source, not a claim that the
rendered responsive surface has passed review.

## Elevation & Depth

Flat boundaries and tonal surfaces establish grouping. No decorative elevation or
shadows are introduced for this extension. Disclosure, focus, disabled states,
and written status provide interaction feedback.

## Shapes

Buttons and selects use modest control corners. The editor is a plain bordered
rectangle. Result groups and tables rely on dividers rather than nested rounded
containers.

## Components

### Source and actions

The labeled file input accepts Python; the editable textarea exposes
`choose_move(state)`. Source is UTF-8 with a (64 KiB) limit. Draft self-check uses
the grading WASI path and returns its own asynchronous result. The separate Elo
submission action activates a valid version without resetting rating. Loading a
reference copies its code into the editable draft.

Buttons use the shared outlined treatment and show sending text during requests.
Action controls disable while a request is pending. Focus uses an offset (3px)
outline; disabled buttons use reduced opacity and a non-actionable cursor.
Reduced-motion preference removes transitions.

### Reference benchmark setup

The reference selector offers Starter Config, Heuristic Hunter, Sprinter,
Guardian, and Tactician, with the chosen bot's description beside the task flow.
Pair counts range from one to five; each pair means two games with the same seed
and swapped sides. Benchmarking operates on the draft and is unrated. Show the
applicable limits and worker-priority explanation beside its actions.

**The Independent Results Rule.** Self-check and benchmark must never silently
submit a bot to Elo or the official competition.

### Self-check results

Compact divider rows identify the source hash, queued/running/completed state,
and validation outcome when available. Explain E01–E06 categories and that basic
checks do not guarantee validity in every game. Infrastructure failure is a
retryable execution problem, distinct from a bot that fails validation.

### Benchmark report

Native disclosure summaries show reference opponent, source hash, completed and
expected games, and draft-perspective wins/draws/losses. Expanded reports show
measured-game averages, a JSON report download, and per-game side/seed, status or
result, wall time, completed-move mean/maximum time, and an HTML replay download.
Replay becomes available when a game result exists. Missing measurements have
explicit text rather than fabricated zeroes.

**The Timing Context Rule.** Timing includes startup and WASI communication,
depends on the machine and load, and does not decide wins. Move statistics cover
completed calls and exclude failed or timed-out calls.

### Elo and navigation

Elo version history, ranking, and recent games remain independent of draft tools.
The ranking marks the current student in text as well as with a tinted row.
Navigation links return to competition and the editor/reference area. Empty
states explain the relevant next action without claiming a completed result.

## Do's and Don'ts

- **Do** preserve UET/VNU identity, blue controls, flat dividers, and the responsive task grid.
- **Do** label pending, completed, validation, and infrastructure states in text.
- **Do** retain timing context and explicit missing-measurement labels.
- **Do** obtain fresh practice captures before visual sign-off.
- **Don't** merge self-check, benchmark, Elo, or official competition outcomes.
- **Don't** present queue admission as a validation pass or replay as live execution.
- **Don't** promote inherited CSS defects or older green screenshots into this scoped design contract.
