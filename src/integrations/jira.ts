import type { TimeEntry, JiraConfig, SyncResult } from '../types/index.js'
import type { RemoteWorklog } from './types.js'

function getAuthHeader(config: JiraConfig): string {
  const credentials = Buffer.from(
    `${config.email}:${config.apiToken}`
  ).toString('base64')
  return `Basic ${credentials}`
}

function buildAdfComment(description: string) {
  return {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: description ?? '' }],
      },
    ],
  }
}

export async function syncToJira(
  entry: TimeEntry,
  config: JiraConfig
): Promise<SyncResult> {
  const url = `${config.baseUrl}/rest/api/3/issue/${entry.ticket}/worklog`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(config),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeSpentSeconds: entry.duration,
        started: new Date(entry.startTime).toISOString().replace('Z', '+0000'),
        comment: buildAdfComment(entry.description),
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return {
        entryId: entry.id,
        ticket: entry.ticket,
        success: false,
        target: 'jira',
        error: `HTTP ${response.status}: ${text}`,
      }
    }

    return {
      entryId: entry.id,
      ticket: entry.ticket,
      success: true,
      target: 'jira',
    }
  } catch (err) {
    return {
      entryId: entry.id,
      ticket: entry.ticket,
      success: false,
      target: 'jira',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function getJiraWorklogs(
  ticket: string,
  config: JiraConfig
): Promise<RemoteWorklog[]> {
  const url = `${config.baseUrl}/rest/api/3/issue/${ticket}/worklog`

  const response = await fetch(url, {
    headers: {
      Authorization: getAuthHeader(config),
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) return []

  const data = (await response.json()) as {
    worklogs: Array<{
      started: string
      timeSpentSeconds: number
      comment?: { content?: Array<{ content?: Array<{ text?: string }> }> }
    }>
  }

  return data.worklogs.map((w) => ({
    source: 'jira' as const,
    ticket,
    date: w.started.split('T')[0],
    duration: w.timeSpentSeconds,
    description: w.comment?.content?.[0]?.content?.[0]?.text,
  }))
}
