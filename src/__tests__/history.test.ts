import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// Mock the paths module to use a temp directory
let tempDir: string

vi.mock('../storage/paths.js', () => ({
  getDataDir: () => tempDir,
  getHistoryPath: () => join(tempDir, 'history.json'),
  getSettingsPath: () => join(tempDir, 'settings.json'),
}))

// Import after mock
const { loadHistory, saveHistory, addEntry } =
  await import('../storage/history.js')

describe('history storage', () => {
  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'tikitaki-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true })
  })

  it('returns empty array when no file exists', () => {
    expect(loadHistory()).toEqual([])
  })

  it('saves and loads entries', () => {
    const entry = {
      id: 'test-1',
      ticket: 'TICK-1',
      description: 'test',
      project: 'TICK',
      startTime: '2026-03-11T09:00:00Z',
      endTime: '2026-03-11T10:00:00Z',
      duration: 3600,
      pauses: [],
      synced: { jira: false, clockify: false },
    }
    saveHistory([entry])
    const loaded = loadHistory()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].ticket).toBe('TICK-1')
  })

  it('addEntry appends to existing entries', () => {
    const entry1 = {
      id: '1',
      ticket: 'T-1',
      description: '',
      project: 'T',
      startTime: '2026-03-11T09:00:00Z',
      endTime: '2026-03-11T10:00:00Z',
      duration: 3600,
      pauses: [],
      synced: { jira: false, clockify: false },
    }
    const entry2 = { ...entry1, id: '2', ticket: 'T-2' }
    addEntry(entry1)
    addEntry(entry2)
    expect(loadHistory()).toHaveLength(2)
  })

  it('handles corrupt file gracefully', () => {
    writeFileSync(join(tempDir, 'history.json'), 'not json')
    expect(loadHistory()).toEqual([])
  })
})
