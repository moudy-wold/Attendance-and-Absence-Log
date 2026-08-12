import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supportedLanguages, type SupportedLanguage } from '../../i18n'

const labels: Record<SupportedLanguage, string> = {
  ar: 'العربية',
  tr: 'Türkçe',
  en: 'English',
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = (i18n.resolvedLanguage as SupportedLanguage) ?? 'ar'

  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function selectLanguage(lng: SupportedLanguage) {
    i18n.changeLanguage(lng)
    setIsOpen(false)
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="size-4 shrink-0 text-neutral-400"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M10 2.75c1.9 2.05 2.9 4.5 2.9 7.25s-1 5.2-2.9 7.25c-1.9-2.05-2.9-4.5-2.9-7.25S8.1 4.8 10 2.75Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path d="M2.9 10h14.2" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span>{labels[current]}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`size-3.5 shrink-0 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            d="m5 7.5 5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute end-0 top-[calc(100%+6px)] z-10 w-36 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {supportedLanguages.map((lng) => (
            <li key={lng} role="option" aria-selected={lng === current}>
              <button
                type="button"
                onClick={() => selectLanguage(lng)}
                className={`flex w-full items-center justify-between px-3 py-2 text-start text-sm transition-colors ${
                  lng === current
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {labels[lng]}
                {lng === current && (
                  <svg viewBox="0 0 20 20" fill="none" className="size-3.5 shrink-0" aria-hidden="true">
                    <path
                      d="m4 10.5 3.5 3.5L16 5.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
