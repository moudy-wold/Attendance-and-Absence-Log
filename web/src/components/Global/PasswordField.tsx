import { useId, useState, type InputHTMLAttributes } from 'react'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

function ErrorIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 3.75v4a.75.75 0 0 1-1.5 0v-4a.75.75 0 0 1 1.5 0zM8 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="10" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M3 3l14 14M9.17 9.18a2.5 2.5 0 0 0 3.65 3.64M7.36 5.52C8.2 5.19 9.08 5 10 5c5 0 8 6 8 6a12.5 12.5 0 0 1-2.7 3.66M5.06 6.7A12.7 12.7 0 0 0 2 10s3 6 8 6c.98 0 1.87-.19 2.67-.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PasswordField({ label, error, id, className = '', ...props }: PasswordFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div
        className={`flex h-11 items-center rounded-lg border px-3.5 transition-colors focus-within:border-neutral-900 ${
          error ? 'border-red-500' : 'border-neutral-300'
        }`}
      >
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`h-full flex-1 bg-transparent text-sm outline-none ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-neutral-400 hover:text-neutral-600"
          tabIndex={-1}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <ErrorIcon />
          {error}
        </p>
      )}
    </div>
  )
}
