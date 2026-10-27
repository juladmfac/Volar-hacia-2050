// Variante de los modelos para hosts con política de seguridad estricta (el visor de
// artifacts de Claude): sin compresión meshopt (que necesita WebAssembly) y con el GLB
// entero en base64 dentro de un JSON, para no pedir URIs data: ni archivos .glb.
//   npm run model:embed -- <carpeta de salida>
// La app lo usa si se compila con VITE_MODEL_EXT=json (ver docs/modelo-3d.md).
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder } from 'meshoptimizer'

const SRC = 'public/models'
const out = process.argv[2] ?? 'dist/models'
mkdirSync(out, { recursive: true })

await MeshoptDecoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder })

for (const f of readdirSync(SRC).filter((f) => f.endsWith('.glb'))) {
  const doc = await io.read(join(SRC, f))
  for (const ext of doc.getRoot().listExtensionsUsed())
    if (ext.extensionName === 'EXT_meshopt_compression') ext.dispose()
  const glb = await io.writeBinary(doc)
  const dest = join(out, f.replace(/\.glb$/, '.json'))
  writeFileSync(dest, JSON.stringify({ glb: Buffer.from(glb).toString('base64') }))
  console.log(`${dest}: ${Math.round(glb.byteLength / 1024)} KB sin comprimir`)
}
