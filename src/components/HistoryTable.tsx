import { Box, Text } from 'ink'
import { formatDuration } from '../utils/formatDuration.js'
import { formatTime } from '../utils/formatDate.js'
import { groupByDate } from '../utils/dateFilters.js'
import { loadSettings } from '../storage/settings.js'
import type { TimeEntry } from '../types/index.js'
import type { HistoryFilter } from '../commands/history.js'

interface HistoryTableProps {
  entries: TimeEntry[]
  filter: HistoryFilter
  dateArg?: string
}

export default function HistoryTable({
  entries,
  filter,
  dateArg,
}: HistoryTableProps) {
  const settings = loadSettings()
  const minSeconds = settings.minimumDailyHours * 3600

  if (entries.length === 0) {
    const label =
      filter === 'today'
        ? 'today'
        : filter === 'week'
          ? 'this week'
          : filter === 'month'
            ? 'this month'
            : dateArg || 'this period'
    return <Text dimColor>No entries for {label}.</Text>
  }

  const groups = groupByDate(entries)
  const sortedDates = Object.keys(groups).sort()

  return (
    <Box flexDirection='column'>
      {sortedDates.map((date) => {
        const dayEntries = groups[date]
        const dayTotal = dayEntries.reduce((sum, e) => sum + e.duration, 0)
        const belowMin = dayTotal < minSeconds

        return (
          <Box key={date} flexDirection='column' marginBottom={1}>
            <Box>
              <Text bold>{date}</Text>
              <Text> - Total: </Text>
              <Text color={belowMin ? 'red' : 'green'} bold>
                {formatDuration(dayTotal)}
              </Text>
              {belowMin ? (
                <Text color='red'> (below {settings.minimumDailyHours}h)</Text>
              ) : null}
            </Box>
            {dayEntries.map((entry) => (
              <Box key={entry.id} paddingLeft={2}>
                <Text dimColor>{entry.id.slice(0, 8)} </Text>
                <Text color='cyan'>{entry.ticket.padEnd(12)}</Text>
                {entry.project ? (
                  <Text color='magenta'>[{entry.project}] </Text>
                ) : null}
                <Text>
                  {formatTime(entry.startTime)}-{formatTime(entry.endTime)}
                </Text>
                <Text> {formatDuration(entry.duration).padStart(10)}</Text>
                {entry.description ? (
                  <Text dimColor> {entry.description}</Text>
                ) : null}
                {entry.synced.jira || entry.synced.clockify ? (
                  <Text color='green'> [synced]</Text>
                ) : null}
              </Box>
            ))}
          </Box>
        )
      })}
    </Box>
  )
}
