# taskmaster

A personal task manager and life-automation system: task list, reminders,
NFC-triggered physical actions, optional app/game lockdown, and daily
summaries — reachable via chat and Apple Shortcuts.

The single architectural rule: **Convex owns all scheduling and state.**
Apple Shortcuts / NFC only own physical, hardware-level triggers the OS can
sense (NFC tap, location, app-open). See [`docs/START HERE.md`](docs/START%20HERE.md)
for the current project briefing and `docs/personal-automation-project-master-list.md`
for the full backlog.

## Stack

- **TypeScript** — end-to-end type safety
- **React Native + Expo** — mobile app (bare/custom-dev-client so native Swift
  App Extensions for App Intents + Screen Time can be added via `expo-apple-targets`)
- **Convex** — reactive backend-as-a-service: database, queries/mutations,
  cron jobs, scheduled functions, and HTTP actions (webhooks)
- **Better-Auth** — authentication (via `@convex-dev/better-auth`)
- **Biome** — linting and formatting
- **Turborepo** — monorepo task orchestration
- **Bun** — package manager / workspaces

Scaffolded with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack).

## Repository structure

```
taskmaster/
├── apps/
│   └── native/          # Expo mobile app (UI, chat, NFC reads)
├── packages/
│   ├── backend/         # Convex backend: schema, functions, auth, HTTP actions
│   │   └── convex/
│   ├── config/          # shared TypeScript config
│   └── env/             # typed environment variables
└── docs/                # project briefing + master backlog
```

## Getting started

Install dependencies:

```bash
bun install
```

Configure Convex (links this repo to the `taskmaster` Convex deployment):

```bash
bun run dev:setup
```

Copy env vars from `packages/backend/.env.local` into `apps/native/.env`, then
start the dev servers:

```bash
bun run dev
```

## Available scripts

- `bun run dev` — start all apps/backends in development mode
- `bun run dev:native` — start the Expo dev server only
- `bun run dev:server` — start the Convex backend only
- `bun run dev:setup` — configure/connect the Convex project
- `bun run build` — build all apps
- `bun run check-types` — TypeScript type-check across the monorepo
- `bun run check` — Biome format + lint (with `--write`)
