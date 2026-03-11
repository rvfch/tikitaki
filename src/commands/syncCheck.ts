import { loadHistory } from '../storage/history.js'
import { loadSettings } from '../storage/settings.js'
import { getJiraWorklogs } from '../integrations/jira.js'
import { getClockifyEntries } from '../integrations/clockify.js'
import { filterByPeriod, getDateRange } from '../utils/dateFilters.js'
import { toLocalDateStr, entryLocalDate } from '../utils/formatDate.js'
import type { Period } from '../utils/dateFilters.js'
import type { TimeEntry } from '../types/index.js'
import type { RemoteWorklog } from '../integrations/types.js'

export interface SyncCheckResult {
  localOnly: TimeEntry[]
  remoteOnly: RemoteWorklog[]
  matched: Array<{ local: TimeEntry; remote: RemoteWorklog }>
}

function isSimilarDuration(a: number, b: number): boolean {
  const diff = Math.abs(a - b)
  return diff < 300 // within 5 minutes
}

export async function checkSync(period?: Period): Promise<SyncCheckResult> {
  const settings = loadSettings()
  let localEntries = loadHistory()
  if (period) localEntries = filterByPeriod(localEntries, period)

  const remoteWorklogs: RemoteWorklog[] = []
  const tickets = [...new Set(localEntries.map((e) => e.ticket))]

  if (settings.integrations.jira) {
    for (const ticket of tickets) {
      const worklogs = await getJiraWorklogs(ticket, settings.integrations.jira)
      remoteWorklogs.push(...worklogs)
    }
  }

  if (settings.integrations.clockify) {
    let minDate: string
    let maxDate: string
    if (period) {
      const range = getDateRange(period)
      minDate = toLocalDateStr(range.start)
      maxDate = toLocalDateStr(range.end)
    } else {
      const dates = localEntries.map((e) => entryLocalDate(e.startTime))
      minDate = dates.sort()[0] || toLocalDateStr(new Date())
      maxDate = dates.sort().reverse()[0] || toLocalDateStr(new Date())
    }
    const entries = await getClockifyEntries(
      settings.integrations.clockify,
      minDate,
      maxDate
    )
    remoteWorklogs.push(...entries)
  }

  // Filter remote worklogs by period if applicable
  if (period) {
    const range = getDateRange(period)
    const minDate = toLocalDateStr(range.start)
    const maxDate = toLocalDateStr(range.end)
    const filtered = remoteWorklogs.filter(
      (w) => w.date >= minDate && w.date <= maxDate
    )
    remoteWorklogs.length = 0
    remoteWorklogs.push(...filtered)
  }

  const matched: Array<{ local: TimeEntry; remote: RemoteWorklog }> = []
  const matchedLocalIds = new Set<string>()
  const matchedRemoteIndices = new Set<number>()

  for (const local of localEntries) {
    const localDate = entryLocalDate(local.startTime)
    for (let i = 0; i < remoteWorklogs.length; i++) {
      if (matchedRemoteIndices.has(i)) continue
      const remote = remoteWorklogs[i]
      if (
        remote.ticket === local.ticket &&
        remote.date === localDate &&
        isSimilarDuration(remote.duration, local.duration)
      ) {
        matched.push({ local, remote })
        matchedLocalIds.add(local.id)
        matchedRemoteIndices.add(i)
        break
      }
    }
  }

  return {
    localOnly: localEntries.filter((e) => !matchedLocalIds.has(e.id)),
    remoteOnly: remoteWorklogs.filter((_, i) => !matchedRemoteIndices.has(i)),
    matched,
  }
}
