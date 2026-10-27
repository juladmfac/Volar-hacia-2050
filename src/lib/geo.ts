// Geometría del mapa esquemático (escena 6). Para un área de decenas de kilómetros alcanza con
// una proyección equirectangular local: el error frente a la distancia geodésica es chico a esa
// escala y el mapa no se usa para medir con precisión.

const R = 6371.0088 // radio medio de la Tierra, km (IUGG)
const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

export type LatLon = [number, number]

// Kilómetros al este (x) y al norte (y) de `origin`.
export function toLocalKm([lat, lon]: LatLon, [lat0, lon0]: LatLon): { x: number; y: number } {
  return { x: rad(lon - lon0) * Math.cos(rad(lat0)) * R, y: rad(lat - lat0) * R }
}

// Distancia de gran círculo (haversine), km.
export function distanceKm([lat1, lon1]: LatLon, [lat2, lon2]: LatLon): number {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Polígono [lon, lat] de un círculo de radio `km` (para el mapa base, en GeoJSON).
export function circle([lat, lon]: LatLon, km: number, n = 96): [number, number][] {
  const d = km / R
  const out: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const b = (i / n) * 2 * Math.PI
    const la = Math.asin(Math.sin(rad(lat)) * Math.cos(d) + Math.cos(rad(lat)) * Math.sin(d) * Math.cos(b))
    const lo = rad(lon) + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(rad(lat)), Math.cos(d) - Math.sin(rad(lat)) * Math.sin(la))
    out.push([deg(lo), deg(la)])
  }
  return out
}

// Centro de un conjunto de puntos (promedio simple; sirve para áreas chicas).
export function centroid(pts: LatLon[]): LatLon {
  const n = pts.length
  return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n]
}
