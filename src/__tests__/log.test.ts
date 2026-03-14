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

const { createLogEntry, parseLogArgs } = await import('../commands/log.js')

describe('createLogEntry', () => {
  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'tikitaki-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true })
  })

  it('creates a valid log entry with start and end times', () => {
    const result = createLogEntry({
      ticket: 'TEST-1',
      description: 'manual entry',
      startTime: '09:00',
      endTime: '10:30',
    })
    expect(result.success).toBe(true)
    expect(result.entry?.duration).toBe(5400) // 1.5 hours
    expect(result.entry?.ticket).toBe('TEST-1')
  })

  it('creates a valid log entry with duration only', () => {
    const result = createLogEntry({
      ticket: 'TEST-1',
      description: 'duration entry',
      duration: '1h 30m',
    })
    expect(result.success).toBe(true)
    expect(result.entry?.duration).toBe(5400)
  })

  it('creates a log entry with duration and start time', () => {
    const result = createLogEntry({
      ticket: 'TEST-1',
      duration: '2h',
      startTime: '09:00',
    })
    expect(result.success).toBe(true)
    expect(result.entry?.duration).toBe(7200)
  })

  it('fails with missing ticket', () => {
    const result = createLogEntry({
      ticket: '',
      duration: '1h',
    })
    expect(result.success).toBe(false)
  })

  it('fails when end is before start', () => {
    const result = createLogEntry({
      ticket: 'TEST-1',
      startTime: '10:00',
      endTime: '09:00',
    })
    expect(result.success).toBe(false)
    expect(result.message).toContain('End time must be after start time')
  })

  it('derives project from ticket', () => {
    const result = createLogEntry({
      ticket: 'PROJ-123',
      duration: '1h',
    })
    expect(result.entry?.project).toBe('PROJ')
  })

  it('uses explicit project when provided', () => {
    const result = createLogEntry({
      ticket: 'PROJ-123',
      duration: '1h',
      project: 'CUSTOM',
    })
    expect(result.entry?.project).toBe('CUSTOM')
  })

  it('creates a log entry with date and start/end times', () => {
    const result = createLogEntry({
      ticket: 'TEST-1',
      date: '2025-03-10',
      startTime: '09:00',
      endTime: '11:00',
    })
    expect(result.success).toBe(true)
    expect(result.entry?.duration).toBe(7200)
    expect(result.entry?.startTime).toContain('2025-03-10')
    expect(result.entry?.endTime).toContain('2025-03-10')
  })

  it('creates a log entry with date and duration only (end of day)', () => {
    const result = createLogEntry({
      ticket: 'TEST-1',
      date: '2025-03-10',
      duration: '1h',
    })
    expect(result.success).toBe(true)
    expect(result.entry?.duration).toBe(3600)
    expect(result.entry?.startTime).toContain('2025-03-10')
    expect(result.entry?.endTime).toContain('2025-03-10')
    expect(new Date(result.entry!.endTime).getTime()).toBe(
      new Date(result.entry!.startTime).getTime() + 3600 * 1000
    )
  })

  it('fails with invalid date', () => {
    const result = createLogEntry({
      ticket: 'TEST-1',
      date: 'not-a-date',
      duration: '1h',
    })
    expect(result.success).toBe(false)
    expect(result.message).toContain('Invalid date')
  })
})

describe('parseLogArgs', () => {
  it('parses ticket and duration', () => {
    const result = parseLogArgs('XXX-123 1h30m')
    expect(result).toEqual({
      ticket: 'XXX-123',
      duration: '1h30m',
    })
  })

  it('parses ticket, duration, and from time', () => {
    const result = parseLogArgs('XXX-123 2h 09:00')
    expect(result).toEqual({
      ticket: 'XXX-123',
      duration: '2h',
      startTime: '09:00',
    })
  })

  it('parses ticket, duration, from, description, and to', () => {
    const result = parseLogArgs('XXX-123 2h 09:00 some work 11:00')
    expect(result).toEqual({
      ticket: 'XXX-123',
      duration: '2h',
      startTime: '09:00',
      endTime: '11:00',
      description: 'some work',
    })
  })

  it('returns null for empty args', () => {
    expect(parseLogArgs('')).toBeNull()
  })

  it('returns null for invalid duration', () => {
    expect(parseLogArgs('XXX-123 notaduration')).toBeNull()
  })

  it('parses leading date with ticket and duration', () => {
    const result = parseLogArgs('2025-03-10 PROJ-123 2h')
    expect(result).toEqual({
      ticket: 'PROJ-123',
      duration: '2h',
      date: '2025-03-10',
    })
  })

  it('parses without date (date optional)', () => {
    const result = parseLogArgs('PROJ-123 2h')
    expect(result?.ticket).toBe('PROJ-123')
    expect(result?.duration).toBe('2h')
    expect(result).not.toHaveProperty('date')
  })
})
