---
name: UET Arena tournament control desk
description: Incumbent UET identity with a code-first student competition workbench.
colors:
  university-blue: "#034ea1"
  navigation-navy: "#102b4d"
  ink: "#172c44"
  cool-paper: "#f5f7fa"
  white: "#ffffff"
  divider: "#d6dfe9"
  muted: "#52657b"
  field-stroke: "#b8c8da"
  trial-surface: "#edf3fa"
  information-surface: "#e8eff7"
  success-surface: "#e9f3ee"
  success-ink: "#245e45"
  error-surface: "#fff0ec"
  error-ink: "#913421"
typography:
  headline:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "clamp(26px, 3vw, 38px)"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-.025em"
  title:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "22px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-.025em"
  body:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "14px"
    lineHeight: 1.65
  label:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "13px"
    fontWeight: 550
    lineHeight: 1.65
  code:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "13px"
    lineHeight: 1.65
rounded:
  field: "7px"
  control: "8px"
  event: "12px"
spacing:
  inline: "8px"
  actions: "12px"
  feedback: "16px"
  mobile-gutter: "18px"
  workbench-gap: "32px"
components:
  button-primary:
    backgroundColor: "{colors.university-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "9px 13px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 13px"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
  result:
    backgroundColor: "{colors.trial-surface}"
    rounded: "{rounded.control}"
    padding: "16px"
---

# Design System: UET Arena tournament control desk

## Overview

**Creative North Star: "The University Competition Desk"**

UET Arena preserves the incumbent solid-color tournament workspace: university-blue actions, a navy navigation rail, cool light surfaces, crisp dividers and Vietnamese-first copy. Be Vietnam Pro carries the interface; JetBrains Mono carries Python and technical evidence. This palette supersedes the earlier ivory/lime action direction; green and coral retain board-side and verdict meanings. No new visual identity or generated artwork is introduced.

The student competition surface brings writing, basic checks, a two-game benchmark and official submission into one task. Code remains the working material; adjacent feedback explains what happened and how to continue. Operations, standings and account management retain divided rows. This record describes current source, not successful runtime validation or official university service status.

The sourced icon remains `public/brand/uet.ico`, with provenance in `public/brand/SOURCE.md`. Role-dashboard and account-entry refinements remain scoped in `app/student/DESIGN.md`; competition tokens above do not replace their close local values. Local fonts and the original game engine remain incumbent constraints.

**Key Characteristics:**

- University blue actions and navy navigation within the existing UET world.
- Code and feedback share one workspace; official submission remains explicit.
- Flat rows, textual states and contextual next actions.
- Version-specific evidence and replay close to the student's work.

## Colors

Blue directs action while neutral surfaces support prolonged coding and review.

### Primary

- **University Blue:** primary actions, active navigation, focus outlines, progress and contextual links.
- **Navigation Navy:** competition rail and inherited institutional identity.

### Neutral

- **Ink / Muted:** main content versus descriptions, limits, timestamps and supporting metadata.
- **Cool Paper / White:** page canvas versus fields and neutral controls.
- **Divider / Field Stroke:** quiet row separators versus stronger control boundaries.
- **Trial Surface / Information Surface:** feedback and notices with explanatory text.

Success uses pale green with dark green text; errors use pale warm fill with dark warm text. Board sides retain inherited green and coral pieces. These semantic roles do not establish additional action palettes.

**The Action and State Rule.** Use blue for actions and selection; attach verdict colors to explicit status text so color never carries the result alone.

## Typography

**Interface Font:** Be Vietnam Pro, with sans-serif fallback.
**Code Font:** JetBrains Mono, with monospace fallback.

Competition page headings use the headline role; workbench section headings use the title role and subheadings use a smaller size (16px). Feedback and history use compact supporting text (12–13px). Ordinary paragraphs are bounded at 78ch; workbench explanations at 70ch. Metadata stays subordinate to instructions.

The editor uses the code role with four-space tabs, preserved whitespace and local overflow. Diagnostics use wrapping monospace (12px, line-height 1.7), preventing long errors from widening the layout. Mobile workbench headings contract (20px) and editor text contracts (12px). Hashes and runtime details remain evidence rather than display typography.

**The Evidence Hierarchy Rule.** Put a plain-language result and next action before hashes, raw verdict text and runtime metadata.

## Layout

