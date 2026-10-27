import { useState } from 'react'
import { useUI, type SceneId } from '../store.ts'

// Qué es ilustrativo en cada escena: lo 3D nunca es dato.
const ILUSTRATIVO: Record<SceneId, string> = {
  s1: 'ciudad, tránsito y aeronaves genéricas',
  s2: 'tanque, rutas y motor esquemáticos; solo el tope de mezcla es dato',
  s3: 'aeronave genérica; largo de flechas sin escala',
  s4: 'modelo genérico; proporciones y despiece sin escala',
  s5: 'motores, cadenas de potencia y flujos esquemáticos, sin escala',
  s6: 'aeródromo, aviones y vertipuerto genéricos, sin escala',
}

// Leyenda única de lectura: reemplaza los rótulos repetidos en cada tarjeta.
export default function ReadingLegend() {
  const active = useUI((s) => s.activeScene)
  const webgl = useUI((s) => s.webgl)
  const [open, setOpen] = useState(false)
  return (
    <div
      className="fixed left-4 z-30 max-w-[calc(100vw-2rem)] font-mono text-[0.6875rem] text-tenue sm:left-6"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      {open && (
        <dl
          id="leyenda"
          className="mb-2 grid w-72 grid-cols-[1.75rem_1fr] gap-x-2 gap-y-1.5 border hairline bg-noche/95 p-3 leading-snug backdrop-blur"
        >
          <dt className="text-acento">V</dt>
          <dd>verificado con fuente pública</dd>
          <dt className="text-ilustrativo">E</dt>
          <dd>estimación propia del autor</dd>
          <dt className="text-ilustrativo">P</dt>
          <dd>especulación prospectiva</dd>
          <dt>—</dt>
          <dd>sin verificar: no hay dato con fuente</dd>
          <dt>¹²</dt>
          <dd>fuentes al pie de cada bloque; "a releer" = confirmada vía buscador</dd>
          <dt>●◐○</dt>
          <dd>operando · en preparación · proyectado</dd>
          <dt className="text-ilustrativo">◇</dt>
          <dd>ilustrativo, no es dato</dd>
          <dt>✎</dt>
          <dd>textos conceptuales en revisión</dd>
          {webgl && (
            <>
              <dt className="text-ilustrativo sm:hidden">◇</dt>
              <dd className="text-ilustrativo sm:hidden">en esta escena: {ILUSTRATIVO[active]}</dd>
            </>
          )}
        </dl>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="leyenda"
          onClick={() => setOpen(!open)}
          className="uppercase tracking-[0.16em] underline decoration-linea underline-offset-4 hover:text-tinta"
        >
          Cómo leer
        </button>
        {webgl && (
          <span className="text-ilustrativo" role="note">
            ◇ ilustrativo, no es dato<span className="hidden sm:inline"> · {ILUSTRATIVO[active]}</span>
          </span>
        )}
      </div>
    </div>
  )
}
