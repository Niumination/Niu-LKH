import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'

/**
 * Accessible modal dialog with focus trap + Escape close + aria attributes.
 * @param {{open: boolean, onClose: Function, labelledBy: string, title: string, children: React.ReactNode, footer?: React.ReactNode}} props
 */
export default function Modal({ open, onClose, labelledBy, title, children, footer }) {
  const ref = useRef(null)

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      onClose?.()
      return
    }
    if (event.key !== 'Tab' || !ref.current) return
    const focusables = ref.current.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    )
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, [onClose])

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    const previous = document.activeElement
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])')?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="bg-cyber-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 id={labelledBy} className="text-white font-semibold">{title}</h3>
            <p className="text-slate-400 text-sm mt-1">{children}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {footer}
      </div>
    </div>
  )
}
