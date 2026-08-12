import { useId, type InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
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

export function TextField({ label, error, id, className = '', ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={inputId}
        className={`h-11 rounded-lg border px-3.5 text-sm outline-none transition-colors focus:border-neutral-900 ${
          error ? 'border-red-500' : 'border-neutral-300'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <ErrorIcon />
          {error}
        </p>
      )}
    </div>
  )
}
