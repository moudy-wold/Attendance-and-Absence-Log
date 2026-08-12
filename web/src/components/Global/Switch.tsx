interface SwitchProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ label, description, checked, onChange, disabled }: SwitchProps) {
  return (
    <label
      className={`flex items-center justify-between gap-4 rounded-lg border border-neutral-200 px-3.5 py-3 ${
        disabled ? 'opacity-50' : 'cursor-pointer'
      }`}
    >
      <span className="flex flex-col">
        <span className="text-sm font-medium text-neutral-800">{label}</span>
        {description && <span className="text-xs text-neutral-500">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-neutral-900' : 'bg-neutral-200'
        }`}
      >
        <span
          className={`absolute top-0.5 start-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}
