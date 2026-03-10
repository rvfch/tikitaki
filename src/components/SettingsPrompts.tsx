import { useState, useRef } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import {
  saveJiraConfig,
  saveClockifyConfig,
  removeIntegration,
} from '../commands/settings.js'

type Step =
  | 'settings-type'
  | 'choose'
  | 'jira-url'
  | 'jira-email'
  | 'jira-token'
  | 'clockify-key'
  | 'clockify-workspace'
  | 'remove-choose'
  | 'done'

interface SettingsPromptsProps {
  onDone: (message: string) => void
  subcommand?: string | null
}

export default function SettingsPrompts({
  onDone,
  subcommand,
}: SettingsPromptsProps) {
  const initialStep: Step =
    subcommand === 'integrations' ? 'choose' : 'settings-type'
  const [step, setStep] = useState<Step>(initialStep)
  const [input, setInput] = useState('')
  const jiraUrl = useRef('')
  const jiraEmail = useRef('')
  const clockifyKey = useRef('')

  const handleSubmit = (val: string) => {
    const v = val.trim()
    setInput('')

    switch (step) {
      case 'settings-type':
        if (v === '1') setStep('choose')
        else if (v === 'q') onDone('Settings cancelled.')
        break

      case 'choose':
        if (v === '1') setStep('jira-url')
        else if (v === '2') setStep('clockify-key')
        else if (v === '3') setStep('remove-choose')
        else if (v === 'q') onDone('Settings cancelled.')
        break

      case 'jira-url':
        jiraUrl.current = v
        setStep('jira-email')
        break
      case 'jira-email':
        jiraEmail.current = v
        setStep('jira-token')
        break
      case 'jira-token':
        saveJiraConfig({
          baseUrl: jiraUrl.current,
          email: jiraEmail.current,
          apiToken: v,
        })
        onDone('Jira integration configured.')
        break

      case 'clockify-key':
        clockifyKey.current = v
        setStep('clockify-workspace')
        break
      case 'clockify-workspace':
        saveClockifyConfig({
          apiKey: clockifyKey.current,
          workspaceId: v,
          projectMappings: {},
        })
        onDone('Clockify integration configured.')
        break

      case 'remove-choose':
        if (v === '1') {
          removeIntegration('jira')
          onDone('Jira integration removed.')
        } else if (v === '2') {
          removeIntegration('clockify')
          onDone('Clockify integration removed.')
        } else {
          onDone('Settings cancelled.')
        }
        break
    }
  }

  const prompts: Record<string, string> = {
    'settings-type': 'Settings:\n  1) Integrations\n  q) Cancel\nChoice:',
    choose:
      'Configure integrations:\n  1) Jira\n  2) Clockify\n  3) Remove integration\n  q) Cancel\nChoice:',
    'jira-url': 'Jira base URL (e.g. https://yourorg.atlassian.net):',
    'jira-email': 'Jira email:',
    'jira-token': 'Jira API token:',
    'clockify-key': 'Clockify API key:',
    'clockify-workspace': 'Clockify workspace ID:',
    'remove-choose': 'Remove:\n  1) Jira\n  2) Clockify\nChoice:',
  }

  if (step === 'done') return null

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
