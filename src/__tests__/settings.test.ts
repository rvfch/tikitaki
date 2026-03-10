import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

let tempDir: string

vi.mock('../storage/paths.js', () => ({
  getDataDir: () => tempDir,
  getHistoryPath: () => join(tempDir, 'history.json'),
  getSettingsPath: () => join(tempDir, 'settings.json'),
}))

const { loadSettings, saveSettings } = await import('../storage/settings.js')

describe('settings storage', () => {
  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cli-timer-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true })
  })

  it('returns defaults when no file exists', () => {
    const settings = loadSettings()
    expect(settings.autoSync).toBe(false)
    expect(settings.minimumDailyHours).toBe(8)
    expect(settings.integrations.jira).toBeNull()
    expect(settings.integrations.clockify).toBeNull()
  })

  it('saves and loads settings', () => {
    const settings = loadSettings()
    settings.autoSync = true
    settings.integrations.jira = {
      baseUrl: 'https://test.atlassian.net',
      email: 'test@test.com',
      apiToken: 'token',
    }
    saveSettings(settings)

    const loaded = loadSettings()
    expect(loaded.autoSync).toBe(true)
    expect(loaded.integrations.jira?.baseUrl).toBe('https://test.atlassian.net')
  })

  it('handles corrupt file gracefully', () => {
    writeFileSync(join(tempDir, 'settings.json'), '{bad')
    const settings = loadSettings()
    expect(settings.autoSync).toBe(false)
  })
})