The desktop competition rail is fixed (236px); main content offsets by its width. Content is bounded (1390px), with padding (42px vertically, 38px horizontally). At 1100px the rail narrows (205px), padding contracts and standings/replay stack. At 700px the rail enters page flow and navigation becomes one horizontal scroll row. Tables retain their own horizontal scroll containers.

The workbench begins with a three-step path, team/rule context and a direct jump to personal results. That jump scrolls with a button rather than replacing the selected event's URL fragment. Its compact event header keeps deadline and lifecycle visible; extended rules and global judging progress are omitted from that submission header. The workspace pairs an editor (1.1fr) with feedback (0.9fr, minimum 340px), separated by the workbench gap. At 1150px both this pair and the two history columns stack. At 700px the editor minimum height contracts (330px to 270px), submission becomes full width and result rows wrap.

History follows the working area, split between submitted versions and own-team games. Selected replay appears inline below history. Editor and feedback remain page sections without nested card layers.

The inherited public entry remains a solid-navy stage (1280px maximum) with an introduction/board pair and a three-part participation sequence. Its headline scales (40–72px, line-height 1.15), board is bounded (445px), spacing contracts at 950px and the introduction/workflow stack at 650px. The role dashboard retains its own responsive shell as documented in `app/student/DESIGN.md`.

## Elevation & Depth

Depth comes from solid tonal fills, thin borders and spacing. Competition uses no shadows or gradients. Feedback panels are modest filled regions within the page; navigation and the coordinate board provide the strongest blocks of contrast.

**The Divided Surface Rule.** Separate editor tools, official submission, history and games through spacing and thin rules, preserving the flat page structure.

## Shapes

Controls and result panels use restrained corners; fields are slightly tighter, while event containers are softer. History and games remain flat divided rows. Replay is a square 9×9 coordinate board. The university icon retains its white circular backing and original source artwork.

## Components

### Buttons / Fields

Official primary actions use blue fill and white text. The opponent selector, checking action and two-game benchmark action sit immediately beneath the editor and its metadata, before official submission and disclosures. This order keeps trial controls close to code when the feedback column moves below it on mobile. Trial controls are neutral; their labels distinguish trial from submission. Neutral controls use a visible border, semibold labels and a minimum height (42px). Disabled controls use half opacity and native disabled behavior. Hover darkens primary blue or adds a pale blue fill. Keyboard focus uses an offset blue outline (3px, offset 3px).

Labels remain above fields. Python can be typed, opened from `.py` or downloaded. The editor shows size against its limit (65,536 bytes), draft-saving state and short hash when available. Source and diagnostics scroll locally. API guidance, sample downloads and optional GitHub commit submission remain native disclosures.

### Navigation / Entry

Competition navigation names the combined destination **Code & chạy thử** and keeps **Lịch đấu & replay** separate. Open events show **Tham gia ngay**; sign-in preserves the selected event and submission destination. Invitation-only enrollment remains a separate code form. Joined students can reopen the workbench from overview or role-dashboard rows. Query chooses the view and fragment chooses the event; neither grants permissions.

### Student feedback

Three grouped buttons switch **Kiểm tra lỗi**, **Đấu bot mẫu** and **Bài đã nộp**. Selection uses a blue bottom rule and pale fill. Trial feedback matches the current source hash, with source/run identity as fallback; benchmarks also match the selected opponent. Editing stops presenting an earlier run as evidence about changed code.

Basic checking states queued/running/result conditions and explains that it is not a full match. Benchmark requests two side-swapped games, reports completion and win/draw/loss counts, and gives each game's finish reason, supplied runtime message and replay action. Trial limits remain visible and may differ from event rules; practice does not update Elo or official standings.

Current check diagnostics use preformatted, wrapping monospace. Collapsed native disclosures retain up to six recent checks with source hash, time, state and preformatted verdict, and up to five recent benchmarks with source hash, opponent, time and outcome counts. Completed games from those earlier benchmarks remain replayable without presenting their results as a check of the current draft.

Official feedback distinguishes receipt, queue, validity and judge failure. Validity means a basic check, not a completed win/loss result. Queue position is not an estimated completion time. Error codes pair raw verdict text with repair hints for syntax, entry function/initialization, legal moves, time, forbidden capabilities and resource/output limits. Infrastructure failure is distinct from an invalid bot. The panel identifies a draft differing from the submitted version, the latest valid version and any locked version. Status uses live announcements; errors use alerts. Failed polling offers a reconnect action.

