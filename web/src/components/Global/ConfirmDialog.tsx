import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>}
        <p className={`text-sm text-neutral-600 ${title ? 'mt-1' : ''}`}>{description}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            {cancelText ?? t('Cancel')}
          </button>
          <Button type="button" autoFocus onClick={onConfirm} className={variant === 'danger' ? 'bg-red-600 px-4' : 'px-4'}>
            {confirmText ?? t('Confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
