---
name: publicar-artifact
description: Compilar y publicar (o actualizar) la vista previa de Volar 2050 como artifact de Claude. Usar cuando haya que mostrarle al usuario la app en el link de claude.ai, después de cambios en la UI, el 3D o los datos.
---

# Publicar la vista previa como artifact

Link actual: https://claude.ai/artifact/ViNMKWwsKq5xzL8XjDE75C (privado: solo lo abre el dueño con su sesión). Publicar siempre a esa URL para no crear links nuevos.

## Por qué hay un build aparte
El visor de artifacts no sirve `.glb` y su política de seguridad bloquea WebAssembly (el decodificador meshopt) y las conexiones a `data:`. Con el build normal, el modelo del hangar no carga. Antes de que existiera `SafeBoundary`, eso dejaba toda la página en negro. `npm run build:artifact` usa la variante embebida de los modelos (ver `docs/modelo-3d.md`).

## Pasos
1. `npm run typecheck && npm test && npm run validate:data`
2. `npm run build:artifact` → escribe `dist-artifact/artifact.html` y `dist-artifact/files.json`.
3. Probar con política estricta antes de publicar:
   `node --experimental-strip-types scripts/serve-strict.ts dist-artifact 5180`
   Abrirlo con Playwright (Chromium preinstalado: `--use-angle=swiftshader --enable-unsafe-swiftshader`), recorrer las 6 escenas y revisar que no haya `pageerror` y que `#root` siga con hijos. Si queda en negro acá, también va a quedar en negro en el artifact.
4. Ver qué hay publicado: Artifact `list`, scope `files`, con la URL de arriba.
5. Publicar: Artifact `publish`
   - `file_path`: `dist-artifact/artifact.html`; `url`: la de arriba.
   - `files`: los `assets/index-*.js`, `assets/index-*.css`, `assets/Basemap-*.js` y `models/*.json` de `files.json`. Las fuentes solo hacen falta si cambiaron sus nombres.
   - Los `assets/maplibre-gl-*` no se publican: el visor bloquea las teselas de OpenFreeMap y los workers que no son `blob:`, así que el mapa base de la escena 6 no puede funcionar ahí. Sin esos archivos, el botón del mapa base cae al esquema de D3 con un aviso (probado con `serve-strict.ts`). El `Basemap-*.js` sí va: sin él, el botón rompería la página.
   - Los `assets/index-*` viejos que ya no usa la página van con `null`.
   - No pasar `icon` (es un redeploy).
6. Avisar al usuario que recargue la página (sin caché) y que el link es privado.

## Errores conocidos
- Pantalla negra: casi siempre es un error del 3D. Revisar la consola en el paso 3. Un modelo que falla debe caer al eVTOL paramétrico, no tirar la página.
- Si el publish rechaza un archivo por tipo, no forzar: el visor solo acepta tipos web estándar.
