// Sirve una carpeta con una política de seguridad estricta, parecida a la del visor de
// artifacts (sin WebAssembly, sin conexiones a data:), para probar antes de publicar:
//   node --experimental-strip-types scripts/serve-strict.ts dist-artifact 5180
// Si la página queda en negro acá, también va a quedar en negro en el artifact.
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? 'dist-artifact')
const port = Number(process.argv[3] ?? 5180)
const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.glb': 'model/gltf-binary',
}
const CSP = "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; font-src 'self'; worker-src blob:"

createServer((req, res) => {
  let p = decodeURIComponent((req.url ?? '/').split('?')[0])
  if (p.endsWith('/')) p += 'index.html'
  const f = join(root, p)
  if (!f.startsWith(root) || !existsSync(f) || statSync(f).isDirectory()) {
    res.writeHead(404)
    return res.end()
  }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream', 'content-security-policy': CSP })
  createReadStream(f).pipe(res)
}).listen(port, () => console.log(`${root} en http://localhost:${port} (política estricta)`))
