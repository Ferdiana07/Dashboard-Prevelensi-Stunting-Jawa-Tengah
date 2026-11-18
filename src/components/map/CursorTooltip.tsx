import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { tooltipPosition, type TooltipAnchor } from '../../lib/tooltipPosition'

export function CursorTooltip({ anchor, id, children }: { anchor: TooltipAnchor; id: string; children: ReactNode }) {
  const element = useRef<HTMLDivElement>(null)
  const currentAnchor = useRef(anchor)
  const position = useCallback(() => {
    const node = element.current
    if (!node) return
    const border = node.offsetHeight - node.clientHeight
    const placement = tooltipPosition(currentAnchor.current, { width: node.offsetWidth, height: node.scrollHeight + border }, { width: window.innerWidth, height: window.innerHeight })
    node.style.left = `${placement.left}px`
    node.style.top = `${placement.top}px`
    node.style.maxHeight = `${placement.maxHeight}px`
    node.style.visibility = placement.maxHeight >= 48 ? 'visible' : 'hidden'
  }, [])

  useLayoutEffect(() => {
    currentAnchor.current = anchor
    position()
  }, [anchor, children, position])

  useLayoutEffect(() => {
    if (!element.current) return
    const observer = new ResizeObserver(position)
    observer.observe(element.current)
    return () => observer.disconnect()
  }, [position])

  return createPortal(<div ref={element} id={id} className="map-tooltip" role="tooltip" style={{ visibility: 'hidden' }}>{children}</div>, document.body)
}
