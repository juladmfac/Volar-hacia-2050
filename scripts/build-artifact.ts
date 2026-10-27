// Compila la app para el visor de artifacts de Claude:
//   npm run build:artifact -- [carpeta]   (por defecto dist-artifact/)
// - Compila con VITE_MODEL_EXT=json y cambia los .glb por la variante embebida
//   (sin WebAssembly ni URIs data:, que el visor bloquea; ver docs/modelo-3d.md).
// - Escribe artifact.html (la página que se publica: el visor le agrega el esqueleto)
//   y files.json (ruta publicada → archivo local) para el campo `files` del publish.
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const out = resolve(process.argv[2] ?? 'dist-artifact')
const run = (cmd: string, args: string[], env: Record<string, string> = {}) =>
  execFileSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } })

run('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir'], { VITE_MODEL_EXT: 'json' })
const models = join(out, 'models')
for (const f of readdirSync(models).filter((f) => f.endsWith('.glb'))) rmSync(join(models, f))
run('node', ['--experimental-strip-types', '--no-warnings=ExperimentalWarning', 'scripts/embed-models.ts', models])

const index = readFileSync(join(out, 'index.html'), 'utf8')
const css = index.match(/href="\.\/(assets\/index-[^"]+\.css)"/)?.[1]
const js = index.match(/src="\.\/(assets\/index-[^"]+\.js)"/)?.[1]
if (!css || !js) throw new Error('No encontré el CSS o el JS principal en index.html')

writeFileSync(
  join(out, 'artifact.html'),
  `<title>Volar en 2050</title>
<style>
  /* La app tiene un único aspecto nocturno: fondo y esquema oscuros explícitos. */
  :root { --noche: #05070d; color-scheme: dark; }
  html, body { background: var(--noche); }
</style>
<link rel="stylesheet" href="./${css}">
<div id="root"></div>
<script type="module" src="./${js}"></script>
`,
)

const files: Record<string, string> = {}
for (const dir of ['assets', 'models']) for (const f of readdirSync(join(out, dir))) files[`${dir}/${f}`] = join(out, dir, f)
writeFileSync(join(out, 'files.json'), JSON.stringify(files, null, 2))
console.log(`\n${out}/artifact.html → ${js}, ${css}; ${Object.keys(files).length} archivos en files.json`)
