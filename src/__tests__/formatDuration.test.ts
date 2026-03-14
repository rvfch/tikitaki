import { describe, it, expect } from 'vitest'
import { formatDuration, parseDurationInput } from '../utils/formatDuration.js'

describe('formatDuration', () => {
  it('formats zero seconds', () => {
    expect(formatDuration(0)).toBe('0s')
  })

  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s')
  })

  it('formats hours, minutes, seconds', () => {
    expect(formatDuration(3661)).toBe('1h 1m 1s')
  })

  it('formats exact hour', () => {
    expect(formatDuration(3600)).toBe('1h 0m 0s')
  })

  it('formats hour with no minutes but some seconds', () => {
    expect(formatDuration(3601)).toBe('1h 0m 1s')
  })

  it('formats large values', () => {
    expect(formatDuration(86400)).toBe('24h 0m 0s')
  })

  it('handles negative values as zero', () => {
    expect(formatDuration(-10)).toBe('0s')
  })
})

describe('parseDurationInput', () => {
  it('parses h m s form with seconds', () => {
    expect(parseDurationInput('1h 30m 45s')).toBe(5445)
    expect(parseDurationInput('45s')).toBe(45)
    expect(parseDurationInput('1h 0m 1s')).toBe(3601)
  })

  it('parses HH:MM:SS form', () => {
    expect(parseDurationInput('1:30:45')).toBe(5445)
    expect(parseDurationInput('0:01:30')).toBe(90)
    expect(parseDurationInput('2:00:00')).toBe(7200)
  })

  it('parses HH:MM without seconds (unchanged)', () => {
    expect(parseDurationInput('1:30')).toBe(5400)
  })
})
