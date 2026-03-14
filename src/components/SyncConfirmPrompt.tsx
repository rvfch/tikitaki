import { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { formatDuration } from '../utils/formatDuration.js'
import { formatDateOnly, formatTime } from '../utils/formatDate.js'
import type { TimeEntry } from '../types/index.js'

interface EntryListProps {
  target: string
  entries: TimeEntry[]
  color?: string
}

function EntryList({ target, entries, color = 'cyan' }: EntryListProps) {
  if (entries.length === 0) return null
  return (
    <Box flexDirection='column' marginBottom={1}>
      <Text bold color={color as 'cyan' | 'yellow'}>
        → {target}
      </Text>
      {entries.map((e) => (
        <Text key={e.id} dimColor>
          {'  '}
          {formatDateOnly(e.startTime)} {formatTime(e.startTime)} {e.ticket}{' '}
          {formatDuration(e.duration)}
          {e.description ? ` — ${e.description}` : ''}
        </Text>
      ))}
    </Box>
  )
}

export interface SyncConfirmData {
  toSync: { jira: TimeEntry[]; clockify: TimeEntry[] }
  alreadyOnRemote: { jira: TimeEntry[]; clockify: TimeEntry[] }
  fetchError?: string
}

interface SyncConfirmPromptProps {
  data: SyncConfirmData
  periodLabel?: string
  onConfirm: (yes: boolean) => void
}

export default function SyncConfirmPrompt({
  data,
  periodLabel = '',
  onConfirm,
}: SyncConfirmPromptProps) {
  const [choice, setChoice] = useState<'yes' | 'no'>('yes')
  const { toSync, alreadyOnRemote, fetchError } = data
  const toSyncTotal = toSync.jira.length + toSync.clockify.length
  const alreadyTotal =
    alreadyOnRemote.jira.length + alreadyOnRemote.clockify.length

  useInput((input, key) => {
    if (key.upArrow || key.downArrow) {
      setChoice((c) => (c === 'yes' ? 'no' : 'yes'))
    } else if (key.return) {
      onConfirm(choice === 'yes')
    } else if (input === 'y' || input === 'Y') {
      onConfirm(true)
    } else if (input === 'n' || input === 'N') {
      onConfirm(false)
    }
  })

  return (
    <Box flexDirection='column'>
      {fetchError ? (
        <Text bold color='yellow'>
          Warning: could not fetch remote ({fetchError}). Some entries below may
          already exist.
        </Text>
      ) : null}
      <Text bold>
        Sync{periodLabel} — {toSyncTotal} entr
        {toSyncTotal === 1 ? 'y' : 'ies'} to sync:
      </Text>
      <EntryList target='Jira' entries={toSync.jira} />
      <EntryList target='Clockify' entries={toSync.clockify} />
      {alreadyTotal > 0 ? (
        <>
          <Text bold color='yellow'>
            Already on remote (will not sync):
          </Text>
          <EntryList
            target='Jira'
            entries={alreadyOnRemote.jira}
            color='yellow'
          />
          <EntryList
            target='Clockify'
            entries={alreadyOnRemote.clockify}
            color='yellow'
          />
        </>
      ) : null}
      <Text bold>Proceed?</Text>
      <Box flexDirection='column' marginTop={1}>
        <Text color={choice === 'yes' ? 'green' : undefined}>
          {choice === 'yes' ? '❯ ' : '  '}Yes
        </Text>
        <Text color={choice === 'no' ? 'green' : undefined}>
          {choice === 'no' ? '❯ ' : '  '}No
        </Text>
      </Box>
      <Text dimColor>↑↓ select · enter confirm · y/n</Text>
    </Box>
  )
}
