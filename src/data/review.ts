// Hallazgos para el panel de revisión (?revision=1) y para el validador.
// No se muestran al público: notas y pendientes pueden contener cifras sin verificar.
export interface ReviewItem {
  at: string
  tipo: 'nota' | 'pendiente' | 'conflicto' | 'solo fuente secundaria' | 'verificado vía buscador' | 'citada en los informes, sin releer' | 'estimación o especulación'
  texto: string
}

type Obj = Record<string, unknown>
const isObject = (v: unknown): v is Obj => v !== null && typeof v === 'object' && !Array.isArray(v)
const isDato = (v: Obj) => 'valor' in v
const strings = (v: unknown) => (Array.isArray(v) ? v.map(String) : [])

export function reviewItems(files: Record<string, unknown>): ReviewItem[] {
  const out: ReviewItem[] = []
  const walk = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((n, i) => walk(n, `${path}[${i}]`))
      return
    }
    if (!isObject(node)) return
    for (const k of ['_nota', 'nota'] as const) if (typeof node[k] === 'string') out.push({ at: path, tipo: 'nota', texto: node[k] as string })
    for (const p of strings(node.pendientes)) out.push({ at: path, tipo: 'pendiente', texto: p })
    for (const c of strings(node.conflicts)) out.push({ at: path, tipo: 'conflicto', texto: c })
    if (isDato(node) && node.valor !== null) {
      const fuentes = (Array.isArray(node.fuentes) ? node.fuentes : []).filter(isObject)
      if (fuentes.length > 0 && fuentes.every((f) => f.tipo === 'secundaria'))
        out.push({ at: path, tipo: 'solo fuente secundaria', texto: fuentes.map((f) => String(f.titulo)).join(' · ') })
      const porBuscador = fuentes.filter((f) => f.verificacion === 'buscador')
      if (porBuscador.length > 0)
        out.push({ at: path, tipo: 'verificado vía buscador', texto: porBuscador.map((f) => String(f.url)).join(' · ') })
      const porInforme = fuentes.filter((f) => f.verificacion === 'informe')
      if (porInforme.length > 0)
        out.push({ at: path, tipo: 'citada en los informes, sin releer', texto: porInforme.map((f) => String(f.url)).join(' · ') })
      if (node.tipo === 'estimacion' || node.tipo === 'especulacion')
        out.push({ at: path, tipo: 'estimación o especulación', texto: JSON.stringify(node.valor) })
    }
    for (const [k, v] of Object.entries(node)) if (k !== 'fuentes' && k !== 'informe') walk(v, `${path}/${k}`)
  }
  for (const [file, data] of Object.entries(files)) walk(data, file)
  return out
}
