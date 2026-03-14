import { getUnsyncedEntries, updateEntry } from '../storage/history.js'
import { loadSettings } from '../storage/settings.js'
import { syncToJira, getJiraWorklogs } from '../integrations/jira.js'
import { syncToClockify, getClockifyEntries } from '../integrations/clockify.js'
import { filterByPeriod, getDateRange } from '../utils/dateFilters.js'
import { toLocalDateStr, entryLocalDate } from '../utils/formatDate.js'
import type { Period } from '../utils/dateFilters.js'
import type {
  SyncResult,
  SyncPreview,
  SyncPreviewWithRemote,
} from '../types/index.js'
import type { RemoteWorklog } from '../integrations/types.js'
import type { TimeEntry } from '../types/index.js'

export function getSyncPreview(period?: Period): SyncPreview {
  const settings = loadSettings()
  const noIntegrations =
    !settings.integrations.jira && !settings.integrations.clockify

  let jira: SyncPreview['jira'] = []
  let clockify: SyncPreview['clockify'] = []
  if (settings.integrations.jira) {
    jira = getUnsyncedEntries('jira')
    if (period) jira = filterByPeriod(jira, period)
  }
  if (settings.integrations.clockify) {
    clockify = getUnsyncedEntries('clockify')
    if (period) clockify = filterByPeriod(clockify, period)
  }

  return { jira, clockify, noIntegrations }
}

function isSimilarDuration(a: number, b: number): boolean {
  return Math.abs(a - b) < 300
}

function splitByRemoteMatch(
  entries: TimeEntry[],
  remotes: RemoteWorklog[],
  source: 'jira' | 'clockify'
): { toSync: TimeEntry[]; alreadyOnRemote: TimeEntry[] } {
  const matchedRemoteIndices = new Set<number>()
  const alreadyOnRemote: TimeEntry[] = []
  const toSync: TimeEntry[] = []

  for (const local of entries) {
    const localDate = entryLocalDate(local.startTime)
    let matched = false
    for (let i = 0; i < remotes.length; i++) {
      if (matchedRemoteIndices.has(i)) continue
      const remote = remotes[i]
      if (remote.source !== source) continue
      if (
        remote.ticket === local.ticket &&
        remote.date === localDate &&
        isSimilarDuration(remote.duration, local.duration)
      ) {
        matchedRemoteIndices.add(i)
        alreadyOnRemote.push(local)
        matched = true
        break
      }
    }
    if (!matched) toSync.push(local)
  }
  return { toSync, alreadyOnRemote }
}

export async function getSyncPreviewWithRemoteCheck(
  period?: Period
): Promise<SyncPreviewWithRemote> {
  const preview = getSyncPreview(period)
  const {
    jira: jiraEntries,
    clockify: clockifyEntries,
    noIntegrations,
  } = preview

  if (noIntegrations) {
    return {
      toSync: { jira: [], clockify: [] },
      alreadyOnRemote: { jira: [], clockify: [] },
      noIntegrations: true,
    }
  }

  if (jiraEntries.length === 0 && clockifyEntries.length === 0) {
    return {
      toSync: { jira: [], clockify: [] },
      alreadyOnRemote: { jira: [], clockify: [] },
      noIntegrations: false,
    }
  }

  const settings = loadSettings()
  let minDate: string
  let maxDate: string
  if (period) {
    const range = getDateRange(period)
    minDate = toLocalDateStr(range.start)
    maxDate = toLocalDateStr(range.end)
  } else {
    const allEntries = [...jiraEntries, ...clockifyEntries]
    const dates = allEntries.map((e) => entryLocalDate(e.startTime))
    minDate = dates.sort()[0] ?? toLocalDateStr(new Date())
    maxDate = dates.sort().reverse()[0] ?? minDate
  }

  const jiraRemotes: RemoteWorklog[] = []
  const clockifyRemotes: RemoteWorklog[] = []

  try {
    if (settings.integrations.jira && jiraEntries.length > 0) {
      const tickets = [...new Set(jiraEntries.map((e) => e.ticket))]
      for (const ticket of tickets) {
        const worklogs = await getJiraWorklogs(
          ticket,
          settings.integrations.jira
        )
        jiraRemotes.push(
          ...worklogs.filter((w) => w.date >= minDate && w.date <= maxDate)
        )
      }
    }
    if (settings.integrations.clockify && clockifyEntries.length > 0) {
      const entries = await getClockifyEntries(
        settings.integrations.clockify,
        minDate,
        maxDate
      )
      clockifyRemotes.push(...entries)
    }
  } catch (err) {
    return {
      toSync: { jira: jiraEntries, clockify: clockifyEntries },
      alreadyOnRemote: { jira: [], clockify: [] },
      noIntegrations: false,
      fetchError: err instanceof Error ? err.message : String(err),
    }
  }

  const jiraSplit = splitByRemoteMatch(jiraEntries, jiraRemotes, 'jira')
  const clockifySplit = splitByRemoteMatch(
    clockifyEntries,
    clockifyRemotes,
    'clockify'
  )

  return {
    toSync: { jira: jiraSplit.toSync, clockify: clockifySplit.toSync },
    alreadyOnRemote: {
      jira: jiraSplit.alreadyOnRemote,
      clockify: clockifySplit.alreadyOnRemote,
    },
    noIntegrations: false,
  }
}

export async function syncAll(period?: Period): Promise<SyncResult[]> {
  const settings = loadSettings()
  const results: SyncResult[] = []

  if (settings.integrations.jira) {
    let entries = getUnsyncedEntries('jira')
    if (period) entries = filterByPeriod(entries, period)
    for (const entry of entries) {
      if (entry.synced?.jira) continue
      const result = await syncToJira(entry, settings.integrations.jira)
      if (result.success) {
        updateEntry(entry.id, {
          synced: { ...entry.synced, jira: true },
        })
      }
      results.push(result)
    }
  }

  if (settings.integrations.clockify) {
    let entries = getUnsyncedEntries('clockify')
    if (period) entries = filterByPeriod(entries, period)
    for (const entry of entries) {
      if (entry.synced?.clockify) continue
      const result = await syncToClockify(entry, settings.integrations.clockify)
      if (result.success) {
        updateEntry(entry.id, {
          synced: { ...entry.synced, clockify: true },
        })
      }
      results.push(result)
    }
  }

  if (!settings.integrations.jira && !settings.integrations.clockify) {
    return [
      {
        entryId: '',
        ticket: '',
        success: false,
        target: 'jira',
        error: 'No integrations configured. Use /settings:integrations first.',
      },
    ]
  }

  return results
}
