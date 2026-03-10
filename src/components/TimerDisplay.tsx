import { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { formatDuration } from '../utils/formatDuration.js'
import { calculateElapsed } from '../commands/stop.js'
import type { ActiveTimer } from '../types/index.js'

interface TimerDisplayProps {
  timer: ActiveTimer
  isPaused: boolean
}

export default function TimerDisplay({ timer, isPaused }: TimerDisplayProps) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timer, isPaused])

  // Recalculate on every tick or when pause state changes
  void tick
  const elapsed = calculateElapsed(timer)

  return (
    <Box flexDirection='column'>
      <Box>
        <Text bold color='cyan'>
          {timer.ticket}
        </Text>
        {timer.description ? <Text> - {timer.description}</Text> : null}
      </Box>
      <Box>
        <Text color={isPaused ? 'yellow' : 'green'} bold>
          {formatDuration(elapsed)}
        </Text>
        {isPaused ? <Text color='yellow'> (paused)</Text> : null}
      </Box>
    </Box>
  )
}
