# Modelo 3D del eVTOL (Blender)

El eVTOL de la escena 4 se construye con Blender por script: `tools/blender/build_evtol.py`. Es un arquetipo genérico e ilustrativo (no reproduce ningún modelo comercial ni de terceros) y las tres configuraciones salen de los mismos parámetros.

## Regenerar los modelos

1. Instalar el módulo oficial de Blender para Python (`bpy`, Blender sin interfaz). Pide Python 3.13:
   ```bash
   python3.13 -m venv ~/.venvs/blender
   ~/.venvs/blender/bin/pip install bpy==5.2.2
   ```
2. Construir y comprimir:
   ```bash
   BLENDER_PY=~/.venvs/blender/bin/python npm run model:build
   ```
   Escribe `public/models/evtol-<configuración>.glb`, comprimidos con meshopt (el decodificador viene con three.js).
3. Para revisar sin la web, el script renderiza con Cycles:
   ```bash
   ~/.venvs/blender/bin/python tools/blender/build_evtol.py -- /tmp/evtol --preview --only rotores_basculantes
   ```
   Con `--cabina` agrega dos renders de control: el interior con el casco oculto y una vista de costado.

## Qué tiene el modelo
- Fuselaje por secciones de superelipse con subdivisión (curvas suaves), en dos tonos (lomo pintado, panza grafito).
- Cabina de vidrio con marco; adentro, piso, puesto de piloto con panel, pantallas y palanca, y cuatro asientos de pasajeros en dos filas. Una puerta por lado (marco que sigue el costado del fuselaje) y ventanillas traseras. Líneas de acento luminosas y luces de navegación.
- Ala y cola en V por secciones de perfil NACA de 4 dígitos, con estrechamiento, flecha y diedro.
- Rotores con motor, aletas de refrigeración, cubo y palas torsionadas; góndolas basculantes; tren con ruedas o patines.

## Contrato con la web
Los nombres de nodos que usa `src/three/hangar/` están documentados al principio del script (grupos `g_*` del despiece, `rotor_<n>` / `spin_<n>` / `tilt_<n>`, puntos `hs_*` y el material `energia`, que toma el color del portador). Si se cambian, hay que actualizar la web.

## Variante embebida (visor de artifacts y hosts estrictos)
Algunos hosts no sirven `.glb` y aplican una política de seguridad que bloquea WebAssembly (el decodificador meshopt) y las URIs `data:`. Para esos casos:
```bash
npm run model:embed -- <carpeta>/models     # GLB sin meshopt, en base64 dentro de un JSON
VITE_MODEL_EXT=json npx vite build --outDir <carpeta>
```
Con `VITE_MODEL_EXT=json` la app lee `models/evtol-<configuración>.json` y lo decodifica sin WebAssembly ni `data:`. Si un modelo no carga igual, el hangar muestra el eVTOL paramétrico de la escena 3 y el resto de la página sigue andando (`src/three/SafeBoundary.tsx`).
