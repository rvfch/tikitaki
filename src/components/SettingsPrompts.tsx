import { useState, useRef } from 'react'
import { Box, Text } from 'ink'
import TextInputEnhanced from './TextInputEnhanced.js'
import SelectInput from './SelectInput.js'
import type { SelectItem } from './SelectInput.js'
import {
  getSettings,
  saveJiraConfig,
  saveClockifyConfig,
  removeIntegration,
  updateAutoSync,
} from '../commands/settings.js'

type Step =
  | 'settings-type'
  | 'choose'
  | 'auto-sync'
  | 'jira-url'
  | 'jira-email'
  | 'jira-token'
  | 'clockify-key'
  | 'clockify-workspace'
  | 'remove-choose'
  | 'project-choose'
  | 'project-name'
  | 'project-id'
  | 'done'

interface SettingsPromptsProps {
  onDone: (message: string) => void
  subcommand?: string | null
}

const settingsItems: SelectItem[] = [
  { label: 'Integrations', value: 'integrations' },
  { label: 'Auto-sync', value: 'auto-sync' },
  { label: 'Project mappings', value: 'projects' },
]

const integrationItems: SelectItem[] = [
  { label: 'Jira', value: 'jira' },
  { label: 'Clockify', value: 'clockify' },
  { label: 'Remove integration', value: 'remove' },
]

const removeItems: SelectItem[] = [
  { label: 'Jira', value: 'jira' },
  { label: 'Clockify', value: 'clockify' },
]

export default function SettingsPrompts({
  onDone,
  subcommand,
}: SettingsPromptsProps) {
  const initialStep: Step =
    subcommand === 'integrations'
      ? 'choose'
      : subcommand === 'projects'
        ? 'project-choose'
        : 'settings-type'
  const [step, setStep] = useState<Step>(initialStep)
  const [input, setInput] = useState('')
  const jiraUrl = useRef('')
  const jiraEmail = useRef('')
  const clockifyKey = useRef('')
  const projectName = useRef('')

  const handleTextSubmit = (val: string) => {
    const v = val.trim()
    setInput('')

    switch (step) {
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
          projectMappings:
            getSettings().integrations.clockify?.projectMappings ?? {},
        })
        onDone('Clockify integration configured.')
        break

      case 'project-name':
        if (!v) {
          onDone('Cancelled.')
          return
        }
        projectName.current = v
        setStep('project-id')
        break
      case 'project-id': {
        if (!v) {
          onDone('Cancelled.')
          return
        }
        const settings = getSettings()
        const clockify = settings.integrations.clockify
        if (clockify) {
          clockify.projectMappings[projectName.current] = v
          saveClockifyConfig(clockify)
          onDone(`Mapped project "${projectName.current}" → ${v}`)
        } else {
          onDone('No Clockify integration configured.')
        }
        break
      }
    }
  }

  const handleSelect = (item: SelectItem) => {
    switch (step) {
      case 'settings-type':
        if (item.value === 'integrations') setStep('choose')
        else if (item.value === 'auto-sync') setStep('auto-sync')
        else if (item.value === 'projects') setStep('project-choose')
        break
      case 'choose':
        if (item.value === 'jira') setStep('jira-url')
        else if (item.value === 'clockify') setStep('clockify-key')
        else if (item.value === 'remove') setStep('remove-choose')
        break
      case 'auto-sync': {
        const enabled = item.value === 'on'
        updateAutoSync(enabled)
        onDone(`Auto-sync ${enabled ? 'enabled' : 'disabled'}.`)
        break
      }
      case 'remove-choose':
        removeIntegration(item.value as 'jira' | 'clockify')
        onDone(
          `${item.value === 'jira' ? 'Jira' : 'Clockify'} integration removed.`
        )
        break
      case 'project-choose':
        if (item.value === 'add') {
          setStep('project-name')
        } else if (item.value.startsWith('remove:')) {
          const name = item.value.replace('remove:', '')
          const settings = getSettings()
          const clockify = settings.integrations.clockify
          if (clockify) {
            delete clockify.projectMappings[name]
            saveClockifyConfig(clockify)
            onDone(`Removed project mapping "${name}".`)
          }
        }
        break
    }
  }

  const handleCancel = () => onDone('Settings cancelled.')

  const textPrompts: Partial<Record<Step, string>> = {
    'jira-url': 'Jira base URL (e.g. https://yourorg.atlassian.net):',
    'jira-email': 'Jira email:',
    'jira-token': 'Jira API token:',
    'clockify-key': 'Clockify API key:',
    'clockify-workspace': 'Clockify workspace ID:',
    'project-name': 'Project name (e.g. XXX):',
    'project-id': 'Clockify project ID:',
  }

  if (step === 'done') return null

  // Text input steps
  if (textPrompts[step]) {
    return (
      <Box flexDirection='column'>
        <Text>{textPrompts[step]}</Text>
        <Box>
          <Text color='green' bold>
            {'❯ '}
          </Text>
          <TextInputEnhanced
            key={step}
            value={input}
            onChange={setInput}
            onSubmit={handleTextSubmit}
          />
        </Box>
      </Box>
    )
  }

  // Select input steps
  if (step === 'settings-type') {
    return (
      <Box flexDirection='column'>
        <Text bold>Settings:</Text>
        <SelectInput
          items={settingsItems}
          onSelect={handleSelect}
          onCancel={handleCancel}
        />
      </Box>
    )
  }

  if (step === 'choose') {
    return (
      <Box flexDirection='column'>
        <Text bold>Configure integrations:</Text>
        <SelectInput
          items={integrationItems}
          onSelect={handleSelect}
          onCancel={handleCancel}
        />
      </Box>
    )
  }

  if (step === 'auto-sync') {
    const current = getSettings().autoSync
    return (
      <Box flexDirection='column'>
        <Text bold>Auto-sync after /stop:</Text>
        <Text dimColor>Currently: {current ? 'on' : 'off'}</Text>
        <SelectInput
          items={[
            { label: 'Enable', value: 'on' },
            { label: 'Disable', value: 'off' },
          ]}
          onSelect={handleSelect}
          onCancel={handleCancel}
        />
      </Box>
    )
  }

  if (step === 'remove-choose') {
    return (
      <Box flexDirection='column'>
        <Text bold>Remove integration:</Text>
        <SelectInput
          items={removeItems}
          onSelect={handleSelect}
          onCancel={handleCancel}
        />
      </Box>
    )
  }

  if (step === 'project-choose') {
    const settings = getSettings()
    const mappings = settings.integrations.clockify?.projectMappings ?? {}
    const items: SelectItem[] = [
      { label: 'Add project mapping', value: 'add' },
      ...Object.entries(mappings).map(([name, id]) => ({
        label: `Remove: ${name} → ${id}`,
        value: `remove:${name}`,
      })),
    ]

    return (
      <Box flexDirection='column'>
        <Text bold>Project mappings:</Text>
        {Object.keys(mappings).length === 0 ? (
          <Text dimColor>No project mappings configured.</Text>
        ) : null}
        <SelectInput
          items={items}
          onSelect={handleSelect}
          onCancel={handleCancel}
        />
      </Box>
    )
  }

  return null
}
