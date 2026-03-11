import { useState } from 'react'
import { Text, useInput } from 'ink'
import chalk from 'chalk'

interface TextInputEnhancedProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  focus?: boolean
  placeholder?: string
}

function findWordBoundaryLeft(value: string, offset: number): number {
  let i = offset - 1
  // skip whitespace
  while (i > 0 && value[i - 1] === ' ') i--
  // skip word chars
  while (i > 0 && value[i - 1] !== ' ') i--
  return Math.max(0, i)
}

function findWordBoundaryRight(value: string, offset: number): number {
  let i = offset
  // skip word chars
  while (i < value.length && value[i] !== ' ') i++
  // skip whitespace
  while (i < value.length && value[i] === ' ') i++
  return Math.min(value.length, i)
}

export default function TextInputEnhanced({
  value,
  onChange,
  onSubmit,
  focus = true,
  placeholder = '',
}: TextInputEnhancedProps) {
  const [rawCursorOffset, setCursorOffset] = useState(value.length)
  const cursorOffset = Math.min(rawCursorOffset, value.length)

  useInput(
    (input, key) => {
      if (
        key.upArrow ||
        key.downArrow ||
        (key.ctrl && input === 'c') ||
        key.tab
      ) {
        return
      }

      if (key.return) {
        onSubmit?.(value)
        return
      }

      let nextCursorOffset = cursorOffset
      let nextValue = value

      // Cmd+Left/Right: jump to start/end of line
      // Cmd+Arrow on macOS sends Home/End escape sequences
      // Ctrl+A/E is standard readline home/end
      const isHome =
        (key as Record<string, boolean>).pageUp === false &&
        input === 'a' &&
        key.ctrl
      const isEnd = input === 'e' && key.ctrl

      // Option+Left on macOS sends ESC+b (meta+'b')
      // Option+Right sends ESC+f (meta+'f')
      // Some terminals send \x1b[1;3D which ink parses as meta+leftArrow
      const isWordLeft =
        (key.leftArrow && (key.meta || key.ctrl)) || (key.meta && input === 'b')
      const isWordRight =
        (key.rightArrow && (key.meta || key.ctrl)) ||
        (key.meta && input === 'f')
      // Cmd+Backspace: delete to start of line (macOS sends meta+backspace)
      // Cmd+Backspace on macOS sends Ctrl+U (\x15)
      const isLineDelete =
        (input === 'u' && key.ctrl) ||
        ((key.backspace || key.delete) && key.meta)
      // Option+Backspace: delete word (some terminals send ctrl+backspace)
      const isWordDelete =
        ((key.backspace || key.delete) && key.ctrl) ||
        (key.meta && input === 'd')

      if (isLineDelete) {
        nextValue = value.slice(cursorOffset)
        nextCursorOffset = 0
      } else if (isHome) {
        nextCursorOffset = 0
      } else if (isEnd) {
        nextCursorOffset = value.length
      } else if (isWordLeft) {
        nextCursorOffset = findWordBoundaryLeft(value, cursorOffset)
      } else if (isWordRight) {
        nextCursorOffset = findWordBoundaryRight(value, cursorOffset)
      } else if (isWordDelete) {
        const boundary = findWordBoundaryLeft(value, cursorOffset)
        nextValue = value.slice(0, boundary) + value.slice(cursorOffset)
        nextCursorOffset = boundary
      } else if (key.leftArrow) {
        nextCursorOffset = cursorOffset - 1
      } else if (key.rightArrow) {
        nextCursorOffset = cursorOffset + 1
      } else if (key.backspace || key.delete) {
        if (cursorOffset > 0) {
          nextValue =
            value.slice(0, cursorOffset - 1) + value.slice(cursorOffset)
          nextCursorOffset = cursorOffset - 1
        }
      } else if (key.meta) {
        // Ignore other meta key combos to avoid inserting characters
        return
      } else {
        nextValue =
          value.slice(0, cursorOffset) + input + value.slice(cursorOffset)
        nextCursorOffset = cursorOffset + input.length
      }

      nextCursorOffset = Math.max(
        0,
        Math.min(nextValue.length, nextCursorOffset)
      )

      setCursorOffset(nextCursorOffset)
      if (nextValue !== value) {
        onChange(nextValue)
      }
    },
    { isActive: focus }
  )

  // Render with cursor
  if (!focus) {
    return <Text>{value || chalk.grey(placeholder)}</Text>
  }

  if (value.length === 0) {
    if (placeholder) {
      return (
        <Text>
          {chalk.inverse(placeholder[0]) + chalk.grey(placeholder.slice(1))}
        </Text>
      )
    }
    return <Text>{chalk.inverse(' ')}</Text>
  }

  let rendered = ''
  for (let i = 0; i < value.length; i++) {
    rendered += i === cursorOffset ? chalk.inverse(value[i]) : value[i]
  }
  if (cursorOffset === value.length) {
    rendered += chalk.inverse(' ')
  }

  return <Text>{rendered}</Text>
}
