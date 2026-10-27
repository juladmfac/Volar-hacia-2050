# Dirección de arte

## Dos registros
- **Escena 1, cinematográfica:** la ciudad de noche como espectáculo. Cielo con resplandor urbano, ventanas con brillo (bloom), niebla, cámara lenta.
- **Escenas 2 en adelante, plano técnico animado:** estudio oscuro, piso de grilla técnica, materiales físicos claros con contornos finos, cifras en tipografía mono. El esquema es una decisión, no una limitación, y respeta la regla de no copiar fabricantes.

Referencia de nivel de acabado: páginas de producto aeroespacial como archer.com/midnight (fondo casi negro, titulares enormes, cifras grandes con rótulos mínimos, poca interfaz). Se toma la técnica y el nivel, no el diseño ni los assets.

## Sistema
- **Color:** `src/theme.ts` es la fuente; `src/index.css` repite los valores en `@theme` y `theme.test.ts` verifica que coincidan. Colores fijos por portador y por fuerza en todas las escenas.
- **Tipografía:** Archivo variable al 125 % de ancho, en mayúsculas, para titulares (`.display`); IBM Plex Sans para el texto; IBM Plex Mono para cifras, rótulos (`.eyebrow`) y notas. Se sirven desde el proyecto (paquetes `@fontsource`).
- **Composición:** texto en columna sobre un degradado (`.scrim-left`, `.scrim-bottom`), sin tarjetas. Cifras grandes (`DataValue variant="spec"`) con su contexto debajo.
- **Rigor sin ruido:** la marca V/E/P es un superíndice; las fuentes se citan con números que remiten a `<Footnotes>`; los rótulos de ilustrativo y de borrador viven en la leyenda única "Cómo leer".

## Render
- Postprocesado (`src/three/Effects.tsx`): bloom con umbral alto, tone mapping ACES Filmic, viñeta, grano muy leve y SMAA. `PerformanceMonitor` baja resolución y efectos si cae el rendimiento.
- Los shaders propios escriben colores en espacio lineal (el postprocesado trabaja en lineal).
- Entorno de reflejos armado en código con `Lightformer` (sin mapas descargados).

## Movimiento
- Titulares con SplitText de GSAP (palabra por palabra) cuando su bloque se vuelve visible.
- Entre escenas no hay cortes: la cámara sigue moviéndose y la escena se disuelve en niebla (`src/three/transition.ts`).
- Selectores con Motion (marca que se desliza). Con movimiento reducido: sin Lenis, sin SplitText, sin acercamientos de cámara; solo disoluciones.
