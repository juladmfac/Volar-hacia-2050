# Volar en 2050

Presento un relato interactivo en 3D sobre las tecnologías que pueden cambiar la aviación hacia 2050. El eje de todo esto es el combustible de aviación sostenible en ingles -Sustainable aviation fuel- por sus siglas S.A.F.: ya vuela mezclado en los motores actuales, pero su producción está muy lejos de la demanda. El eVTOL (aeronave eléctrica de despegue y aterrizaje vertical) en inglés "Electrical Vertical take off and landing" aparece como complemento urbano, no como solución.

Este es un proyecto de investigación personal mio de Ingeniería Aeroespacial. Habla de escenarios, no de predicciones: cada cifra tiene fuente, y lo que no está verificado se muestra como "sin verificar".

*Interactive 3D scrollytelling about aviation technologies toward 2050, centered on sustainable aviation fuel (SAF). Every figure in the app is sourced; unverified values are shown as such. Interface in Spanish.*

## Qué muestra

| Escena | Contenido |
| --- | --- |
| 1. El carril de arriba | Ciudad densa de noche. La cámara sube al espacio aéreo bajo y sigue hasta las rutas de los aviones de línea, donde está la mayor parte de las emisiones. |
| 2. La palanca más grande | Qué es el SAF, sus cuatro rutas de producción, el límite de mezcla y la brecha entre producción y demanda (ReFuelEU, costo, e-SAF). Batería, hidrógeno e híbrido como comparación. |
| 3. El filtro de las 4 fuerzas | Un eVTOL genérico con las flechas de peso, sustentación, resistencia y empuje. Mapa de 56 tecnologías clasificadas por nivel de madurez (TRL), Breguet con combustible frente a batería y por qué una celda no es un paquete de batería. |
| 4. El hangar | El eVTOL modelado en Blender: recorrido guiado, exploración libre, vistas, despiece y plano técnico. |
| 5. Tres formas de empujar | Turbofán con SAF, híbrido-eléctrico en serie y eléctrico de baterías; el eVTOL en corte con su cabina y las tecnologías que todavía están en laboratorio. |
| 6. El suelo decide | El aeródromo como nodo de abastecimiento de SAF, alas plegables frente a las claves de aeródromo, la geometría de un vertipuerto (EASA y FAA), un mapa de la red anunciada en São Paulo, un selector de año 2030 → 2050 y una calculadora de capacidad de un pad. |

## Cómo se trabajan los datos

La parte central del proyecto es el criterio con que se cargan los datos, más que el 3D:

- Toda cifra, fecha o estado vive en `data/*.json` y se valida con un esquema ([Zod](https://zod.dev)) antes de compilar. Si un dato no cumple las reglas, el build falla.
- Cada valor lleva su tipo: **verificado** (con fuente pública), **estimación** o **especulación** (con el informe propio que la produce). Las fuentes primarias (EASA, FAA, OACI, ANAC, comunicados de empresas) se distinguen de la prensa especializada.
- Si dos fuentes se contradicen, se muestran las dos.
- Un valor sin fuente se muestra como "sin verificar", nunca con un número de relleno.
- Todo lo que solo sirve para que una animación funcione está aparte (`src/illustrative/`) y se rotula en pantalla "ilustrativo, no es dato".
- Las configuraciones de eVTOL son arquetipos genéricos: no se copian diseños de fabricantes.

La base documental son mis informes del proyecto Aviacion2050. Lo que falta verificar está listado en [`docs/pendientes.md`](docs/pendientes.md).

## Tecnología

Vite, React 19 y TypeScript, con Tailwind. El 3D usa three.js con React Three Fiber y drei; la animación de scroll, GSAP con ScrollTrigger y Lenis. Los gráficos están hechos con D3 y el mapa con MapLibre y OpenFreeMap. El modelo del eVTOL se genera por script en Blender (`tools/blender/`) y se exporta a GLB. Los cálculos (Breguet, capacidad de un pad, geometría del mapa) son funciones puras con tests en Vitest.

## Correr el proyecto

```bash
npm install
npm run dev            # servidor local
npm test               # tests
npm run validate:data  # valida data/*.json contra el esquema
npm run typecheck
npm run build          # valida los datos y genera dist/
```

Con `?revision=1` en la URL aparece un panel con los pendientes, notas, conflictos y fuentes a releer.

## Estructura

```
data/               datos con sus fuentes (fuente de verdad)
docs/               pendientes, diseño, modelo 3D y fórmulas
scripts/            validación de datos y builds
tools/blender/      script que construye el modelo del eVTOL
tools/informes/     conversores de los informes a JSON
src/data/           esquema, carga y resolución de datos
src/components/     interfaz y gráficos
src/content/        textos del relato (sin cifras)
src/illustrative/   valores inventados para animar (no son datos)
src/lib/            cálculos con tests
src/three/          escenas 3D
src/scenes/s1…s6/   cada escena: 3D y capa de texto
```

## Autoría

Investigación, contenidos, criterios de datos y decisiones de diseño: Julian Ruarte. El código se desarrolló con asistencia de [Claude Code](https://claude.com/claude-code); las reglas que sigue están en [`CLAUDE.md`](CLAUDE.md).
