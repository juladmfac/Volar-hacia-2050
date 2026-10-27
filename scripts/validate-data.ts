// Valida data/*.json contra src/data/schema.ts.
// Errores (cortan el build): JSON inválido, archivo sin esquema, cualquier regla del esquema
//   (valor sin tipo, verificado sin fuente, estimación sin informe, estado o configuración
//   fuera del vocabulario, URL que no es https, fecha mal escrita).
// Avisos: datos con solo fuentes secundarias, fuentes confirmadas vía buscador y fuentes
//   citadas por un informe Aviacion2050 que todavía no se releyeron.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FILES } from '../src/data/schema.ts'
import { reviewItems } from '../src/data/review.ts'

const DIR = new URL('../data/', import.meta.url).pathname
const errors: string[] = []
const warnings: string[] = []

for (const f of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  const schema = FILES[f as keyof typeof FILES]
  if (!schema) {
    errors.push(`${f}: no tiene esquema en src/data/schema.ts`)
    continue
  }
  let data: unknown
  try {
    data = JSON.parse(readFileSync(join(DIR, f), 'utf8'))
  } catch (e) {
    errors.push(`${f}: JSON inválido (${(e as Error).message})`)
    continue
  }
  const result = schema.safeParse(data)
  if (!result.success) {
    for (const issue of result.error.issues) errors.push(`${f}:/${issue.path.join('/')} ${issue.message}`)
    continue
  }
  for (const it of reviewItems({ [f]: result.data })) {
    if (it.tipo === 'solo fuente secundaria' || it.tipo === 'verificado vía buscador' || it.tipo === 'citada en los informes, sin releer') warnings.push(`${it.at}: ${it.tipo}`)
  }
}

for (const w of warnings) console.warn(`aviso  ${w}`)
for (const e of errors) console.error(`ERROR  ${e}`)
console.log(`\n${errors.length} errores, ${warnings.length} avisos`)
process.exit(errors.length ? 1 : 0)
