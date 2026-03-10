import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  syncToClockify,
  getClockifyEntries,
  getClockifyProjects,
} from '../integrations/clockify.js'
import type { TimeEntry, ClockifyConfig } from '../types/index.js'

const config: ClockifyConfig = {
  apiKey: 'test-key',
  workspaceId: 'ws-1',
  projectMappings: { TEST: 'proj-1' },
}

const entry: TimeEntry = {
  id: '1',
  ticket: 'TEST-1',
  description: 'test task',
  project: 'TEST',
  startTime: '2026-03-11T09:00:00.000Z',
  endTime: '2026-03-11T10:00:00.000Z',
  duration: 3600,
  pauses: [],
  synced: { jira: false, clockify: false },
}

describe('syncToClockify', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends correct payload with project mapping', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: '123' }), { status: 201 })
    )

    const result = await syncToClockify(entry, config)
    expect(result.success).toBe(true)

    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('/workspaces/ws-1/time-entries')

    const opts = call[1] as RequestInit
    expect(opts.headers).toHaveProperty('X-Api-Key', 'test-key')

    const body = JSON.parse(opts.body as string)
    expect(body.projectId).toBe('proj-1')
    expect(body.description).toBe('TEST-1 test task')
  })

  it('returns failure on HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Unauthorized', { status: 401 })
    )

    const result = await syncToClockify(entry, config)
    expect(result.success).toBe(false)
    expect(result.error).toContain('401')
  })

  it('returns failure on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Connection refused'))

    const result = await syncToClockify(entry, config)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Connection refused')
  })
})

describe('getClockifyEntries', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches user and then entries', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'user-1' }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              description: 'TEST-1 task',
              timeInterval: {
                start: '2026-03-11T09:00:00Z',
                end: '2026-03-11T10:00:00Z',
                duration: 'PT1H',
              },
            },
          ]),
          { status: 200 }
        )
      )

    const result = await getClockifyEntries(config, '2026-03-11', '2026-03-11')
    expect(result).toHaveLength(1)
    expect(result[0].ticket).toBe('TEST-1')
    expect(result[0].duration).toBe(3600)
  })

  it('returns empty on user fetch error', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 401 }))

    const result = await getClockifyEntries(config, '2026-03-11', '2026-03-11')
    expect(result).toEqual([])
  })
})

describe('getClockifyProjects', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches projects', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: 'p1', name: 'Project 1' },
          { id: 'p2', name: 'Project 2' },
        ]),
        { status: 200 }
      )
    )

    const result = await getClockifyProjects(config)
    expect(result).toHaveLength(2)
  })
})
