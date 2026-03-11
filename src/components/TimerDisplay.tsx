import { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { formatTimer } from '../utils/formatDuration.js'
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

  void tick
  const elapsed = calculateElapsed(timer)
  const timeStr = formatTimer(elapsed)
  const color = isPaused ? 'yellow' : 'green'

  return (
    <Box
      flexDirection='column'
      borderStyle='round'
      borderColor={color}
      paddingX={2}
    >
      <Box justifyContent='center'>
        <Text bold color='cyan'>
          {timer.ticket}
        </Text>
        {timer.description ? (
          <Text dimColor> — {timer.description}</Text>
        ) : null}
        {timer.project ? <Text color='magenta'> [{timer.project}]</Text> : null}
      </Box>
      <Box justifyContent='center'>
        <Text color={color} bold>
          {timeStr}
        </Text>
        {isPaused ? (
          <Text color='yellow' bold>
            {' '}
            ⏸ PAUSED
          </Text>
        ) : null}
      </Box>
    </Box>
  )
}
