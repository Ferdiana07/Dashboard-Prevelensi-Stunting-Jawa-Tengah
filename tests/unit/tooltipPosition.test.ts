import { describe, expect, it } from 'vitest'
import { tooltipPosition } from '../../src/lib/tooltipPosition'

const size = { width: 280, height: 260 }
describe('cursor tooltip collision handling', () => {
  it('follows the cursor with an 18px offset when there is room', () => {
    expect(tooltipPosition({ x: 100, y: 80 }, size, { width: 1000, height: 700 })).toMatchObject({ left: 118, top: 98 })
  })
  it('flips to the left near the right edge', () => {
    const result = tooltipPosition({ x: 950, y: 100 }, size, { width: 1000, height: 700 })
    expect(result.left + size.width).toBe(932)
  })
  it('flips above the cursor near the bottom edge', () => {
    const result = tooltipPosition({ x: 100, y: 650 }, size, { width: 1000, height: 700 })
    expect(result.top + size.height).toBe(632)
  })
  it('uses vertical separation when neither horizontal side fits on mobile', () => {
    const result = tooltipPosition({ x: 180, y: 300 }, size, { width: 360, height: 600 })
    expect(result.top).toBe(318)
    expect(result.left).toBeGreaterThanOrEqual(8)
    expect(result.left + size.width).toBeLessThanOrEqual(352)
  })
  it('constrains height instead of covering the cursor in a short viewport', () => {
    const result = tooltipPosition({ x: 180, y: 150 }, size, { width: 360, height: 300 })
    expect(result.maxHeight).toBe(124)
    expect(result.top).toBe(168)
  })
  it('keeps the popup on screen and the cursor outside it across viewport positions', () => {
    for (const viewport of [{ width: 320, height: 480 }, { width: 390, height: 600 }, { width: 1366, height: 650 }, { width: 1672, height: 941 }]) {
      for (const xRatio of [.01, .25, .5, .75, .99]) for (const yRatio of [.01, .25, .5, .75, .99]) {
        const anchor = { x: viewport.width * xRatio, y: viewport.height * yRatio }
        const result = tooltipPosition(anchor, size, viewport)
        const width = Math.min(size.width, viewport.width - 16)
        const height = Math.min(size.height, result.maxHeight)
        expect(result.left).toBeGreaterThanOrEqual(8)
        expect(result.top).toBeGreaterThanOrEqual(8)
        expect(result.left + width).toBeLessThanOrEqual(viewport.width - 8 + .01)
        expect(result.top + height).toBeLessThanOrEqual(viewport.height - 8 + .01)
        const clearance = Math.max(result.left - anchor.x, anchor.x - result.left - width, result.top - anchor.y, anchor.y - result.top - height)
        expect(clearance).toBeGreaterThanOrEqual(18 - .01)
      }
    }
  })
})
