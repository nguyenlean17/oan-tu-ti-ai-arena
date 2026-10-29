---
name: UET Arena role workspace
description: Scoped visual system for the shipped organizer and student dashboards and account entry flows.
colors:
  university-blue: "#034ea1"
  navigation-navy: "#102b4d"
  ink: "#19344d"
  muted: "#536b80"
  cool-paper: "#f6f8fb"
  white: "#ffffff"
  divider: "#d9e2ec"
  field-stroke: "#a9bfd3"
  active-navigation: "#214770"
  information-surface: "#e8eff7"
  success-surface: "#e9f3ee"
  success-ink: "#245e45"
  error-surface: "#fff0ec"
  error-ink: "#913421"
typography:
  headline:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "34px"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-.025em"
  title:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: "-.015em"
  body:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: "5px"
  navigation: "6px"
  auth-control: "7px"
spacing:
  field-gap: "8px"
  form-gap: "16px"
  compact-section: "20px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.university-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.university-blue}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  dashboard-primary:
    backgroundColor: "{colors.university-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "11px 17px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  navigation-active:
    backgroundColor: "{colors.active-navigation}"
    textColor: "{colors.white}"
    rounded: "{rounded.navigation}"
    padding: "13px 12px"
  information-panel:
    backgroundColor: "{colors.information-surface}"
    padding: "20px"
---

# Design System: UET Arena role workspace

## Overview

**Creative North Star: "The University Competition Desk"**

This is a scoped record of the role dashboard shared by the authenticated root entry and `/student`, and the related sign-in, registration, email confirmation and password recovery screens. It extends the current UET identity; it does not replace the root design system or prescribe changes to practice, the board engine or tournament operations.

The workspace is a quiet administrative surface for Vietnamese students and organizers. A navy rail carries navigation, while cool light content uses a role-specific heading, a direct primary action and divided tournament rows. Organizers create or manage tournaments; students enter their team's submission workspace or join with a private invitation. Account entry screens carry the same identity through a navy introduction beside a focused form.

The unmodified university icon is served from `public/brand/uet.ico`, with provenance in `public/brand/SOURCE.md`. Its use accompanies the course-project identity; it does not establish official university service status or VNU SSO.

**Key Characteristics:**

- University blue actions, navy navigation and cool light surfaces.
- Vietnamese interface text in Be Vietnam Pro, with locally served font files.
- Flat sections and real data rows, with text accompanying state.
- Direct tournament creation, submission and selection actions, with account and team tools close by.

## Colors

University blue directs action; navy anchors the shell. Neutral surfaces keep account and team information legible.

### Primary

- **University Blue:** links, primary buttons, tournament actions and expandable actions.
- **Navigation Navy:** the student rail and main heading; also the account-entry introduction.

### Neutral

- **Ink / Muted:** primary content and quieter explanatory text.
- **Cool Paper / White:** the content canvas, top bar and fields.
- **Divider / Field Stroke:** section and table separators versus more visible control boundaries.
- **Active Navigation:** the filled navigation state, paired with white text.
- **Information Surface:** local-mail guidance and newly issued invitation tokens.

Success uses a green tonal surface and darker green text; errors use a warm pale surface and darker warm text. These are feedback roles, not additional action colors. Standalone authentication has its own close neutral values in `docker/auth.css`; do not treat those minor differences as new global palette primitives.

**The Action and State Rule.** Keep blue for actions and navigation; keep success and error colors attached to explicit feedback text.

## Typography

**Headline and Body Font:** Be Vietnam Pro, with sans-serif fallback. The student page and standalone account flows explicitly load `/fonts/be-vietnam-pro.css`; local regular, semibold and bold faces are available.

The scale favors short Vietnamese headings above readable administrative content. There is no special display face in this surface.

### Hierarchy

- **Headline:** main student heading; contracts to 29px at the first student breakpoint and 28px on mobile.
- **Title:** ordinary section headings and organizer event-row titles; empty-state titles use 20px.
- **Body:** explanatory paragraphs with a maximum line length of 75ch.
- **Label:** form labels, navigation and table content. Table headers and secondary event text use 12px.
- **Account entry:** form headings use 28px; the desktop introduction heading uses 36px. The form remains the primary task on mobile.

Do not promote footer text, institutional qualifiers or table metadata into a display role.

## Layout

The desktop role workspace is a two-column grid with a sticky, independently scrollable navigation rail (250px) and fluid main content. The rail spans the dynamic viewport height. The main content is bounded (1120px maximum), centered and padded (46px vertically, 42px horizontally). The top bar keeps institution and current account visible. The dashboard heading shares a row with its primary action; shortcuts wrap beneath it, followed by flat event rows with wrapping action groups.

At 950px and below, the rail narrows (210px), main padding contracts (32px by 25px), account sections become a single column, and the dashboard action moves beneath its heading. At 650px and below, the shell becomes a block flow: the rail is no longer sticky, navigation forms two columns, footer links wrap, and main padding becomes 28px by 20px. Inline forms stack and event rows tighten their vertical padding. Tables retain a minimum width (480px) inside their own horizontal scroll container.

