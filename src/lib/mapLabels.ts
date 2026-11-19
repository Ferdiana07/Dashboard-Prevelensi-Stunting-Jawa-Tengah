import { category } from './calculations'
import { percent } from './format'
import type { StuntingRow } from '../types'

export interface Box { x: number; y: number; width: number; height: number }
export interface LabelInput {
  code: string
  text: string
  /** Region centroid in view (SVG viewBox) coordinates. */
  anchor: [number, number]
  /** Region bounding box in view coordinates. */
  bounds: Box
  /** Cities carry a marker on the centroid, so the label never sits on top of it. */
  marker: boolean
}
export interface PlacedLabel {
  code: string
  text: string
  /** Centre of the text box. */
  x: number
  y: number
  box: Box
  anchor: [number, number]
  /** Leader line end on the label edge, or null when the label sits inside its region. */
  leader: [number, number] | null
}

// Regions in the lowest prevalence category (<= target) for the rows in scope. Pure data step, no geometry.
export function lowCategoryRows(rows: StuntingRow[]) {
  return rows.filter(row => category(row.prevalence) === 'achieved')
}
export const labelText = (row: StuntingRow) => `${row.name} ${percent(row.prevalence)}`

export function textWidth(text: string, fontSize: number) { return text.length * fontSize * 0.6 }
const PAD = 3
export const overlaps = (a: Box, b: Box, gap = 0) =>
  a.x < b.x + b.width + gap && b.x < a.x + a.width + gap && a.y < b.y + b.height + gap && b.y < a.y + a.height + gap
const inside = (box: Box, frame: Box) => box.x >= frame.x && box.y >= frame.y && box.x + box.width <= frame.x + frame.width && box.y + box.height <= frame.y + frame.height
const contains = (box: Box, [x, y]: [number, number]) => x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height

// Direction order: open sea to the north first, then sideways, then south.
const DIRECTIONS: [number, number][] = [[0, -1], [0.7071, -0.7071], [-0.7071, -0.7071], [1, 0], [-1, 0], [0.7071, 0.7071], [-0.7071, 0.7071], [0, 1]]

// Places one label per input without overlapping other labels, the obstacles (inset, zoom controls) or leaving the frame.
export function layoutLabels(inputs: LabelInput[], obstacles: Box[], frame: Box, fontSize: number): PlacedLabel[] {
  const height = fontSize + PAD * 2
  const placed: PlacedLabel[] = []
  const taken: Box[] = []
  for (const input of [...inputs].sort((a, b) => a.anchor[1] - b.anchor[1] || a.code.localeCompare(b.code))) {
    const [ax, ay] = input.anchor
    if (!contains(frame, input.anchor) || obstacles.some(obstacle => contains(obstacle, input.anchor))) continue
    const width = textWidth(input.text, fontSize) + PAD * 2
    const make = (cx: number, cy: number, leader: boolean): PlacedLabel => {
      const box = { x: cx - width / 2, y: cy - height / 2, width, height }
      const end: [number, number] = [Math.min(Math.max(ax, box.x), box.x + width), Math.min(Math.max(ay, box.y), box.y + height)]
      return { code: input.code, text: input.text, x: cx, y: cy, box, anchor: input.anchor, leader: leader ? end : null }
    }
    const candidates: PlacedLabel[] = []
    if (!input.marker && input.bounds.width >= width + 4 && input.bounds.height >= height + 4) candidates.push(make(ax, ay, false))
    for (const radius of input.marker ? [14, 28, 46, 70, 100] : [22, 40, 64, 96]) {
      for (const [dx, dy] of DIRECTIONS) {
        candidates.push(make(ax + dx * radius + Math.sign(dx) * (width / 2), ay + dy * radius + Math.sign(dy) * (height / 2), true))
      }
    }
    const free = (label: PlacedLabel) => inside(label.box, frame) && !obstacles.some(obstacle => overlaps(label.box, obstacle, 2)) && !taken.some(box => overlaps(label.box, box, 2))
    const choice = candidates.find(free)
    if (!choice) continue // better no label than a label on top of something else
    placed.push(choice)
    taken.push(choice.box)
  }
  return placed
}
