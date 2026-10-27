import { useMemo } from 'react'
import type { Field, Fuente } from '../data/resolve.ts'

export type Cite = (f: Fuente) => number

// Numera las fuentes de un bloque (sin repetir URL) para citarlas como ¹ ² ³.
export function useFootnotes(fields: (Field | undefined)[]) {
  return useMemo(() => {
    const notes: Fuente[] = []
    const index = new Map<string, number>()
    for (const f of fields) {
      for (const s of f?.fuentes ?? []) {
        if (!index.has(s.url)) {
          notes.push(s)
          index.set(s.url, notes.length)
        }
      }
    }
    const cite: Cite = (s) => index.get(s.url) ?? 0
    return { notes, cite }
    // Los campos vienen de datos estáticos: su identidad no cambia entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, fields)
}

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function Footnotes({ notes, className = '' }: { notes: Fuente[]; className?: string }) {
  if (!notes.length) return null
  return (
    <ol className={`space-y-1 font-mono text-[0.6875rem] leading-snug text-tenue ${className}`}>
      {notes.map((s, i) => (
        <li key={s.url} className="flex gap-2">
          <span className="w-3 shrink-0 text-right text-tinta">{i + 1}</span>
          <a href={s.url} target="_blank" rel="noreferrer" className="min-w-0 underline decoration-linea underline-offset-2 hover:text-tinta" title={s.titulo}>
            {host(s.url)} · {s.anio ?? 's. f.'} · {s.tipo}
            {s.verificacion === 'buscador' && <span title="Confirmada con el resumen de un buscador; falta releer la página"> · a releer</span>}
            {s.verificacion === 'informe' && <span title="La cita uno de los informes Aviacion2050 como verificada; todavía no se abrió desde este proyecto"> · citada en los informes, sin releer</span>}
          </a>
        </li>
      ))}
    </ol>
  )
}
