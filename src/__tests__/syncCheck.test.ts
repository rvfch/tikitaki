import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

let tempDir: string

vi.mock('../storage/paths.js', () => ({
  getDataDir: () => tempDir,
  getHistoryPath: () => join(tempDir, 'history.json'),
  getSettingsPath: () => join(tempDir, 'settings.json'),
}))

vi.mock('../integrations/jira.js', () => ({
  getJiraWorklogs: vi.fn().mockResolvedValue([]),
}))

vi.mock('../integrations/clockify.js', () => ({
  getClockifyEntries: vi.fn().mockResolvedValue([]),
}))

const { checkSync } = await import('../commands/syncCheck.js')
const { saveHistory } = await import('../storage/history.js')
const { saveSettings } = await import('../storage/settings.js')
const { getJiraWorklogs } = await import('../integrations/jira.js')

describe('checkSync', () => {
  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cli-timer-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true })
    vi.clearAllMocks()
  })

  it('identifies local-only entries', async () => {
    saveSettings({
      autoSync: false,
      minimumDailyHours: 8,
      integrations: {
        jira: {
          baseUrl: 'https://test.atlassian.net',
          email: 't@t.com',
          apiToken: 'tok',
        },
        clockify: null,
      },
    })

    saveHistory([
      {
        id: '1',
        ticket: 'T-1',
        description: '',
        project: 'T',
        startTime: '2026-03-11T09:00:00Z',
        endTime: '2026-03-11T10:00:00Z',
        duration: 3600,
        pauses: [],
        synced: { jira: false, clockify: false },
      },
    ])

    const result = await checkSync()
    expect(result.localOnly).toHaveLength(1)
    expect(result.matched).toHaveLength(0)
  })

  it('matches entries with similar duration', async () => {
    saveSettings({
      autoSync: false,
      minimumDailyHours: 8,
      integrations: {
        jira: {
          baseUrl: 'https://test.atlassian.net',
          email: 't@t.com',
          apiToken: 'tok',
        },
        clockify: null,
      },
    })

    saveHistory([
      {
        id: '1',
        ticket: 'T-1',
        description: '',
        project: 'T',
        startTime: '2026-03-11T09:00:00Z',
        endTime: '2026-03-11T10:00:00Z',
        duration: 3600,
        pauses: [],
        synced: { jira: false, clockify: false },
      },
    ])

    vi.mocked(getJiraWorklogs).mockResolvedValue([
      {
        source: 'jira',
        ticket: 'T-1',
        date: '2026-03-11',
        duration: 3610, // within 5 min tolerance
      },
    ])

    const result = await checkSync()
    expect(result.matched).toHaveLength(1)
    expect(result.localOnly).toHaveLength(0)
  })
})
