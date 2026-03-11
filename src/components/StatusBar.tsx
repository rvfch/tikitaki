import React from 'react'
import { Box, Text } from 'ink'
import type { AppMode } from '../types/index.js'

interface StatusBarProps {
  mode: AppMode
  ticket?: string
}

const MODE_LABELS: Record<AppMode, { label: string; color: string }> = {
  idle: { label: 'IDLE', color: 'gray' },
  'timer-running': { label: 'RUNNING', color: 'green' },
  'timer-paused': { label: 'PAUSED', color: 'yellow' },
  'showing-history': { label: 'HISTORY', color: 'blue' },
  'prompting-settings': { label: 'SETTINGS', color: 'magenta' },
  'prompting-log': { label: 'LOG', color: 'magenta' },
  'prompting-remove': { label: 'REMOVE', color: 'red' },
  syncing: { label: 'SYNCING', color: 'cyan' },
  'showing-help': { label: 'HELP', color: 'blue' },
}

export default function StatusBar({ mode, ticket }: StatusBarProps) {
  const { label, color } = MODE_LABELS[mode]

  return (
    <Box marginY={0}>
      <Text color={color} bold>
        [{label}]
      </Text>
      {ticket ? <Text> {ticket}</Text> : null}
    </Box>
  )
}
