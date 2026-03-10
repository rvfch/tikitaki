import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  filterToday,
  filterWeek,
  filterMonth,
  filterDate,
  groupByDate,
} from '../utils/dateFilters.js'
import type { TimeEntry } from '../types/index.js'

function makeEntry(date: string, id = '1'): TimeEntry {
  return {
    id,
    ticket: 'TEST-1',
    description: 'test',
    project: 'TEST',
    startTime: `${date}T10:00:00.000Z`,
    endTime: `${date}T11:00:00.000Z`,
    duration: 3600,
    pauses: [],
    synced: { jira: false, clockify: false },
  }
}

describe('dateFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-11T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("filterToday returns only today's entries", () => {
    const entries = [makeEntry('2026-03-11', '1'), makeEntry('2026-03-10', '2')]
    const result = filterToday(entries)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filterWeek returns entries from current week', () => {
    const entries = [
      makeEntry('2026-03-09', '1'), // Monday of this week
      makeEntry('2026-03-11', '2'), // Wednesday
      makeEntry('2026-03-01', '3'), // Previous week
    ]
    const result = filterWeek(entries)
    expect(result).toHaveLength(2)
  })

  it('filterMonth returns entries from current month', () => {
    const entries = [
      makeEntry('2026-03-01', '1'),
      makeEntry('2026-03-11', '2'),
      makeEntry('2026-02-28', '3'),
    ]
    const result = filterMonth(entries)
    expect(result).toHaveLength(2)
  })

  it('filterDate returns entries for specific date', () => {
    const entries = [makeEntry('2026-03-10', '1'), makeEntry('2026-03-11', '2')]
    const result = filterDate(entries, '2026-03-10')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('groupByDate groups entries by date', () => {
    const entries = [
      makeEntry('2026-03-10', '1'),
      makeEntry('2026-03-10', '2'),
      makeEntry('2026-03-11', '3'),
    ]
    const groups = groupByDate(entries)
    expect(Object.keys(groups)).toHaveLength(2)
    expect(groups['2026-03-10']).toHaveLength(2)
    expect(groups['2026-03-11']).toHaveLength(1)
  })
})
