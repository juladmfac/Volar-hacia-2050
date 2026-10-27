import SinVerificar from './SinVerificar.tsx'
import TipoBadge from './TipoBadge.tsx'
import ConflictNote from './ConflictNote.tsx'
import type { Cite } from './Footnotes.tsx'
import type { Field } from '../data/resolve.ts'

const format = (v: unknown) => (Array.isArray(v) ? v.join(' · ') : typeof v === 'number' ? v.toLocaleString('es-AR') : String(v))

interface DataValueProps {
  field: Field | undefined
  // "spec": cifra grande; "inline": en línea con el texto.
  variant?: 'spec' | 'inline'
  cite?: Cite
  context?: boolean
}

// Sin valor nunca muestra un número. Las fuentes se citan con números que remiten a <Footnotes>.
export default function DataValue({ field, variant = 'inline', cite, context = true }: DataValueProps) {
  if (!field?.hasValue || field.tipo === null) return <SinVerificar />
  const refs = cite ? [...new Set(field.fuentes.map(cite))].filter(Boolean) : []
  return (
    <span className="inline-flex flex-col gap-1">
      <span className={variant === 'spec' ? 'spec text-[clamp(2rem,4.2vw,3.25rem)]' : ''}>
        {format(field.value)}
        {field.unidad && (
          <span className={variant === 'spec' ? 'ml-1.5 text-[0.4em] font-normal tracking-normal text-tenue' : 'ml-1 text-tenue'}>{field.unidad}</span>
        )}
        <TipoBadge tipo={field.tipo} />
        {refs.length > 0 && <sup className="ml-0.5 font-mono text-[0.6rem] text-tenue">{refs.join(',')}</sup>}
      </span>
      {context && field.contexto && <span className="text-[0.8125rem] leading-snug text-tenue">{field.contexto}</span>}
      {context && field.informe && (
        <span className="font-mono text-[0.6875rem] text-tenue">
          {field.informe.autor}, {field.informe.titulo} {field.informe.version}, {field.informe.fecha}
        </span>
      )}
      {context && <ConflictNote conflicts={field.conflicts} />}
    </span>
  )
}
