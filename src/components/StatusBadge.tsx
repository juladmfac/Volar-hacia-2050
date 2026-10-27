import { ESTADO_LABEL, type Estado, type Field } from '../data/resolve.ts'
import SinVerificar from './SinVerificar.tsx'

// Forma y texto, no solo color: lleno = operando, medio = en preparación, vacío = proyectado.
const GLYPH: Record<Estado, { icon: string; cls: string }> = {
  operando: { icon: '●', cls: 'text-tinta' },
  en_preparacion: { icon: '◐', cls: 'text-acento' },
  proyectado: { icon: '○', cls: 'text-tenue' },
}

export default function StatusBadge({ estado }: { estado: Field<Estado> | undefined }) {
  if (!estado?.hasValue || estado.value === null) return <SinVerificar />
  const g = GLYPH[estado.value]
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.14em] uppercase ${g.cls}`}>
      <span aria-hidden>{g.icon}</span>
      {ESTADO_LABEL[estado.value]}
    </span>
  )
}
