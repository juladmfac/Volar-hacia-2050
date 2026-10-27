// Construye los modelos del eVTOL con Blender y los comprime para la web.
//   npm run model:build
// Requiere el módulo oficial de Blender para Python (bpy): ver docs/modelo-3d.md.
// BLENDER_PY apunta al Python que tiene bpy instalado (por defecto, "python3").
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
// keepLeaves: los puntos de las explicaciones (hs_*) son nodos vacíos y no se deben borrar.
import { dedup, meshopt, prune, weld } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'

const RAW = 'tools/blender/out'
const OUT = 'public/models'
const py = process.env.BLENDER_PY ?? 'python3'

mkdirSync(RAW, { recursive: true })
mkdirSync(OUT, { recursive: true })
execFileSync(py, ['tools/blender/build_evtol.py', '--', RAW], { stdio: 'inherit' })

await MeshoptEncoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })

for (const f of readdirSync(RAW).filter((f) => f.endsWith('.glb'))) {
  const doc = await io.read(join(RAW, f))
  await doc.transform(dedup(), weld(), prune({ keepLeaves: true }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }))
  await io.write(join(OUT, f), doc)
  const kb = (p: string) => Math.round(statSync(p).size / 1024)
  console.log(`${f}: ${kb(join(RAW, f))} KB → ${kb(join(OUT, f))} KB`)
}
rmSync(RAW, { recursive: true, force: true })
