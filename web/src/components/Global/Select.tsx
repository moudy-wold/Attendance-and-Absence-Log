import { useId, type SelectHTMLAttributes } from 'react'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
}

export function SelectField({ label, error, id, className = '', children, ...props }: SelectFieldProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className={`h-11 w-full appearance-none rounded-lg border bg-white px-3.5 text-sm outline-none transition-colors focus:border-neutral-900 ${
            error ? 'border-red-500' : 'border-neutral-300'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute end-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        >
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
