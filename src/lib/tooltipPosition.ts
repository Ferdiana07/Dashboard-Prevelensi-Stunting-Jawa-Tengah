export interface TooltipAnchor { x: number; y: number }
interface Size { width: number; height: number }

export function tooltipPosition(anchor: TooltipAnchor, size: Size, viewport: Size, gap = 18, padding = 8) {
  const width = Math.min(size.width, viewport.width - padding * 2)
  const height = Math.min(size.height, viewport.height - padding * 2)
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))
  const { x, y } = anchor
  const candidates = [
    { left: x + gap, top: y + gap },
    { left: x - width - gap, top: y + gap },
    { left: x + gap, top: y - height - gap },
    { left: x - width - gap, top: y - height - gap },
    { left: x + gap, top: clamp(y - height / 2, padding, viewport.height - height - padding) },
    { left: x - width - gap, top: clamp(y - height / 2, padding, viewport.height - height - padding) },
    { left: clamp(x - width / 2, padding, viewport.width - width - padding), top: y + gap },
    { left: clamp(x - width / 2, padding, viewport.width - width - padding), top: y - height - gap },
  ]
  const fits = candidates.find(position => position.left >= padding && position.top >= padding && position.left + width <= viewport.width - padding && position.top + height <= viewport.height - padding)
  if (fits) return { ...fits, maxHeight: viewport.height - padding * 2 }

  // A narrow/short viewport may not fit a full popup on either side. Use the
  // larger vertical space and constrain its height, never slide it over the cursor.
  const above = Math.max(0, y - gap - padding)
  const below = Math.max(0, viewport.height - y - gap - padding)
  const maxHeight = Math.min(height, Math.max(above, below))
  return {
    left: clamp(x - width / 2, padding, viewport.width - width - padding),
    top: below >= above ? y + gap : y - gap - maxHeight,
    maxHeight,
  }
}
