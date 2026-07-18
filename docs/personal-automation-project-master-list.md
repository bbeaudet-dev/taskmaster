# Personal Task Manager + Automation Ecosystem — Master Idea List

*A backlog of everything discussed, for future reference. Not a sprint plan —
just don't want to lose the good ideas. See also:
`personal-automation-project-plan.md` for the earlier staged-MVP writeup;
this doc supersedes/extends it with everything since.*

---

## 1. Core concept

A self-hosted, extensible personal accountability/task system, replacing the
need for Shelpful/Brick/a general agent for this specific use case — combining:
a real task manager, NFC-based physical triggers, app/game "lockdown" +
reward economy, daily life-context summaries, and a chat-based interface —
architected so Shortcuts/Automations are a first-class, intentionally designed
UI surface rather than a bolted-on integration.

**Guiding principle:** build the narrowest thing that tests one hypothesis at
a time; don't add a new integration until the current stage has been used for
real for a few days. Prone to overengineering — actively resist that.

---

## 2. Decided architecture

- **Backend + database: Convex.** Real-time queries, built-in cron jobs
  (`crons.interval`/`.daily`/etc.), scheduled one-off functions
  (`ctx.scheduler.runAfter`), and HTTP actions (webhooks) mean Convex can
  *be* the entire backend — hosted in the cloud, not dependent on the Mac
  Mini staying awake. Telegram bot can run in webhook mode pointed straight
  at a Convex HTTP action.
- **Mobile app: React Native + Expo** for the UI/chat/everything except two
  Apple-only, Swift-only frameworks:
  - **App Intents** (exposing actions like "Complete Task" to
    Shortcuts/Siri/Spotlight)
  - **Screen Time API** — `FamilyControls` (app picker), `ManagedSettings`
    (enforce block), `DeviceActivity` (scheduling) — for app-blocking/focus
    modes
  - Both implemented as separate **App Extension targets** (small standalone
    Swift binaries bundled in the same `.ipa`), invoked directly by the OS,
    talking straight to Convex — no JS/RN bridge involved, no "ejecting"
    required. Tooling: `expo-apple-targets` (`@bacons/apple-targets`) config
    plugin.
  - NFC reads inside the app itself (if ever needed, separate from
    Shortcuts-triggered NFC): `react-native-nfc-manager` (mature, official
    RN wrapper, no native Swift needed).
- **Mac Mini's real jobs:** (1) required iOS/Xcode build machine — non-negotiable,
  Xcode is macOS-only; (2) running OpenClaw, fully decoupled from this
  project; (3) optionally, Mac-side Shortcuts via the `shortcuts run` CLI
  (macOS-only, cron/launchd-triggerable, avoids all of iOS's locked-screen
  automation flakiness).
- **Shortcut generation:** `.shortcut` files are a reverse-engineered binary
  plist format; `shortcuts-js` / `shortcuts-toolkit` (npm/GitHub) let you
  define shortcuts in JS/TS and export real, importable `.shortcut` files —
  i.e., an app-side "shortcut generation engine" is genuinely buildable.
  Caveats: unofficial format (can break on iOS updates), and it's unconfirmed
  whether it can reference a third-party app's own custom App Intents vs.
  only built-in system actions — needs hands-on testing.

### Suggested repo structure
```
repo/
├── convex/              # schema, queries/mutations, HTTP actions (webhooks),
│                         # cron jobs, Telegram webhook handler
├── apps/
│   └── mobile/           # Expo (custom dev client) — UI, chat, NFC reads
│       └── modules/      # native Swift: AppIntents extension,
│                         #   Screen Time extension
├── shortcuts/            # shortcuts-js definitions + exported .shortcut files
└── docs/                 # this doc, setup notes
```

### Library shortlist
Convex · Expo + custom dev client · `expo-apple-targets` ·
`react-native-nfc-manager` · `expo-notifications` · `shortcuts-js`/
`shortcuts-toolkit` · Anthropic SDK (NLP parsing of free-text task input) ·
plain `fetch` for Steam/weather/news APIs.

---

## 3. Platform facts worth remembering (researched, not assumed)

- **Locked-phone reliability:** iOS Personal Automations are unreliable when
  the phone's been idle/locked for a while — confirmed via multiple Apple
  Community threads, including recent ones. Hardware/event-based triggers
  (NFC tap, arrive/leave location, WiFi/Bluetooth connect, app open, Focus
  change) fire reliably because something active woke the device anyway.
  Pure schedule-based triggers (Time of Day) and background network actions
  are the flaky ones. **Design rule: server (Convex) owns all scheduling and
  state; Shortcuts only owns physical/hardware events only the OS can sense.**
- **No "device unlocked" trigger exists** in Shortcuts — confirmed absent;
  there's an open Apple feedback thread requesting it.
