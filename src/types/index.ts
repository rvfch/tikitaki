export interface PauseInterval {
  pausedAt: string
  resumedAt: string | null
}

export interface SyncStatus {
  jira: boolean
  clockify: boolean
}

export interface TimeEntry {
  id: string
  ticket: string
  description: string
  project: string
  startTime: string
  endTime: string
  duration: number
  pauses: PauseInterval[]
  synced: SyncStatus
}

export interface ActiveTimer {
  ticket: string
  description: string
  project: string
  startTime: string
  pauses: PauseInterval[]
  currentPauseStart: string | null
}

export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
}

export interface ClockifyConfig {
  apiKey: string
  workspaceId: string
  projectMappings: Record<string, string>
}

export interface Settings {
  autoSync: boolean
  minimumDailyHours: number
  integrations: {
    jira: JiraConfig | null
    clockify: ClockifyConfig | null
  }
}

export type AppMode =
  | 'idle'
  | 'timer-running'
  | 'timer-paused'
  | 'showing-history'
  | 'prompting-settings'
  | 'prompting-log'
  | 'prompting-remove'
  | 'syncing'
  | 'showing-help'

export interface ParsedCommand {
  command: string
  subcommand: string | null
  args: string
}

export interface SyncResult {
  entryId: string
  ticket: string
  success: boolean
  target: 'jira' | 'clockify'
  error?: string
}
