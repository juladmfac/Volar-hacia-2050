import { motion } from 'motion/react'

export interface Option<T extends string> {
  id: T
  label: string
  color?: string
}

export interface SelectorProps<T extends string> {
  label: string
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
}

// Control segmentado: la marca del elegido se desliza entre opciones (Motion).
export default function Selector<T extends string>({ label, options, value, onChange }: SelectorProps<T>) {
  return (
    <fieldset className="min-w-0">
      <legend className="eyebrow mb-2">{label}</legend>
      <div className="flex flex-wrap gap-px border hairline bg-linea">
        {options.map((o) => {
          const on = value === o.id
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.id)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap bg-noche px-2.5 py-2 text-[0.75rem] transition-colors ${
                on ? 'text-tinta' : 'text-tenue hover:text-tinta'
              }`}
            >
              {on && (
                <motion.span
                  layoutId={`selector-${label}`}
                  className="absolute inset-0 bg-tinta/[0.08] shadow-[inset_0_-1px_0_var(--color-tinta)]"
                  transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                />
              )}
              {o.color && (
                <span aria-hidden className="relative h-1.5 w-1.5 rounded-full" style={{ background: o.color }} />
              )}
              <span className="relative">{o.label}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

