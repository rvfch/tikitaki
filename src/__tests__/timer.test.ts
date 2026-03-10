import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { startTimer } from '../commands/start.js'
import { pauseTimer } from '../commands/pause.js'
import { resumeTimer } from '../commands/resume.js'
import { calculateElapsed } from '../commands/stop.js'
import type { ActiveTimer } from '../types/index.js'

describe('startTimer', () => {
  it('starts a timer with ticket and description', () => {
    const result = startTimer('TICK-1 my task', null)
    expect(result.success).toBe(true)
    expect(result.timer?.ticket).toBe('TICK-1')
    expect(result.timer?.description).toBe('my task')
    expect(result.timer?.project).toBe('TICK')
  })

  it('starts with ticket only', () => {
    const result = startTimer('TICK-1', null)
    expect(result.success).toBe(true)
    expect(result.timer?.description).toBe('')
  })

  it('fails if timer already running', () => {
    const existing: ActiveTimer = {
      ticket: 'OLD-1',
      description: '',
      project: 'OLD',
      startTime: new Date().toISOString(),
      pauses: [],
      currentPauseStart: null,
    }
    const result = startTimer('NEW-1', existing)
    expect(result.success).toBe(false)
  })

  it('fails with empty args', () => {
    const result = startTimer('', null)
    expect(result.success).toBe(false)
  })
})

describe('pauseTimer', () => {
  it('pauses a running timer', () => {
    const timer: ActiveTimer = {
      ticket: 'T-1',
      description: '',
      project: 'T',
      startTime: new Date().toISOString(),
      pauses: [],
      currentPauseStart: null,
    }
    const result = pauseTimer(timer)
    expect(result.success).toBe(true)
    expect(result.timer?.currentPauseStart).toBeTruthy()
  })

  it('fails with no timer', () => {
    expect(pauseTimer(null).success).toBe(false)
  })

  it('fails if already paused', () => {
    const timer: ActiveTimer = {
      ticket: 'T-1',
      description: '',
      project: 'T',
      startTime: new Date().toISOString(),
      pauses: [],
      currentPauseStart: new Date().toISOString(),
    }
    expect(pauseTimer(timer).success).toBe(false)
  })
})

describe('resumeTimer', () => {
  it('resumes a paused timer', () => {
    const timer: ActiveTimer = {
      ticket: 'T-1',
      description: '',
      project: 'T',
      startTime: new Date().toISOString(),
      pauses: [],
      currentPauseStart: new Date().toISOString(),
    }
    const result = resumeTimer(timer)
    expect(result.success).toBe(true)
    expect(result.timer?.currentPauseStart).toBeNull()
    expect(result.timer?.pauses).toHaveLength(1)
  })

  it('fails with no timer', () => {
    expect(resumeTimer(null).success).toBe(false)
  })

  it('fails if not paused', () => {
    const timer: ActiveTimer = {
      ticket: 'T-1',
      description: '',
      project: 'T',
      startTime: new Date().toISOString(),
      pauses: [],
      currentPauseStart: null,
    }
    expect(resumeTimer(timer).success).toBe(false)
  })
})

describe('calculateElapsed', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('calculates simple elapsed time', () => {
    vi.setSystemTime(new Date('2026-03-11T10:00:00Z'))
    const timer: ActiveTimer = {
      ticket: 'T-1',
      description: '',
      project: 'T',
      startTime: '2026-03-11T09:00:00Z',
      pauses: [],
      currentPauseStart: null,
    }
    expect(calculateElapsed(timer)).toBe(3600)
  })

  it('subtracts completed pause durations', () => {
    vi.setSystemTime(new Date('2026-03-11T10:00:00Z'))
    const timer: ActiveTimer = {
      ticket: 'T-1',
      description: '',
      project: 'T',
      startTime: '2026-03-11T09:00:00Z',
      pauses: [
        {
          pausedAt: '2026-03-11T09:30:00Z',
          resumedAt: '2026-03-11T09:45:00Z',
        },
      ],
      currentPauseStart: null,
    }
    // 1h total - 15m pause = 45m = 2700s
    expect(calculateElapsed(timer)).toBe(2700)
  })

  it('accounts for current pause', () => {
    vi.setSystemTime(new Date('2026-03-11T10:00:00Z'))
    const timer: ActiveTimer = {
      ticket: 'T-1',
      description: '',
      project: 'T',
      startTime: '2026-03-11T09:00:00Z',
      pauses: [],
      currentPauseStart: '2026-03-11T09:30:00Z',
    }
    // 1h total - 30m current pause = 30m = 1800s
    expect(calculateElapsed(timer)).toBe(1800)
  })

  it('handles multiple pauses', () => {
    vi.setSystemTime(new Date('2026-03-11T12:00:00Z'))
    const timer: ActiveTimer = {
      ticket: 'T-1',
      description: '',
      project: 'T',
      startTime: '2026-03-11T09:00:00Z',
      pauses: [
        {
          pausedAt: '2026-03-11T09:30:00Z',
          resumedAt: '2026-03-11T09:45:00Z',
        },
        {
          pausedAt: '2026-03-11T10:00:00Z',
          resumedAt: '2026-03-11T10:30:00Z',
        },
      ],
      currentPauseStart: null,
    }
    // 3h total - 15m - 30m = 2h15m = 8100s
    expect(calculateElapsed(timer)).toBe(8100)
  })
})
