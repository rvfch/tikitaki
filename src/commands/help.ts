export const HELP_TEXT = `Commands:
  /start <ticket> <description>  Start a timer
  /pause                         Pause the current timer
  /resume                        Resume a paused timer
  /stop                          Stop and save the current timer
  /stop:discard                  Stop and discard the current timer

  /history                       Show today's entries
  /history:week                  Show this week's entries
  /history:month                 Show this month's entries
  /history <date>                Show entries for a specific date (YYYY-MM-DD)

  /log                           Manually log a time entry
  /sync                          Sync unsynced entries to integrations
  /sync:check                    Compare local vs remote entries
  /sync:check --full             Full table of all local/remote entries

  /settings                      Open settings menu
  /settings:integrations         Configure Jira/Clockify integrations

  /help                          Show this help message
  /quit                          Exit the application
  `;
