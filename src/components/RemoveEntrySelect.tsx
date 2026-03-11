import { useState, useMemo } from 'react'
import { Box, Text, useInput } from 'ink'
import { loadHistory } from '../storage/history.js'
import { removeEntry } from '../storage/history.js'
import { filterMonth } from '../utils/dateFilters.js'
import { formatDuration } from '../utils/formatDuration.js'
import { formatDateOnly, formatTime } from '../utils/formatDate.js'

const VISIBLE_COUNT = 10

interface RemoveEntrySelectProps {
  onDone: (message: string) => void
}

export default function RemoveEntrySelect({ onDone }: RemoveEntrySelectProps) {
  const entries = useMemo(() => {
    const all = loadHistory()
    return filterMonth(all).sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
  }, [])

  const [cursor, setCursor] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useInput((input, key) => {
    if (entries.length === 0) {
      if (key.return || input === 'q' || key.escape) {
        onDone('No entries to remove.')
      }
      return
    }

    if (key.upArrow) {
      setCursor((i) => Math.max(0, i - 1))
    } else if (key.downArrow) {
      setCursor((i) => Math.min(entries.length - 1, i + 1))
    } else if (input === ' ') {
      setSelected((prev) => {
        const next = new Set(prev)
        const id = entries[cursor].id
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    } else if (key.return) {
      if (selected.size === 0) {
        onDone('No entries selected.')
        return
      }
      for (const id of selected) {
        removeEntry(id)
      }
      onDone(
        `Removed ${selected.size} ${selected.size === 1 ? 'entry' : 'entries'}.`
      )
    } else if (input === 'q' || key.escape) {
      onDone('Remove cancelled.')
    }
  })

  if (entries.length === 0) {
    return <Text>No entries this month. Press any key to go back.</Text>
  }

  const scrollStart = Math.min(
    Math.max(0, cursor - Math.floor(VISIBLE_COUNT / 2)),
    Math.max(0, entries.length - VISIBLE_COUNT)
  )
  const visible = entries.slice(scrollStart, scrollStart + VISIBLE_COUNT)

  return (
    <Box flexDirection='column'>
      <Text bold>Select entries to remove (this month):</Text>
      <Text dimColor>
        {entries.length} {entries.length === 1 ? 'entry' : 'entries'} total
        {selected.size > 0 ? ` · ${selected.size} selected` : ''}
      </Text>
      <Box flexDirection='column' marginTop={1}>
        {visible.map((entry) => {
          const idx = entries.indexOf(entry)
          const isCursor = idx === cursor
          const isSelected = selected.has(entry.id)
          const checkbox = isSelected ? '[x]' : '[ ]'
          const pointer = isCursor ? '❯' : ' '
          const label = `${formatDateOnly(entry.startTime)} ${formatTime(entry.startTime)} ${entry.ticket.padEnd(12)} ${formatDuration(entry.duration).padEnd(10)} ${entry.description || ''}`

          return (
            <Box key={entry.id}>
              <Text color={isCursor ? 'cyan' : undefined}>
                {pointer} {checkbox} {label}
              </Text>
            </Box>
          )
        })}
      </Box>
      {entries.length > VISIBLE_COUNT && (
        <Text dimColor>
          [{scrollStart + 1}-
          {Math.min(scrollStart + VISIBLE_COUNT, entries.length)}/
          {entries.length}]
        </Text>
      )}
      <Text dimColor>
        ↑↓ navigate · space select · enter confirm · q cancel
      </Text>
    </Box>
  )
}