**The Version Evidence Rule.** Keep draft, trial results, submitted versions and locked tournament versions distinct in labels and feedback; never let an older result stand in for edited code.

### Drafts / History

Draft storage is scoped to the browser tab, keyed by user and event. Without a saved draft, the workbench requests the latest submitted source; loading failure offers file-based continuation. Storage failure asks the student to download code. Submitted versions remain immutable while **Mở code này để sửa** requests source for an editable draft. This is an own-source restoration path; opponent-source browsing is not part of the interface.

Version history uses native disclosure with time, hash, textual verdict and locked/latest-valid markers. The adjacent own-team list reports up to 20 recent games with opponent, outcome, reason and supplied runtime message. Empty states explain whether BTC has started judging and point back to trial when appropriate.

### Replay

Shared inline replay preserves the engine's coordinates, side-specific pieces and goals. Previous/next, play/pause, a move slider and current/total count provide inspection. A plain-language finish reason and available runtime message accompany winner and engine/runtime evidence. Separate P1/P2 source hashes identify the versions that played, displayed as twelve-character prefixes when supplied. JSON and offline HTML downloads remain available. Playback advances every 300ms. Opening a student replay scrolls it into view; scrolling respects reduced-motion preference.

### Incumbent event and role surfaces

Creation remains a direct blank-form destination with name, participation mode, deadline, groups and qualifiers. **Tạo & mở giải** opens an event; draft save remains secondary. Advanced JSON stays disclosed. New forms default to direct enrollment; older configurations without entry mode retain invitation policy. Invitation controls and lifecycle actions remain contextual; frozen configuration stays non-editable outside draft/open states.

Authorized organizers and self-service demo hosts receive creation and hosted-event actions; demo hosting grants no global administration. Outside that demo mode, authenticated root entry directs a student with one membership to its submission view. `/student` remains available for account/team management, while practice and legacy rooms stay separate.

The public introduction retains registration, practice and **Tham gia giải** links; demo creation preserves its destination through sign-in. `/welcome` remains the shareable public entry while authenticated root uses the role dashboard. The board illustration remains a labeled deterministic Greedy × Random sample with twelve moves, not a live result. Mailpit guidance appears only in local-mail mode; configured real delivery remains separate. No new official participation, event dates or results are invented.

## Do's and Don'ts

The student workbench now leads with **Nộp & đấu thử** and the **Tiến độ** view. The view uses flat stages for server receipt, validation and two side-swapped games, followed by the actual score and replay actions. Before the first attempt, a working primary action explains the prefilled starter code; no mandatory tour is added. Manual checking, benchmarking and **Chỉ nộp vào giải** remain secondary paths. Source-linked trial metadata survives reload; trial outcomes remain explicitly separate from official standings. `/demo` preserves the destination through sign-in and redirects to the configured event without silently enrolling or granting roles.

Tournament management extends the existing flat interface with native **Xoá giải đấu** disclosure and an explicit **Xoá giải này** action, using existing error ink. The tournament list places a scoped **Thùng rác** disclosure above event rows; each deleted event has **Khôi phục giải**. The copy names reversible hiding, stopped judging and preserved records. Restored judging stays paused until the organizer resumes. The direct-entry demo flag changes participation affordances, never organizer permissions or frozen rules; students see **Tham gia ngay**, including legacy invite configurations during this presentation policy.

### Do:

- **Do** preserve UET blue actions, navy navigation, Vietnamese typography and solid fills.
- **Do** keep writing, checking, benchmark feedback and official submission close within the student task.
- **Do** give every verdict a textual meaning and useful next action.
- **Do** match results to current source and identify submitted and locked versions explicitly.
- **Do** keep tournament rows flat and wide content locally scrollable.
- **Do** preserve the sourced university icon and course-project context.

### Don't:

- **Don't** imply that a check or benchmark submits a bot or updates official standings.
- **Don't** call a valid submission a completed tournament result.
- **Don't** turn drafts into cross-account or cross-event shared state.
- **Don't** add gradients, decorative shadows or nested cards to the flat competition workspace.
- **Don't** present a labeled sample, demo-host role or course identity as official university operation.

Not canonized: inherited tiny board-coordinate and institutional qualifier text, and the step-path arrow glyph, are implementation details rather than typography or icon standards for new surfaces. No test, deployment or visual-acceptance result is asserted here.
