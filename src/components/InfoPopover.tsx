import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

const GAP = 6
const EDGE = 8

/** Small ⓘ button with a popover. Opens on hover (mouse only) or when pinned by click, Enter or Space.
 *  Closes on Escape (focus returns to the button), a click outside, or a second click.
 *  The popover is portalled to <body> with position: fixed, so no panel can clip or cover it,
 *  and it is clamped inside the viewport. */
export function InfoPopover({ label, children }: { label: string; children: ReactNode }) {
  const id = `info-${useId().replace(/:/g, '')}`
  const button = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  const leaveTimer = useRef<number | undefined>(undefined)
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const open = pinned || hovered

  function close() { setPinned(false); setHovered(false) }
  function enter(event: React.PointerEvent) { if (event.pointerType !== 'mouse') return; window.clearTimeout(leaveTimer.current); setHovered(true) }
  function leave(event: React.PointerEvent) { if (event.pointerType !== 'mouse') return; leaveTimer.current = window.setTimeout(() => setHovered(false), 120) }
  useEffect(() => () => window.clearTimeout(leaveTimer.current), [])

  useLayoutEffect(() => {
    if (!open) return
    function place() {
      const anchor = button.current?.getBoundingClientRect(), box = popover.current
      if (!anchor || !box) return
      const width = box.offsetWidth, height = box.offsetHeight
      const left = Math.min(Math.max(EDGE, anchor.left - 8), window.innerWidth - width - EDGE)
      const below = anchor.bottom + GAP
      const top = below + height <= window.innerHeight - EDGE ? below : Math.max(EDGE, anchor.top - GAP - height)
      setPosition({ top, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      close()
      button.current?.focus()
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node
      if (!button.current?.contains(target) && !popover.current?.contains(target)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer) }
  }, [open])

  return <>
    <button ref={button} type="button" className="info-button" aria-label={label} aria-expanded={open} aria-controls={id}
      onClick={() => { if (pinned) close(); else setPinned(true) }} onPointerEnter={enter} onPointerLeave={leave}>
      <Info size={16} aria-hidden="true" />
    </button>
    {createPortal(<div ref={popover} id={id} className="info-popover" hidden={!open} onPointerEnter={enter} onPointerLeave={leave}
      style={position ? { top: position.top, left: position.left } : { visibility: 'hidden' }}>{children}</div>, document.body)}
  </>
}
