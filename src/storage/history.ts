import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { getHistoryPath } from './paths.js'
import type { TimeEntry } from '../types/index.js'

export function loadHistory(): TimeEntry[] {
  const path = getHistoryPath()
  if (!existsSync(path)) {
    return []
  }
  try {
    const raw = readFileSync(path, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveHistory(entries: TimeEntry[]): void {
  writeFileSync(getHistoryPath(), JSON.stringify(entries, null, 2))
}

export function addEntry(entry: TimeEntry): void {
  const entries = loadHistory()
  entries.push(entry)
  saveHistory(entries)
}

export function updateEntry(id: string, updates: Partial<TimeEntry>): void {
  const entries = loadHistory()
  const index = entries.findIndex((e) => e.id === id)
  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates }
    saveHistory(entries)
  }
}

export function getUnsyncedEntries(target: 'jira' | 'clockify'): TimeEntry[] {
  return loadHistory().filter((e) => !e.synced?.[target])
}

export function removeEntry(id: string): boolean {
  const entries = loadHistory()
  const index = entries.findIndex((e) => e.id === id)
  if (index === -1) return false
  entries.splice(index, 1)
  saveHistory(entries)
  return true
}

export function removeAllEntries(): number {
  const entries = loadHistory()
  const count = entries.length
  saveHistory([])
  return count
}
