# taskmaster — Agent Context

> Curated, stable project overview for AI agents. 
> Keep this file high-level and current — volatile feature detail lives in
> `docs/`, not here.

## What this is

A personal task manager + life-automation system for one primary user (the
repo owner), designed so it could eventually be shared with others. It
combines: a real task list + reminders, NFC-triggered actions and flows,
"access restriction" modes using Screen Time API (Foqos as an example), and other potential systems such as a reward economy, accountability buddy access (similar to Natural Cycles app), daily summaries, and more.
It is **not** a general-purpose AI agent (that is OpenClaw's role, kept fully separate) — it is scoped and purpose-built.

## Why it exists (motivation)

- Existing tools each solve one slice — Shelpful (accountability nudges),
  Brick/Foqos (app blocking), OpenClaw (general agent) — but none cover the
  whole picture in one owned, extensible system.
- The owner is a technical fullstack developer who wants full control and
  data ownership rather than stitching together several subscriptions.
- Core need: shrink the gap between *intending* to do something and *doing*
  it, using low-friction physical triggers (tap a tag at the point of action)
  plus reliable server-side reminders — with focus/lockdown modes to
  protect attention.

## Core objectives

1. One master task list (add / list / complete / edit) via chat, manual UI, and/or Shortcuts.
2. Reliable reminders and nudges owned by the server, not the phone.
3. Physical triggers: NFC tags placed at the location of the task itself, or to trigger different action sequences (e.g. a "wind-down" flow at night).
4. Optional app/game lockdown + reward economy (later stage).
5. Daily context summaries — tasks, calendar, weather, etc. (later stage).

## The one architectural rule (most important)

**Convex owns ALL scheduling and state.** Apple Shortcuts / NFC own ONLY
physical, hardware-level triggers the OS can sense (NFC tap, location,
app-open, Focus change). iOS Personal Automations are unreliable for
schedule-based or background-network work once the phone has been idle — so if
a feature seems to need Shortcuts to "remember" or "check" something over
time, that logic belongs in Convex. Shortcuts / Telegram / Pushcut are only
delivery-and-trigger surfaces, never the source of truth.

## Major design elements

- **Apple Shortcuts & Automations** as a first-class, intentionally-designed UI
  surface (not a bolted-on integration) — a primary design interest.
- **Apple Screen Time API** (`FamilyControls` / `ManagedSettings` /
  `DeviceActivity`) for app-blocking/focus, via a native Swift App Extension.
- **App Intents** (expose actions to Siri / Shortcuts / Spotlight), via a
  native Swift App Extension.
- **NFC tags / physical components** as low-friction triggers and access control.
- **Chat interface** (e.g. Telegram, later) and optional LLM parsing of
  free-text task input.

## Tech stack

Bun monorepo orchestrated with Turborepo + Biome. Expo React Native app
(`apps/native`), with native Swift App Extensions to be added later via the
`expo-apple-targets` config plugin. Convex backend + Better-Auth
(`packages/backend/convex`). See `README.md` for scripts and full structure.

## Dev environment / hardware

- **MacBook Pro (M1)** — primary dev machine; all IDE work happens here. Also
  where the owner plays Steam games.
- **Mac Mini** — headless helper: the iOS/Xcode build machine (Xcode is
  macOS-only) and runs OpenClaw (a separate project). It is **not** a
  phone-notification proxy — a Mac-run Shortcut executes only on the Mac.
- **iPhone 14 Pro** — primary target device (iOS 16+; supports near-instant
  background NFC automations).
- **Gaming targets** for reward/lockdown features: Steam (on the Mac),
  Nintendo Switch, and phone.

## Reference apps (shared vocabulary)

- **Shelpful** — ADHD-focused accountability app; conversational nudges + physical NFC "Smart Tags."
- **Brick** — ~$59 NFC puck + Screen Time enforcement; cheaply replicable.
- **Foqos** — free open-source iOS app-blocker gated behind an NFC/QR tap.
- **OpenClaw** — general-purpose autonomous agent; kept fully separate/decoupled from this project.
- **Pushcut** — server→phone push + automation runner; reference point for "reverse push" tradeoffs.

## Scope of this doc

This file is the stable, curated overview — keep it current and do not let it
accumulate volatile detail. An unstructured idea braindump lives in `docs/`,
and superseded planning notes in `docs/archive/`; treat both as loose
background, not as current specs or commitments. Convex coding conventions are
supplied by the enabled Convex plugin.
