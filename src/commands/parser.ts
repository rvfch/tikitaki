import type { ParsedCommand } from '../types/index.js'

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim()
  if (!trimmed.startsWith('/')) return null

  const spaceIndex = trimmed.indexOf(' ')
  const commandPart =
    spaceIndex === -1 ? trimmed.slice(1) : trimmed.slice(1, spaceIndex)
  const args = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1).trim()

  const colonIndex = commandPart.indexOf(':')
  let command: string
  let subcommand: string | null

  if (colonIndex === -1) {
    command = commandPart
    subcommand = null
  } else {
    command = commandPart.slice(0, colonIndex)
    subcommand = commandPart.slice(colonIndex + 1)
  }

  return { command: command.toLowerCase(), subcommand, args }
}
