# START HERE — Project Context Briefing

*Read this first. It's the current, compressed state of the project — not
the full history. For the complete feature backlog and research notes, see
`personal-automation-project-master-list.md`. For the earliest staged-MVP
draft (mostly superseded by this doc), see `personal-automation-project-plan.md`.*

## What this project actually is (current understanding)

A personal task manager and life-automation system, built because existing
apps (Shelpful, Brick, OpenClaw) each solve one piece well but not the whole
picture, and because the owner is a technical, RN-experienced developer who
wants full control and is genuinely interested in eventually sharing this
with others. It is **not** meant to be a general-purpose AI agent
(that's OpenClaw's job, kept fully separate) — it's a scoped, purpose-built
system: task list + reminders + NFC-triggered physical actions + optional
app/game lockdown with a reward economy + daily summaries, reachable via
chat and/or Shortcuts.

If anything below conflicts with something implied in the older plan doc,
**this doc and the master list are more current** — the early framing (e.g.
initial Shelpful-vs-Shortcuts comparisons) was exploratory and has since been
refined or superseded.

## Decided, not up for debate right now

- **Backend + DB: Convex.** Hosted, not dependent on any local machine
  staying awake. Owns all scheduling/state — this is the single most
  important architectural rule in this project (see "Why" below).
- **Mobile app: React Native + Expo**, hybrid with two small native Swift
  App Extension targets (App Intents, Screen Time API) added via the
  `expo-apple-targets` config plugin. Not a full Swift rewrite — see
  master list §2 for the reasoning if this gets questioned later.
- **Mac Mini:** required only as the iOS/Xcode build machine, plus running
  OpenClaw (separate, unrelated project). Not a phone-notification proxy —
  that's a common misconception to watch for; a Mac-run Shortcut executes
  only on the Mac, it does not reach the phone.
- **Dev machine:** MacBook Pro (where apps have previously been built/shipped
  from) — likely the actual place day-to-day coding happens, Mac Mini is
  for headless/background running + Xcode builds when needed.

## The one rule that resolves most future "should this be a Shortcut or
should this be server-side" questions

**iOS Personal Automations are unreliable for anything schedule-based or
background-network-dependent when the phone's been idle.** They're reliable
for hardware/event triggers (NFC tap, location, app-open, WiFi/Bluetooth).
So: Convex owns all scheduling and reminder logic; Shortcuts/NFC only owns
the physical trigger side. If a new feature idea seems to need Shortcuts to
"remember" or "check" something over time, it's misplaced — that logic
belongs in Convex, with Shortcuts/Pushcut/Telegram only as the delivery
mechanism.

## Current build stage

Not yet started writing code as of this doc. Planned first step (Stage 0,
see master list §5): Convex schema + a todos table + basic
query/mutation, no auth, no NFC, no Telegram yet — just prove state persists
and is reachable. Everything else in the master list is backlog, roughly in
the priority order listed there, not a commitment to build all of it.

## Explicitly out of scope for now (don't build unless asked)

Reward economy / Switch & Steam integration, accountability buddy, physical
lockbox hardware, daily summary aggregation, reading tracker, Shortcut
generation engine. All good ideas, all captured in the master list, none of
them blocking or required for Stage 0-2.