- **Shortcuts (actions) sync via iCloud across your own devices. Personal
  Automations (triggers) do not** — device-specific, confirmed in Apple's
  own docs, and also not shareable to other people at all. Only the
  underlying Shortcut (action list) is shareable (iCloud link/AirDrop/file);
  recipients must manually recreate any automation trigger themselves. Common
  workaround: a Comment action at the top of the shared shortcut with setup
  instructions, or a short onboarding call (legitimate pattern — Superhuman
  and others do this).
- **No general API lets a third-party app CRUD a user's Shortcuts/Automations
  remotely.** App Intents let your app's actions appear as building blocks
  for the *user* to manually assemble in the Shortcuts editor — assembly is
  local and user-driven, not something your server can do on their behalf.
  Apple Intelligence assembling automations from natural language was shown
  at WWDC26 for a future iOS release — directional signal, not yet confirmed
  shipped/available; worth revisiting once released, since it would do a
  version of "chat → automation" natively for any app with good App Intents.
- **"Reverse push" (server → phone action) reality check (Pushcut):**
  three real tiers — (1) push notification + tap-an-action-button (low
  friction, works on any phone, free tier); (2) Pushcut's "Automation Server"
  mode for true zero-touch execution, but it needs a *dedicated* device
  actively running the Pushcut app (10–45s response window, ~60s shortcut
  runtime cap) — better suited to a spare device than your everyday phone;
  (3) building your own APNs-based equivalent — same complexity Pushcut
  already solved, not worth reinventing early.
- **macOS has its own Shortcuts app + CLI** (`shortcuts run "Name"`, since
  Monterey) — Mac-side automations avoid all of iOS's background/locked
  reliability problems entirely, since it's just a normal always-on computer.

---

## 4. Feature ideas backlog (by category)

### Core task manager
- SQLite/Convex-backed master task list; add/list/complete/edit via chat,
  manual UI, or Shortcuts.
- Free-text parsing via LLM ("need to buy tickets today" → task + due date)
  as an *optional* path alongside pure manual/structured entry (avoid
  over-relying on AI parsing where a simple button is faster).
- Priority, due date, recurrence fields (later stage).
- Daily/periodic summaries (tasks + calendar + email + weather + news +
  inspiration/motivation) delivered via chat, not just notifications.
- Task suggestions inferred from calendar/email content or untapped NFC tags
  (e.g., "brush teeth" tag not tapped by 10pm → nudge).

### NFC tags
- Dual purpose: **(a) access control** (paired with Foqos-style blocking)
  and **(b) task-manager triggers** (mark complete, log an event).
- Tag placement = the task location itself (sink → brush teeth) for true
  walk-by, no-stop tapping; disable "Ask Before Running" for near-instant
  response (near-instant on iPhone XS+ for background automations).
- Laptop NFC tag → bring up a quick-entry menu (new task / complete task /
  free-type-for-AI-parsing) as a "dead simple access point" to the system.
