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
  syncToJira: vi.fn(),
}))

vi.mock('../integrations/clockify.js', () => ({
  syncToClockify: vi.fn(),
}))

const { syncAll } = await import('../commands/sync.js')
const { saveHistory } = await import('../storage/history.js')
const { saveSettings } = await import('../storage/settings.js')
const { syncToJira } = await import('../integrations/jira.js')
// syncToClockify mock is registered but not directly referenced in current tests
await import('../integrations/clockify.js')

describe('syncAll', () => {
  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cli-timer-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true })
    vi.clearAllMocks()
  })

  it('returns error when no integrations configured', async () => {
    saveSettings({
      autoSync: false,
      minimumDailyHours: 8,
      integrations: { jira: null, clockify: null },
    })

    const results = await syncAll()
    expect(results[0].success).toBe(false)
    expect(results[0].error).toContain('No integrations configured')
  })

  it('syncs unsynced entries to jira', async () => {
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

    vi.mocked(syncToJira).mockResolvedValue({
      entryId: '1',
      ticket: 'T-1',
      success: true,
      target: 'jira',
    })

    const results = await syncAll()
    expect(results).toHaveLength(1)
    expect(results[0].success).toBe(true)
  })

  it('skips already synced entries', async () => {
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
        synced: { jira: true, clockify: false },
      },
    ])

    const results = await syncAll()
    expect(results).toHaveLength(0)
    expect(syncToJira).not.toHaveBeenCalled()
  })
})
