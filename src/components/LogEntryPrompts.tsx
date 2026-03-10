import { useState, useRef } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { createLogEntry } from '../commands/log.js'
import { format } from 'date-fns'

type Step = 'ticket' | 'description' | 'date' | 'start' | 'end'

interface LogEntryPromptsProps {
  onDone: (message: string) => void
}

export default function LogEntryPrompts({ onDone }: LogEntryPromptsProps) {
  const [step, setStep] = useState<Step>('ticket')
  const [input, setInput] = useState('')
  const ticket = useRef('')
  const description = useRef('')
  const date = useRef('')
  const startTime = useRef('')

  const today = format(new Date(), 'yyyy-MM-dd')

  const handleSubmit = (val: string) => {
    const v = val.trim()
    setInput('')

    switch (step) {
      case 'ticket':
        if (!v) {
          onDone('Log cancelled - ticket is required.')
          return
        }
        ticket.current = v
        setStep('description')
        break
      case 'description':
        description.current = v
        setStep('date')
        break
      case 'date':
        date.current = v || today
        setStep('start')
        break
      case 'start':
        startTime.current = v
        setStep('end')
        break
      case 'end': {
        const result = createLogEntry({
          ticket: ticket.current,
          description: description.current,
          date: date.current || today,
          startTime: startTime.current,
          endTime: v,
        })
        onDone(result.message)
        break
      }
    }
  }

  const prompts: Record<Step, string> = {
    ticket: 'Ticket:',
    description: 'Description (optional):',
    date: `Date (${today}):`,
    start: 'Start time (HH:mm):',
    end: 'End time (HH:mm):',
  }

  return (
    <Box flexDirection='column'>
      <Text>{prompts[step]}</Text>
      <Box>
        <Text color='green' bold>
          {'❯ '}
        </Text>
        <TextInput
          key={step}
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
        />
      </Box>
    </Box>
  )
}
