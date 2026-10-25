---
name: UET Arena operations
description: Existing UET identity applied to operations and practice workspaces
colors:
  primary: "#034ea1"
  ink: "#18344d"
  muted: "#536b80"
  line: "#d5e0ea"
  background: "#f5f8fb"
typography:
  headline:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 750
    lineHeight: 1.2
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "13px"
    lineHeight: 1.65
rounded:
  control: "6px"
---

# Design System: UET Arena operations

## Overview

Scope: `workspace.css`, reused by operations and practice. This records the actual
new surface without replacing the repository's incumbent global design files.
Flat data tables, clear state labels and measured charts support tournament staff.

## Colors

UET blue marks links and controls. Ink and muted text separate primary data from
explanations; light lines divide rows. Queue totals sit on a navy band. Unknown
readiness is amber, errors red, successful checks green with accompanying text.

## Typography

Be Vietnam Pro is inherited from the app font variable with a system fallback.
Tables and counters use tabular numerals. Headings reduce to 28px on small screens.

## Layout

The container stops at 1440px. Desktop charts use three columns, resource tables
two; below 650px they stack into one column. Content gutters reduce from 40 to
24 to 16px at the observed breakpoints. Long table values wrap.

## Elevation & Depth

Flat boundaries and tonal surfaces provide separation. No decorative elevation.

## Shapes

Controls use modest rounded corners; tables use simple horizontal separators.

## Components

Buttons have visible focus outlines and disabled states. SVG charts carry titles
and measurement labels. Replay mode is labelled separately from current status.
Unknown telemetry stays unconfirmed. Reduced-motion preference removes transitions.

## Do's and Don'ts

Preserve the distinction between received, queued, running and completed. Never
invent latency/resource observations. A recorded replay is not live load. This
source inventory is not a desktop/mobile visual approval; captures remain pending.