Ordinary forms use a grid with the recorded form gap; labels separate their text and input by the field gap. The desktop inline form pairs one flexible field with its submit button and is bounded (680px). Profile and password sections use two columns until the first breakpoint.

Standalone authentication uses two equal columns inside a bounded page (1450px). The form is limited to 410px. At 850px spacing contracts; at 620px the introduction is hidden and the form occupies one column. The later introduction rule changes alignment only and does not restore it on small screens. The compact authentication header uses a 12px gap, a single-line inline-flex brand (20px text, 34px icon, 8px internal gap), and a non-wrapping return link; the secondary VNU badge is hidden.

**The Local Overflow Rule.** Keep wide membership and account rows scrollable within their table container while the surrounding page remains fluid.

## Elevation & Depth

The student workspace uses no shadows. Solid navy, a white top bar, pale information and feedback fills, and fine dividers establish hierarchy. Forms and tables remain part of the page rather than floating cards. The authentication introduction is a solid navy panel, also without shadow.

**The Divided Surface Rule.** Separate related account, team and event content with spacing and thin rules; preserve the flat page structure.

## Shapes

Controls have restrained corners: inputs, form buttons and dashboard action links use the control radius, navigation uses its slightly softer radius, and standalone auth controls use the auth-control radius. The university icon is presented on a white circular backing without redrawing its source artwork.

The authentication introduction has larger corners (16px). That is a specific entry-screen panel, not the standard shape for student sections.

## Components

### Buttons

Primary student form actions use blue fill, white text and semibold weight. Secondary form actions use a white fill, blue text and a field-colored border. Both have a minimum height (40px). Disabled controls use half opacity and a waiting cursor. Student buttons inherit the application's short state transitions; they do not add a separate hover animation.

Dashboard action links use a minimum height (44px), compact padding and the same restrained radius. A blue primary action leads organizer tournament creation and student submission; secondary actions use white fill and a field-colored border. Hover uses a pale blue secondary fill or a darker primary fill. This local state treatment does not establish a new global color ramp.

Keyboard focus is an offset blue outline (3px, with 3px offset) within the student surface. Standalone authentication uses a blue outline with 4px offset and darkens its primary button on hover and press (150ms background transition).

### Inputs / Fields

Student inputs and selects share white fill, a field-colored stroke, inherited font and compact padding. Labels stay visible above fields. Account password inputs use the correct current/new-password autocomplete roles; invitation token input disables autocomplete.

Standalone account fields use a slightly softer radius and a minimum input height (46px). Confirmation and reset remain explicit form submissions rather than automatic actions on link open.

### Navigation

The rail uses icon-and-label buttons with the active view exposed through `aria-current="page"`. Hover and active states share the darker blue fill and white text. Dashboard, team and account navigation stay visible in flow on mobile. Organizer account management appears only for an administrator.

Use SVG icons for arrows, checks and navigation. Do not substitute text glyphs for those controls.

### Role dashboard / Tournament rows

The organizer heading pairs “Điều hành giải đấu” with “Tạo giải đấu,” linking to the blank tournament form. Shortcuts expose account/team management, operations and the tournament dashboard. Each real tournament row shows its name, textual lifecycle status and dashboard/management links. An empty list offers creation without fabricated event data.

The student heading leads to practice, while each membership row identifies the team and tournament and offers submission, tournament dashboard, and schedule/replay links. A student without membership gets a private-code join action and a tournament-list link. Email verification is contextual guidance when required, rather than a numbered onboarding sequence. The root sends students with one membership straight to the selected tournament submission view; `/student` remains available for account and team management.

**The Role and Destination Rule.** Make the next authorized tournament task visible from real role and membership data; query parameters choose a view and never confer permissions.

### Sections / Tables

Team membership, open events and administrator account records use flat rows with dividers. Table headers remain quieter than cell content. Long emails wrap within cells. Empty states explain the next real action rather than displaying fabricated teams or events.

### Feedback / Information

Success and error messages use their semantic fills, with `role="status"` and `role="alert"` respectively. The Mailpit notice and newly issued token panel use the information fill. The local-mail notice explicitly identifies the local inbox and states that no external email is sent.

### Progressive disclosure

Team rename and administrator lock/unlock confirmation use native details/summary disclosure. The latter reveals an explanatory line and an explicit confirmation button. Locked tournament rosters replace rename controls with status text. Password recovery remains a visible link from account security.

## Do's and Don'ts

### Do:

- **Do** preserve blue actions, navy navigation and flat divided sections in this scoped surface.
- **Do** keep account, verification and membership status readable as text.
- **Do** retain local font loading for standalone account screens and the student page.
- **Do** show the next action supported by actual verification, membership and tournament state.
- **Do** keep creation prominent for organizers and submission/dashboard links explicit for students.
- **Do** preserve the local Mailpit notice when that demo mode is active.
- **Do** retain the sourced icon and its documented course-project context.

### Don't:

- **Don't** add decorative shadows or gradients to this flat student workspace.
- **Don't** turn team and account rows into nested dashboard cards.
- **Don't** expose organizer controls as student actions or imply the frontend grants organizer rights.
- **Don't** represent local Mailpit delivery as external email delivery or VNU SSO.
- **Don't** replace the sourced university icon with a fabricated university seal.
