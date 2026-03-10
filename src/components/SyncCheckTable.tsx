import { Box, Text } from 'ink'
import { formatDuration } from '../utils/formatDuration.js'
import type { SyncCheckResult } from '../commands/syncCheck.js'

interface SyncCheckTableProps {
  data: SyncCheckResult
}

export default function SyncCheckTable({ data }: SyncCheckTableProps) {
  const { matched, localOnly, remoteOnly } = data

  return (
    <Box flexDirection='column'>
      <Text bold underline>
        Sync Check Results
      </Text>
      <Text> </Text>

      {matched.length > 0 ? (
        <Box flexDirection='column' marginBottom={1}>
          <Text color='green' bold>
            Matched ({matched.length}):
          </Text>
          <Box paddingLeft={2} flexDirection='column'>
            <Box>
              <Text bold color='gray'>
                {'Ticket'.padEnd(14)}
                {'Date'.padEnd(13)}
                {'Local'.padEnd(12)}
                {'Remote'.padEnd(12)}
                {'Source'}
              </Text>
            </Box>
            {matched.map(({ local, remote }) => (
              <Box key={local.id}>
                <Text color='green'>{local.ticket.padEnd(14)}</Text>
                <Text>{remote.date.padEnd(13)}</Text>
                <Text>{formatDuration(local.duration).padEnd(12)}</Text>
                <Text>{formatDuration(remote.duration).padEnd(12)}</Text>
                <Text dimColor>{remote.source}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      {localOnly.length > 0 ? (
        <Box flexDirection='column' marginBottom={1}>
          <Text color='yellow' bold>
            Local only ({localOnly.length}):
          </Text>
          <Box paddingLeft={2} flexDirection='column'>
            <Box>
              <Text bold color='gray'>
                {'Ticket'.padEnd(14)}
                {'Date'.padEnd(13)}
                {'Duration'.padEnd(12)}
                {'Description'}
              </Text>
            </Box>
            {localOnly.map((entry) => (
              <Box key={entry.id}>
                <Text color='yellow'>{entry.ticket.padEnd(14)}</Text>
                <Text>{entry.startTime.split('T')[0].padEnd(13)}</Text>
                <Text>{formatDuration(entry.duration).padEnd(12)}</Text>
                <Text dimColor>
                  {entry.description ? entry.description.slice(0, 30) : ''}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      {remoteOnly.length > 0 ? (
        <Box flexDirection='column' marginBottom={1}>
          <Text color='cyan' bold>
            Remote only ({remoteOnly.length}):
          </Text>
          <Box paddingLeft={2} flexDirection='column'>
            <Box>
              <Text bold color='gray'>
                {'Ticket'.padEnd(14)}
                {'Date'.padEnd(13)}
                {'Duration'.padEnd(12)}
                {'Source'}
              </Text>
            </Box>
            {remoteOnly.map((entry, i) => (
              <Box key={`${entry.ticket}-${entry.date}-${i}`}>
                <Text color='cyan'>{entry.ticket.padEnd(14)}</Text>
                <Text>{entry.date.padEnd(13)}</Text>
                <Text>{formatDuration(entry.duration).padEnd(12)}</Text>
                <Text dimColor>{entry.source}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      {matched.length === 0 &&
      localOnly.length === 0 &&
      remoteOnly.length === 0 ? (
        <Text dimColor>No entries found.</Text>
      ) : (
        <Box>
          <Text bold>Summary: </Text>
          <Text color='green'>{matched.length} matched</Text>
          <Text>, </Text>
          <Text color='yellow'>{localOnly.length} local only</Text>
          <Text>, </Text>
          <Text color='cyan'>{remoteOnly.length} remote only</Text>
        </Box>
      )}
    </Box>
  )
}
