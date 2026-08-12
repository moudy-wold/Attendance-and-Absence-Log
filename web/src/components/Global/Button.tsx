import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export function Button({ loading, disabled, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`flex h-11 items-center justify-center gap-2 rounded-lg bg-neutral-900 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z" />
        </svg>
      )}
      {children}
    </button>
  )
}
