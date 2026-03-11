import {
  loadHistory,
  removeEntry,
  removeAllEntries,
} from '../storage/history.js'
import { formatDuration } from '../utils/formatDuration.js'
import { formatDateOnly } from '../utils/formatDate.js'

export interface RemoveResult {
  success: boolean
  message: string
}

export function removeTimeEntry(
  subcommand: string | null,
  args: string
): RemoveResult {
  if (subcommand === 'all') {
    const count = removeAllEntries()
    if (count === 0) {
      return { success: false, message: 'No entries to remove.' }
    }
    return { success: true, message: `Removed all ${count} entries.` }
  }

  const id = args.trim()
  if (!id) {
    return {
      success: false,
      message:
        'Usage: /remove <id> or /remove:all\nUse /history to see entry IDs.',
    }
  }

  const entries = loadHistory()
  const entry = entries.find((e) => e.id === id || e.id.startsWith(id))

  if (!entry) {
    return { success: false, message: `No entry found matching "${id}".` }
  }

  removeEntry(entry.id)
  return {
    success: true,
    message: `Removed: ${entry.ticket} ${formatDateOnly(entry.startTime)} (${formatDuration(entry.duration)})`,
  }
}
