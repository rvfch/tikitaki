import { getUnsyncedEntries, updateEntry } from '../storage/history.js'
import { loadSettings } from '../storage/settings.js'
import { syncToJira } from '../integrations/jira.js'
import { syncToClockify } from '../integrations/clockify.js'
import { filterByPeriod } from '../utils/dateFilters.js'
import type { Period } from '../utils/dateFilters.js'
import type { SyncResult } from '../types/index.js'

export async function syncAll(period?: Period): Promise<SyncResult[]> {
  const settings = loadSettings()
  const results: SyncResult[] = []

  if (settings.integrations.jira) {
    let entries = getUnsyncedEntries('jira')
    if (period) entries = filterByPeriod(entries, period)
    for (const entry of entries) {
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
