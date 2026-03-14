import { useState, useRef } from 'react'
import { Box, Text } from 'ink'
import TextInputEnhanced from './TextInputEnhanced.js'
import { createLogEntry } from '../commands/log.js'

type Step = 'ticket' | 'duration' | 'date' | 'from' | 'to' | 'description'

interface LogEntryPromptsProps {
  onDone: (message: string) => void
}

export default function LogEntryPrompts({ onDone }: LogEntryPromptsProps) {
  const [step, setStep] = useState<Step>('ticket')
  const [input, setInput] = useState('')
  const ticket = useRef('')
  const duration = useRef('')
  const dateRef = useRef('')
  const from = useRef('')

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
        setStep('duration')
        break
      case 'duration':
        if (!v) {
          onDone('Log cancelled - duration is required.')
          return
        }
        duration.current = v
        setStep('date')
        break
      case 'date':
        dateRef.current = v
        setStep('from')
        break
      case 'from':
        from.current = v
        if (v) {
          setStep('to')
        } else {
          setStep('description')
        }
        break
      case 'to':
        // v is optional end time
        setStep('description')
        // store end time temporarily
        from.current = from.current + (v ? `|${v}` : '')
        break
      case 'description': {
        const parts = from.current.split('|')
        const startTime = parts[0] || undefined
        const endTime = parts[1] || undefined
        const result = createLogEntry({
          ticket: ticket.current,
          duration: duration.current,
          date: dateRef.current || undefined,
          startTime,
          endTime,
          description: v,
        })
        onDone(result.message)
        break
      }
    }
  }

  const prompts: Record<Step, string> = {
    ticket: 'Ticket:',
    duration: 'Duration (e.g. 1h 30m, 2:30, 1:30:45):',
    date: 'Date (yyyy-MM-dd or Enter for today):',
    from: 'From (HH:mm, optional):',
    to: 'To (HH:mm, optional):',
    description: 'Description (optional):',
  }

  return (
    <Box flexDirection='column'>
      <Text>{prompts[step]}</Text>
      <Box>
        <Text color='green' bold>
          {'❯ '}
        </Text>
        <TextInputEnhanced
          key={step}
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
        />
      </Box>
    </Box>
  )
}
