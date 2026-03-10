<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React_(Ink)-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
</p>

<h1 align="center">
  <br>
  <code>tikitaki</code>
  <br>
  <sub><sup>Track work time without leaving your terminal</sup></sub>
</h1>

<p align="center">
  An interactive CLI timer with a REPL-like interface for tracking work time, with Jira and Clockify sync built in.
  <br>
  Type slash commands while a live timer ticks above. No browser, no context switch, no friction.
</p>

<br>

```
  TEST-123 - Implement auth flow
  1h 23m 45s
  [RUNNING] TEST-123
  > /pause
```

---

## Features

|                     |                                                                             |
| ------------------- | --------------------------------------------------------------------------- |
| **Live Timer**      | Real-time elapsed counter with pause/resume and accurate pause-gap tracking |
| **Slash Commands**  | REPL-style interface -- type commands while the timer runs                  |
| **History**         | View entries by today, week, month, or specific date with daily hour totals |
| **Manual Log**      | Forgot to start the timer? Log entries after the fact                       |
| **Jira Sync**       | Push worklogs to Jira via REST API with ADF-formatted comments              |
| **Clockify Sync**   | Push time entries to Clockify with project mapping                          |
| **Sync Check**      | Compare local entries against remote worklogs to spot discrepancies         |
| **Auto-Sync**       | Optionally sync on every `/stop`                                            |
| **Daily Alerts**    | Days below your minimum hours target are highlighted in red                 |
| **Command History** | Press up/down arrow keys to recall previous commands                        |

---

## Quick Start

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev
```

Once running, type `/help` to see all commands.

---

## Commands

```
/start <ticket> <description>     Start a timer
/pause                             Pause the current timer
/resume                            Resume a paused timer
/stop                              Stop and save the current timer
/stop:discard                      Stop and discard (don't save)

/history                           Show today's entries
/history:week                      Show this week's entries
/history:month                     Show this month's entries
/history <YYYY-MM-DD>              Show entries for a specific date

/log                               Manually log a time entry
/sync                              Sync unsynced entries to integrations
/sync:check                        Compare local vs remote entries
/sync:check --full                 Full table of all local/remote entries

/settings                          Open settings menu
/settings:integrations             Configure Jira / Clockify

/help                              Show help
/quit                              Exit
```

## Integrations

### Jira

Configure via `/settings:integrations` > Jira. Requires:

- **Base URL** -- e.g. `https://yourorg.atlassian.net`
- **Email** -- your Atlassian account email
- **API Token** -- generate at [id.atlassian.net/manage-profile/security/api-tokens](https://id.atlassian.net/manage-profile/security/api-tokens)

Worklogs are posted to `POST /rest/api/3/issue/{ticket}/worklog` with Basic auth.

### Clockify

Configure via `/settings:integrations` > Clockify. Requires:

- **API Key** -- from [app.clockify.me/user/preferences#advanced](https://app.clockify.me/user/preferences#advanced)
- **Workspace ID** -- from your workspace settings

Project mappings link your ticket prefixes (e.g. `TEST`) to Clockify project IDs.

---

## Data Storage

All data lives in `~/.cli-timer/`:

| File            | Contents                                                             |
| --------------- | -------------------------------------------------------------------- |
| `history.json`  | All time entries with ticket, duration, pause intervals, sync status |
| `settings.json` | Integration credentials, auto-sync toggle, minimum daily hours       |

---

## Project Structure

```
src/
  index.tsx                  # Entry point: render(<App />)
  types/index.ts             # Shared TypeScript types
  storage/
    paths.ts                 # ~/.cli-timer/ directory management
    settings.ts              # Settings read/write
    history.ts               # History read/write/query
  commands/
    parser.ts                # Slash command parser
    start.ts                 # /start
    pause.ts                 # /pause
    resume.ts                # /resume
    stop.ts                  # /stop, /stop:discard + elapsed calc
    history.ts               # /history variants
    log.ts                   # /log (manual entry)
    sync.ts                  # /sync
    syncCheck.ts             # /sync:check
    settings.ts              # /settings:integrations
    help.ts                  # /help text
  integrations/
    jira.ts                  # Jira worklog API
    clockify.ts              # Clockify time entry API
    types.ts                 # Integration-specific types
  components/
    App.tsx                  # Root: state machine + command dispatch
    CommandInput.tsx          # Text input with prompt
    TimerDisplay.tsx          # Live-updating elapsed counter
    StatusBar.tsx             # Mode indicator
    HistoryTable.tsx          # Formatted history with daily totals
    HelpView.tsx              # Help text display
    SettingsPrompts.tsx       # Multi-step integration config
    LogEntryPrompts.tsx       # Multi-step manual log
    SyncReport.tsx            # Sync results display
  utils/
    formatDuration.ts        # Seconds to "1h 23m 45s"
    formatDate.ts            # Date display helpers
    dateFilters.ts           # Week/month/date range filters
```

---

## Development

```bash
npm run dev          # Start with tsx (hot reload)
npm run build        # Compile TypeScript
npm run lint         # ESLint
npm test             # Vitest (63 tests)
```
