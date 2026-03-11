import { useState } from 'react'
import { Box, Text, useInput } from 'ink'

export interface SelectItem {
  label: string
  value: string
}

interface SelectInputProps {
  items: SelectItem[]
  onSelect: (item: SelectItem) => void
  onCancel?: () => void
}

export default function SelectInput({
  items,
  onSelect,
  onCancel,
}: SelectInputProps) {
  const [index, setIndex] = useState(0)

  useInput((_input, key) => {
    if (key.upArrow) {
      setIndex((i) => (i <= 0 ? items.length - 1 : i - 1))
    } else if (key.downArrow) {
      setIndex((i) => (i >= items.length - 1 ? 0 : i + 1))
    } else if (key.return) {
      onSelect(items[index])
    } else if (_input === 'q' || key.escape) {
      onCancel?.()
    }
  })

  return (
    <Box flexDirection='column'>
      {items.map((item, i) => (
        <Box key={item.value}>
          <Text color={i === index ? 'cyan' : undefined}>
            {i === index ? '❯ ' : '  '}
            {item.label}
          </Text>
        </Box>
      ))}
      <Text dimColor>↑↓ navigate · enter select · q cancel</Text>
    </Box>
  )
}
