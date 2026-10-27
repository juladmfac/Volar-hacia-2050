---
name: cargar-dato
description: Agregar, verificar o corregir una cifra, fecha o estado en data/*.json de Volar 2050 (vehículos, ciudades, portadores de energía), con sus fuentes y conflictos. Usar siempre que un valor nuevo vaya a aparecer en la app.
---

# Cargar un dato en `data/`

Las reglas completas están en `CLAUDE.md` (Reglas de datos) y el esquema en `src/data/schema.ts`. Esta es la receta.

## Antes de escribir
- No se carga nada de memoria. Cada valor sale de una fuente abierta en esta sesión o de un informe Aviacion2050.
- Preferir fuentes primarias: reguladores (CAAC, FAA, EASA, ANAC, DECEA, OACI), comunicados de la empresa, publicaciones con revisión. La prensa especializada es `secundaria`.
- Afirmaciones sobre ciudades y empresas: buscar una segunda fuente.
- Si dos fuentes dicen cosas distintas, no elegir: se registran todas en `conflicts`.

## Forma del `Dato`
```json
{
  "valor": 500,
  "unidad": "Wh/kg",
  "tipo": "verificado",
  "fuentes": [{
    "titulo": "Título de la página (medio, fecha)",
    "url": "https://…",
    "anio": 2026,
    "consultado": "AAAA-MM-DD",
    "tipo": "primaria",
    "verificacion": "lectura"
  }],
  "contexto": "Lo que el público tiene que saber para leerlo bien (nivel celda o paquete, condiciones).",
  "nota": "Uso interno: solo aparece en el panel ?revision=1.",
  "conflicts": []
}
```
- `tipo`: `verificado` (lleva al menos una fuente https), `estimacion` o `especulacion` (citan el informe Aviacion2050 en `informe`, sin link de Drive).
- `verificacion`: `lectura` si se abrió la página; `buscador` si solo se vio el resumen de un buscador porque la red bloqueaba el sitio. En ese caso, anotar el dominio en `docs/pendientes.md`.
- `anio: null` = página sin fecha (se cita "s. f.").
- `valor: null` = sin verificar: sin `tipo` ni fuentes. La UI muestra "sin verificar", nunca un número.
- Un estado (`operando`, `en_preparacion`, `proyectado`) es un `Dato` como cualquier otro, con su fuente.
- Comparar solo valores del mismo nivel (celda con celda, paquete con paquete). El nivel va en `contexto`.

## Después
1. `npm run validate:data`: los errores frenan el build; los avisos marcan fuentes secundarias o "a releer".
2. `npm test`
3. Actualizar `docs/pendientes.md`: borrar lo resuelto y anotar lo nuevo que quedó a medias.
4. Commit chico, que nombre el dato y la fuente.
