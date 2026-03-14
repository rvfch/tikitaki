export const HELP_TEXT = `Commands:
  /start <ticket> [desc] [HH:MM] Start a timer (optional past start time)
  /pause                         Pause the current timer
  /resume                        Resume a paused timer
  /stop                          Stop and save the current timer
  /stop:discard                  Stop and discard the current timer

  /history                       Show today's entries
  /history:week                  Show this week's entries
  /history:month                 Show this month's entries
  /history <date>                Show entries for a specific date (YYYY-MM-DD)

  /log                           Manually log a time entry (interactive)
  /log [date] <ticket> <duration>  Quick log; duration: 1h30m, 2:30, 1:30:45
  /log [date] <ticket> <dur> <from>     With start time
  /log [date] <ticket> <dur> <from> <desc> <to>
  /remove                        Interactive multi-select to remove entries
  /remove <id>                   Remove a time entry (use first 8 chars of ID)
  /remove:all                    Remove all time entries

  /sync [today|week|month]       Sync unsynced entries to integrations
  /sync:pull [today|week|month]  Import entries from integrations
  /sync:check [today|week|month] Compare local vs remote entries
  /sync:check --full [period]    Full table of all local/remote entries

  /settings                      Open settings menu
  /settings:integrations         Configure Jira/Clockify integrations
  /settings:projects             Manage project mappings

  /help                          Show this help message
  /quit                          Exit the application
  `
