import { useState, useCallback } from "react";
import { Box, Text, useApp } from "ink";
import { parseCommand } from "../commands/parser.js";
import { startTimer } from "../commands/start.js";
import { pauseTimer } from "../commands/pause.js";
import { resumeTimer } from "../commands/resume.js";
import { stopTimer } from "../commands/stop.js";
import { getHistory } from "../commands/history.js";
import { syncAll } from "../commands/sync.js";
import { loadSettings } from "../storage/settings.js";
import type {
  AppMode,
  ActiveTimer,
  SyncResult,
  TimeEntry,
} from "../types/index.js";
import type { HistoryFilter } from "../commands/history.js";
import CommandInput from "./CommandInput.js";
import TimerDisplay from "./TimerDisplay.js";
import StatusBar from "./StatusBar.js";
import HelpView from "./HelpView.js";
import HistoryTable from "./HistoryTable.js";
import SyncReport from "./SyncReport.js";
import SettingsPrompts from "./SettingsPrompts.js";
import LogEntryPrompts from "./LogEntryPrompts.js";
import SyncCheckTable from "./SyncCheckTable.js";
import type { SyncCheckResult } from "../commands/syncCheck.js";

export default function App() {
  const { exit } = useApp();
  const [mode, setMode] = useState<AppMode>("idle");
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [message, setMessage] = useState<string | null>(
    "Type /help for commands.",
  );
  const [historyData, setHistoryData] = useState<{
    entries: TimeEntry[];
    filter: HistoryFilter;
    dateArg?: string;
  } | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);
  const [settingsSubcommand, setSettingsSubcommand] = useState<
    string | null
  >(null);
  const [syncCheckData, setSyncCheckData] = useState<SyncCheckResult | null>(
    null,
  );

  const showMessage = (msg: string) => setMessage(msg);

  const handlePromptDone = useCallback(
    (msg: string) => {
      showMessage(msg);
      setMode(
        timer
          ? timer.currentPauseStart
            ? "timer-paused"
            : "timer-running"
          : "idle",
      );
    },
    [timer],
  );

  const handleCommand = useCallback(
    async (input: string) => {
      const parsed = parseCommand(input);
      if (!parsed) {
        showMessage(`Unknown input. Type /help for commands.`);
        return;
      }

      const { command, subcommand, args } = parsed;
      setMessage(null);
      setHistoryData(null);
      setSyncResults(null);
      setSyncCheckData(null);

      switch (command) {
        case "help":
          setMode("showing-help");
          break;

        case "start": {
          const result = startTimer(args, timer);
          showMessage(result.message);
          if (result.success && result.timer) {
            setTimer(result.timer);
            setMode("timer-running");
          }
          break;
        }

        case "pause": {
          const result = pauseTimer(timer);
          showMessage(result.message);
          if (result.success && result.timer) {
            setTimer(result.timer);
            setMode("timer-paused");
          }
          break;
        }

        case "resume": {
          const result = resumeTimer(timer);
          showMessage(result.message);
          if (result.success && result.timer) {
            setTimer(result.timer);
            setMode("timer-running");
          }
          break;
        }

        case "stop": {
          const discard = subcommand === "discard";
          const result = stopTimer(timer, discard);
          showMessage(result.message);
          if (result.success) {
            const settings = loadSettings();
            if (!discard && settings.autoSync && result.entry) {
              setMode("syncing");
              const results = await syncAll();
              setSyncResults(results);
            }
            setTimer(null);
            setMode("idle");
          }
          break;
        }

        case "history": {
          const result = getHistory(subcommand, args);
          setHistoryData(result);
          setMode("showing-history");
          break;
        }

        case "log":
          setMode("prompting-log");
          break;

        case "settings":
          if (!subcommand || subcommand === "integrations") {
            setSettingsSubcommand(subcommand);
            setMode("prompting-settings");
          } else {
            showMessage(
              `Unknown settings type: ${subcommand}. Use /settings or /settings:integrations.`,
            );
          }
          break;

        case "sync":
          if (subcommand === "check") {
            showMessage("Checking sync status...");
            const { checkSync } = await import("../commands/syncCheck.js");
            const check = await checkSync();
            if (args.includes("--full")) {
              setSyncCheckData(check);
            } else {
              showMessage(
                `Matched: ${check.matched.length}, Local only: ${check.localOnly.length}, Remote only: ${check.remoteOnly.length}`,
              );
            }
          } else {
            setMode("syncing");
            showMessage("Syncing...");
            const results = await syncAll();
            setSyncResults(results);
            setMode(timer ? "timer-running" : "idle");
          }
          break;

        case "quit":
          if (timer) {
            showMessage("Stop your timer first (/stop or /stop:discard).");
          } else {
            exit();
          }
          break;

        default:
          showMessage(`Unknown command: /${command}. Type /help for commands.`);
      }
    },
    [timer, exit],
  );

  const isInputActive =
    mode !== "prompting-settings" && mode !== "prompting-log";

  return (
    <Box flexDirection="column">
      {timer && (mode === "timer-running" || mode === "timer-paused") ? (
        <TimerDisplay timer={timer} isPaused={mode === "timer-paused"} />
      ) : null}

      {mode === "showing-help" ? <HelpView /> : null}

      {mode === "showing-history" && historyData ? (
        <HistoryTable
          entries={historyData.entries}
          filter={historyData.filter}
          dateArg={historyData.dateArg}
        />
      ) : null}

      {mode === "prompting-settings" ? (
        <SettingsPrompts
          onDone={handlePromptDone}
          subcommand={settingsSubcommand}
        />
      ) : null}

      {mode === "prompting-log" ? (
        <LogEntryPrompts onDone={handlePromptDone} />
      ) : null}

      {syncCheckData ? <SyncCheckTable data={syncCheckData} /> : null}

      {syncResults ? <SyncReport results={syncResults} /> : null}

      {message ? <Text>{message}</Text> : null}

      <StatusBar mode={mode} ticket={timer?.ticket} />
      <CommandInput onSubmit={handleCommand} isActive={isInputActive} />
    </Box>
  );
}