- "Currently reading" tracker: store title + format(s) (e.g. "Audible +
  Kindle"); tapping a nightstand tag opens the right app via URL scheme
  (`audible://`, `libbyapp://`); Kindle has no reliable deep-link-to-specific-
  book scheme, so it can only open the app generally, not jump to the title —
  known limitation, not a bug to chase.

### Reward / accountability economy
- Earn reward time (e.g., Switch minutes) for completing tasks/going to bed
  on time; spend it against a tracked balance.
- Lock certain apps (Instagram, etc.) until today's tasks are marked done —
  clean, since this reuses the Screen Time API block directly.
- Steam: detect "currently playing" via the official `GetPlayerSummaries`
  Web API (`gameextrainfo` field) — real and reliable. No API exists to
  *block* Steam; fallback is escalating nags (Telegram) while still detected
  in-game past the earned balance.
- Nintendo Switch: **no public API at all.** Best options are a WiFi smart
  plug on the dock (cuts TV-mode power based on earned balance — doesn't
  stop handheld/battery play) or crude network-presence/power-draw proxies.
  Reverse-engineered private-API approaches exist but are unofficial/fragile
  — avoid.
- Physical anti-tamper idea: pair the smart plug with an existing product
  category — **lockable cord/outlet cover boxes** (enclose plug + outlet,
  key or combo locked) — rather than inventing new hardware. A fully custom
  app-controlled locking latch is a real but separate hardware project for
  later, if ever.

### App-blocking / focus modes (Foqos-style)
- Built on Apple's `FamilyControls` + `ManagedSettings` + `DeviceActivity`
  frameworks (iOS 16+). Deliberately privacy-preserving: your code only ever
  gets opaque `ApplicationToken`s for whatever the user picked — you never
  learn which specific apps they are. Enforcement itself is basically free
  once you use these frameworks correctly.
- Foqos's actual "trick" isn't the blocking (Apple gives you that) — it's
  gating the *removal* of the block behind a physical NFC/QR tap, same
  friction principle as Brick. That's the part worth replicating
  deliberately, not the API integration itself.

### Accountability buddy
- Modeled loosely on Natural Cycles (asymmetric snapshot view for a partner)
  and Paired (mutual interactive features) rather than parental-monitoring
  apps.
- Use for spouse/friend/parent confirmation that a lockdown activity (e.g.
  "stopped playing games") is genuinely over — complements the imperfect
  Steam/Switch detection with a human check.
- Design note: keep it opt-in and mutual for adult relationships (the
  watched person explicitly invites the buddy, can revoke anytime) —
  parent-child monitoring is a more broadly accepted, different category and
  doesn't need the same mutual-invite framing.

### Interface / delivery layer
- Telegram bot: **one bot, many users**, distinguished by `chat_id` in the
  DB — not literally one bot per person. Doubles as a locked-phone-safe,
  reply-capable notification channel, arguably better than a native push for
  a lot of cases.
- Shortcuts "Menu" actions as an in-the-moment UI (show options right there,
  no notification/app-open friction) — good for the moment right after a
  physical trigger (NFC tap), not a substitute for reliable delivery, since
  it depends on the phone already being actively engaged.
- Phone-only automations (already exist, untouched by this project):
  brightness by time of day, auto-text spouse on arrival home.
- Home Automations tab (HomeKit-triggered, distinct from Personal
  Automations) — easy first win: Nanoleaf color/brightness tied to time of
  day/sunset; also supports presence, sensors, multi-accessory scenes.

---

## 5. Staged MVP plan (from earlier planning, still the recommended order)

1. SQLite/Convex + minimal HTTP endpoint (`GET/POST /todos`) — WiFi/local
   only, prove state persists.
2. Add Tailscale or (with Convex) just use its hosted URL — reachable from
   anywhere; optional bare web page for manual add/view.
3. Add edit/complete/delete; wire up Telegram bot; first NFC tag → Shortcuts
   → webhook integration.
4. Add priority/due date/recurrence; cron-based reminder nudges.
5. Later: calendar/email/weather/news integrations, Foqos-style blocking,
   reading tracker, Pushcut/App-Intent-based reverse triggers, reward
   economy, accountability buddy, possible own iOS App Store release.

---

## 6. Competitive/comparative research notes

- **Shelpful:** ADHD-focused accountability app; conversational "AI buddy"
  nudge loop; sells physical NFC "Smart Tags." Their documented Smart-Tag
  setup routes through Apple Shortcuts; the in-app "Auto" tab (location/NFC
  triggers) is likely native CoreNFC — unconfirmed with certainty, two
  possibly-different flows. Their Shortcuts bridge (Profile → Automations)
  is thin/early per their own reviews.
- **Brick ($59):** battery-free NFC puck + Screen Time API enforcement;
  genuinely replicable for <$1 with a blank NFC tag + free open-source
  **Foqos** (iOS) / **Switchly** (Android). Mainstream reviews
  (Consumer Reports, ABC/GMA, Slate) are positive on effectiveness; DIY/tech
  press criticism is about price-for-what-it-is, not efficacy. Couldn't
  substantiate "paid actors" claims — heavy influencer marketing is real and
  documented, fabricated reviewers is not.
- **OpenClaw:** general-purpose autonomous agent (shell + browser access,
  broad trust surface); genuinely popular because it handles the *long tail*
  of arbitrary unscoped tasks with no per-service integration work, ships
  messaging-native, and makes a great demo story. Not needed for this
  project's actual want-list (calendar/email/files/weather/news/Steam all
  have clean scoped APIs) — kept fully separate/decoupled.
- **Novelty assessment:** the individual features all exist somewhere
  separately; the more distinctive angle here is treating Shortcuts/
  Automations as an intentionally-designed UI layer (Menus, App Intents)
  built server-first to sidestep the reliability problems most consumer
  apps in this space just live with. Reasonable to build a working
  prototype before any cold outreach to Shelpful — stronger position either
  way (job conversation, partnership, or just a good personal project).

---

## 7. Open questions / follow-ups

- Whether Shelpful's in-app Auto NFC trigger is genuinely native CoreNFC —
  never confirmed from public docs.
- Whether `shortcuts-js`/`shortcuts-toolkit` can embed a reference to a
  third-party app's own custom App Intent inside a generated `.shortcut`
  file, or only built-in system actions — needs hands-on testing.
- Whether/when Apple ships natural-language automation assembly (teased at
  WWDC26) — would reduce need for a custom "AI edits your automation" layer.
- Shelpful's own MCP connector in Claude was still failing ("No approval
  received") despite showing green — may need a full revoke + re-authorize
  on Shelpful's side, never resolved during this conversation.
- No firm plan yet for verifying Switch "stopped playing" beyond
  network-presence/power-draw proxies or the accountability-buddy human
  check.
