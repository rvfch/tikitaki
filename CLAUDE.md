# CLI Timer

Interactive CLI timer for tracking work time with Jira/Clockify sync.

## Commands

```bash
npm run dev          # Start app (tsx src/index.tsx)
npm run build        # TypeScript compile (tsc)
npm run lint         # ESLint (eslint src/)
npm test             # Vitest tests
```

## Architecture

- **Ink (React for CLI)** renders a REPL-like terminal UI with live-updating timer
- **State machine** in `src/components/App.tsx` manages app modes: idle, timer-running, timer-paused, showing-history, prompting-settings, prompting-log, syncing, showing-help
- **Slash commands** parsed by `src/commands/parser.ts` -- format: `/command:subcommand args`
- **Data stored** as JSON in `~/.cli-timer/` (history.json, settings.json)

## Key Types (src/types/index.ts)

- `TimeEntry` -- saved entry with id, ticket, description, project, startTime, endTime, duration, pauses[], synced status
- `ActiveTimer` -- in-memory running timer with ticket, startTime, pauses[], currentPauseStart
- `Settings` -- autoSync, minimumDailyHours, integrations (jira/clockify configs)
- `AppMode` -- union type for state machine modes
- `ParsedCommand` -- { command, subcommand, args }

## Module Layout

- `src/commands/` -- Pure logic for each command (start, pause, resume, stop, history, log, remove, sync, syncCheck, syncPull, settings, help). Each returns a result object.
- `src/components/` -- React/Ink UI components. App.tsx is the root with state machine + command dispatch.
- `src/storage/` -- File I/O for history.json and settings.json in ~/.cli-timer/
- `src/integrations/` -- Jira REST API (Basic auth, ADF comments) and Clockify API (X-Api-Key header)
- `src/utils/` -- formatDuration (seconds -> "1h 23m 45s"), formatTimer (HH:MM:SS), parseDurationInput, formatDate helpers, dateFilters (today/week/month/date + groupByDate)

## Timer Logic

Elapsed time = (now - startTime) - sum(pause durations). Pause durations include both completed pauses (pausedAt/resumedAt pairs) and current active pause. Implementation in `src/commands/stop.ts:calculateElapsed()`.

## Testing

11 test files, 70 tests in `src/__tests__/`. Tests use `vi.mock()` for storage paths (temp dirs) and `vi.stubGlobal("fetch")` for integration tests. All command/util/storage/integration logic is tested. UI components are not tested.

## Conventions

- TypeScript strict mode, ESM modules (`"type": "module"`)
- `.js` extensions in imports (required for NodeNext module resolution)
- Prettier for formatting
- ESLint 9 flat config with typescript-eslint and react-hooks plugin
- Commands return result objects `{ success, message, ...data }` -- App.tsx reads these to update state
- No React import needed in JSX files (jsx: "react-jsx" in tsconfig)
