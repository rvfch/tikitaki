export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`)
  parts.push(`${seconds}s`)

  return parts.join(' ')
}

export function formatTimer(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function parseDurationInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase()

  // Try "1h 30m", "2h", "45m", "1h 30m 15s" format
  const hMatch = trimmed.match(/(\d+)\s*h/)
  const mMatch = trimmed.match(/(\d+)\s*m/)
  const sMatch = trimmed.match(/(\d+)\s*s/)

  if (hMatch || mMatch || sMatch) {
    const h = hMatch ? parseInt(hMatch[1], 10) : 0
    const m = mMatch ? parseInt(mMatch[1], 10) : 0
    const s = sMatch ? parseInt(sMatch[1], 10) : 0
    const total = h * 3600 + m * 60 + s
    return total > 0 ? total : null
  }

  // Try "HH:MM:SS" or "H:MM:SS" format
  const colonSecondsMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
  if (colonSecondsMatch) {
    const h = parseInt(colonSecondsMatch[1], 10)
    const m = parseInt(colonSecondsMatch[2], 10)
    const s = parseInt(colonSecondsMatch[3], 10)
    const total = h * 3600 + m * 60 + s
    return total > 0 ? total : null
  }

  // Try "HH:MM" or "H:MM" format
  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10)
    const m = parseInt(colonMatch[2], 10)
    const total = h * 3600 + m * 60
    return total > 0 ? total : null
  }

  return null
}
