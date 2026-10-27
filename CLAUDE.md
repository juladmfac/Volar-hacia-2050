# Volar en 2050 — app interactiva

## Contexto
App web de scrollytelling con 3D sobre tecnologías para la aviación del futuro (escenario 2050). El eje es el combustible de aviación sostenible (SAF); el eVTOL es un complemento urbano (decisión del 26/10/2026). Es un proyecto de investigación personal de Julian Ruarte: la app no nombra grupos de trabajo, instituciones académicas ni a sus integrantes (decisión del 26/10/2026). Eje técnico: las 4 fuerzas (peso, sustentación, resistencia, empuje). Interfaz en español técnico (Argentina), con el término en inglés entre paréntesis la primera vez que aparece.

Base documental: los informes Aviacion2050 de Julian Ruarte, en Google Drive. Los más recientes son `Aviacion2050_ClasificacionTecnologica_v01_20261018` y `Aviacion2050_Informe_v04_20260910`. Si dos informes se contradicen, manda el más reciente y su sección de correcciones.

## Tono del relato
Lo que más emite en la aviación son los vuelos regionales y de larga distancia, donde la batería no alcanza por energía específica (Breguet). El SAF ya vuela mezclado en motores actuales, pero su producción está lejos de la demanda: esa brecha es el centro del relato. Nada de presentarlo como solución resuelta.

Las megaciudades no pueden ensanchar sus calles, así que algunas intentan abrir un carril nuevo: el espacio aéreo bajo. Que el eVTOL alivie la congestión NO está demostrado: se presenta como hipótesis y objetivo de las ciudades, no como resultado. Por su baja capacidad por vehículo, es un complemento para trayectos puntuales, no un reemplazo del transporte masivo. Hablar de escenarios, no de predicciones. Tono técnico y honesto, sin vender humo.

## Las 6 escenas
1. Gancho: ciudad densa de noche; la cámara asciende hasta el espacio aéreo bajo y sigue hasta las rutas de los aviones de línea, donde está la mayor parte de las emisiones.
2. Portadores de energía, con SAF como protagonista: rutas de producción (HEFA, alcohol a combustible, Fischer-Tropsch, e-SAF), límite de mezcla y la brecha entre producción y demanda. Batería, hidrógeno e híbrido como comparación.
3. Filtro de las 4 fuerzas: selector de fuerza, fase de vuelo, configuración y portador; mapa de las tecnologías con TRL ≥ 5 por fuerza (SAF incluido); Breguet combustible frente a batería como argumento central; "una celda no es un paquete".
4. Hangar: el eVTOL de cerca, con el modelo construido en Blender (`tools/blender/`, ver `docs/modelo-3d.md`): recorrido guiado y exploración libre, vistas, despiece, plano técnico y puntos con explicaciones. Es el complemento urbano. Pendiente, en segundo plano: el descenso a un vertipuerto.
5. Propulsión: turbofán con SAF, híbrido-eléctrico y eléctrico; dentro del eléctrico, el powertrain y las configuraciones del eVTOL (multicóptero, sustentación + crucero, rotores basculantes) con el modelo de Blender o el generador paramétrico de la escena 3.
6. Ciudad y aeródromo: el aeródromo como nodo de abastecimiento de SAF, alas plegables frente a las claves de aeródromo, el vertipuerto (geometría de EASA y FAA), matriz de convivencia (qué portador sirve para qué tramo), mapa esquemático con vertipuertos y círculos de alcance (mapa base de OpenFreeMap solo si cargan las teselas), slider 2030 → 2050, mini simulador de capacidad de un pad (valores que elige el usuario) y Argentina. El caso Milán de los informes queda afuera.

Prioridad de contenido: tecnologías con TRL hoy de 5 o más. Si el TRL es un rango, cuenta el valor más bajo (criterio de los informes Aviacion2050).

## Reglas de datos (no negociables)
1. NO inventar datos, cifras, nombres de programas, fechas ni fuentes. Toda cifra, fecha o estado sale de `data/*.json`.
2. Cada valor es un objeto `Dato` con dos ejes independientes:
   - `tipo` del dato, con las marcas de los informes: `verificado` (V, con fuente), `estimacion` (E, inferencia propia del autor), `especulacion` (P, prospectiva). `ilustrativo` no va en `data/`: vive en `src/illustrative/`.
   - `estado` de la tecnología o el programa, cuando corresponde: `operando`, `en_preparacion`, `proyectado`. Todo lo posterior a hoy en el slider 2030 → 2050 es `proyectado` y se ve distinto.
