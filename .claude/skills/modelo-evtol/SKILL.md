---
name: modelo-evtol
description: Regenerar o modificar el modelo 3D del eVTOL de Volar 2050 que se construye con Blender por script (tools/blender/build_evtol.py), exportado a GLB para el hangar. Usar para cambiar la geometría, los materiales, los nodos del despiece o los puntos con explicaciones.
---

# Regenerar el modelo del eVTOL

La referencia es `docs/modelo-3d.md`. Esta es la receta corta.

## Reglas
- Arquetipo genérico: no copiar diseños, siluetas, liveries ni logos de fabricantes (`CLAUDE.md`, regla 7). Nada de IA generativa para el eVTOL.
- Las proporciones son ilustrativas, sin escala; la UI lo rotula así.

## Pasos
1. Blender sin interfaz (bpy pide Python 3.13). Si no está el venv:
   ```bash
   python3.13 -m venv ~/.venvs/blender && ~/.venvs/blender/bin/pip install bpy==5.2.2
   ```
   En `bmesh`, importar `bpy` primero.
2. Editar `tools/blender/build_evtol.py`. Blender usa +X adelante y +Z arriba; el exportador glTF lo pasa a +Y arriba.
3. Revisar sin la web, con un render de Cycles:
   ```bash
   ~/.venvs/blender/bin/python tools/blender/build_evtol.py -- /tmp/evtol --preview --only rotores_basculantes
   ```
   Mirar las imágenes: cabina apoyada en el fuselaje, góndolas sobre el ala, luces pegadas a la cola.
4. Construir y comprimir: `BLENDER_PY=~/.venvs/blender/bin/python npm run model:build` → `public/models/evtol-<config>.glb`.
5. Probar en la app: `npm run dev`, escena 4. Revisar las vistas, el despiece, el plano técnico, los puntos 1 a 5, el basculado y las tres configuraciones.
6. Si se va a publicar el artifact, seguir la skill `publicar-artifact`: regenera la variante embebida.

## Contrato con la web (no romper)
- Grupos del despiece `g_fuselaje`, `g_ala`, `g_rotores`, `g_cola`, `g_energia`, `g_tren` (desplazamientos en `EXPLODE`, `src/three/hangar/HangarModel.tsx`).
- `rotor_<n>` (con el tipo de rotor), `spin_<n>` (lo que gira), `tilt_<n>` (pivote del basculado).
- Puntos `hs_cabina`, `hs_ala`, `hs_rotor`, `hs_energia`, `hs_cola`: son nodos vacíos, por eso `prune({ keepLeaves: true })`.
- El material `energia` toma el color del portador.
Si cambia un nombre, actualizar `src/three/hangar/` y `docs/modelo-3d.md` en el mismo commit.
