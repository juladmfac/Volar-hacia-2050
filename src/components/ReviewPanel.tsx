import { useState } from 'react'
import { raw } from '../data/load.ts'
import { reviewItems } from '../data/review.ts'
import { FORCES, WEIGHT_DROP, WING_SHARE } from '../illustrative/values.ts'

const items = reviewItems(raw)

// Solo con ?revision=1: pendientes, notas, conflictos, fuentes secundarias o a releer, y estimaciones.
export default function ReviewPanel() {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed right-3 bottom-3 z-40 text-xs">
      <button type="button" onClick={() => setOpen(!open)} className="rounded border border-acento bg-noche px-2 py-1 text-acento">
        Revisión ({items.length})
      </button>
      {open && (
        <div className="absolute right-0 bottom-9 max-h-[70vh] w-[min(36rem,calc(100vw-1.5rem))] overflow-y-auto rounded-lg border border-tenue/30 bg-noche p-4">
          <p className="text-tenue">Uso interno. Estos textos pueden contener cifras sin verificar: no se muestran al público.</p>
          <ul className="mt-3 space-y-2">
            {items.map((it, i) => (
              <li key={i}>
                <span className="text-acento">{it.tipo}</span> <code className="text-tenue">{it.at}</code>
                <p>{it.texto}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-ilustrativo">Valores ilustrativos en uso (src/illustrative/values.ts)</p>
          <pre className="mt-1 overflow-x-auto text-[11px] text-tenue">{JSON.stringify({ FORCES, WING_SHARE, WEIGHT_DROP }, null, 1)}</pre>
        </div>
      )}
    </div>
  )
}