3. Un `verificado` lleva al menos una fuente pública (`url` https, `anio`, `consultado`, `tipo` primaria o secundaria). Una `estimacion` o `especulacion` cita el informe Aviacion2050 que la produce (sin link de Drive, que es privado). Si falta, el build falla. Si el valor es `null`, la UI muestra "sin verificar" y nunca un número estimado.
4. Preferir fuentes primarias (reguladores: CAAC, FAA, EASA, ANAC, DECEA, OACI; comunicados de empresas; publicaciones con revisión). Prensa especializada = secundaria, y se ve como tal. Las afirmaciones sobre ciudades y empresas se contrastan con más de una fuente cuando es posible.
5. Si hay contradicción entre fuentes, no elegir: registrar todas en `conflicts`.
6. Todo valor ilustrativo (para que una animación funcione) se rotula en pantalla "ilustrativo, no es dato" y no muestra números.
7. NO copiar diseños, renders, siluetas, liveries ni logos de fabricantes (Joby, Archer, EHang, Eve, etc.). Las configuraciones son arquetipos genéricos. Se puede nombrar marcas en texto como referencia factual.
8. La IA generativa NO se usa para el eVTOL ni para diagramas técnicos. Si se usa para fondos, se rotula "Ilustración conceptual generada con IA (herramienta, fecha)".

## Stack (versiones fijadas en package.json)
Vite + React 19 + TypeScript + Tailwind. 3D: three.js + React Three Fiber v9 + drei (no usar la v10 alpha de R3F), WebGL 2 (sin shaders exclusivos de WebGPU). Animación: GSAP + ScrollTrigger para scroll y cámara, Lenis para scroll suave, Motion solo para micro-interacciones de UI. Datos: Zod. Mapa: MapLibre GL con teselas de OpenFreeMap. Gráficos: D3. Cálculos: funciones puras en TypeScript con tests. Descartado: Theatre.js.

## Estructura del repo
```
data/            JSON de datos (cities, vehicles, energy_carriers, …); fuente de verdad
docs/            pendientes.md, decisiones y referencias
scripts/         validate-data.ts
src/data/        esquema Zod, resolve, load, review
src/components/  UI reutilizable (badges, tarjetas, panel de revisión)
src/illustrative/ valores inventados para animar (nunca son datos)
src/content/     textos del relato (sin cifras)
src/scroll/      secciones, bloques de texto, Lenis
src/three/       canvas, ciudad, eVTOL paramétrico, flechas de fuerza
src/scenes/      s1 … s6 (escena 3D + capa de texto)
src/lib/         cálculos (Breguet, hover)
```

## Comandos
`npm run dev` · `npm run build` · `npm run typecheck` · `npm run validate:data` · `npm test` · `npm run build:artifact` (vista previa en el visor de Claude)

Skills del repo en `.claude/skills/`: `publicar-artifact`, `cargar-dato`, `modelo-evtol`.

## Rendimiento y accesibilidad (criterio propio, no norma)
Un solo `<Canvas>` fijo, `dpr` ≤ 1,75 y calidad adaptativa (`PerformanceMonitor`). No hay tope de peso para los assets: se permiten videos, GLB y texturas pesados cuando una animación compleja lo necesite. Para que no frenen la entrada, se cargan de forma diferida y con un póster mientras tanto. Límites de las plataformas, no del proyecto: GitHub rechaza archivos de más de 100 MiB (para más grandes, Git LFS) y GitHub Pages admite hasta 1 GB por sitio. Respetar `prefers-reduced-motion`: sin Lenis ni scrubs de cámara continuos. Todo dato existe también como texto HTML. Contraste AA. Colores fijos por portador en todas las escenas.

## Fórmulas (verificar la referencia antes de publicar cifras)
- Breguet (combustible): R = (V / (g·TSFC)) · (L/D) · ln(W0/W1).
- Breguet eléctrico: R = E* · η · (1/g) · (L/D) · (m_bat / m_total).
- Hover (cantidad de movimiento): P = W^1.5 / (FM · √(2ρA)).
Cada fórmula lleva test unitario y referencia bibliográfica en `docs/`. Hasta tenerla, solo se usan en forma normalizada y rotulada como esquema conceptual.

## Forma de trabajo
- Antes de cada escena o cambio grande: proponer un plan y esperar aprobación.
- Commits chicos. Al terminar, resumir qué se hizo y qué quedó pendiente.
- Las sesiones en la nube parten de un clon limpio: todo lo que Claude deba saber tiene que estar commiteado.
- Lo pendiente de verificar vive en `docs/pendientes.md`; no se resuelve de memoria.
