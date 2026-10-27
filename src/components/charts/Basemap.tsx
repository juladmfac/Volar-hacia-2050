import { useEffect, useRef } from 'react'
import { circle, type LatLon } from '../../lib/geo.ts'
import { COLOR } from '../../theme.ts'

// Mapa base con MapLibre y teselas de OpenFreeMap (escena 6). Se carga solo si el usuario lo pide
// y solo se queda si las teselas llegan: si el estilo o las teselas fallan, avisa con onFail y el
// esquema de D3 sigue siendo la versión principal.
const STYLE = 'https://tiles.openfreemap.org/styles/dark'
const TIMEOUT_MS = 10000

interface Props {
  sitios: { nombre: string; ll: LatLon }[]
  selected: number
  radioKm: number | null
  onFail: () => void
}

export default function Basemap({ sitios, selected, radioKm, onFail }: Props) {
  const el = useRef<HTMLDivElement>(null!)
  const map = useRef<import('maplibre-gl').Map | null>(null)

  useEffect(() => {
    let dead = false
    let timer = 0
    ;(async () => {
      try {
        const [{ Map, LngLatBounds, setWorkerUrl }, worker] = await Promise.all([
          import('maplibre-gl'),
          import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ])
        if (dead) return
        // El worker va como archivo propio: el bundler no sigue la ruta relativa por defecto.
        setWorkerUrl(worker.default)
        const m = new Map({ container: el.current, style: STYLE, center: [sitios[0].ll[1], sitios[0].ll[0]], zoom: 8.6, attributionControl: { compact: true } })
        map.current = m
        let tiles = false
        timer = window.setTimeout(() => !tiles && onFail(), TIMEOUT_MS)
        m.on('error', () => !tiles && onFail())
        m.on('sourcedata', (e) => {
          if ('tile' in e && e.tile) tiles = true
        })
        m.on('load', () => {
          m.addSource('sitios', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: sitios.map((s) => ({ type: 'Feature', properties: { nombre: s.nombre }, geometry: { type: 'Point', coordinates: [s.ll[1], s.ll[0]] } })) },
          })
          m.addSource('alcance', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
          m.addLayer({ id: 'alcance', type: 'line', source: 'alcance', paint: { 'line-color': COLOR.acento, 'line-width': 1.5, 'line-dasharray': [3, 2] } })
          m.addLayer({ id: 'sitios', type: 'circle', source: 'sitios', paint: { 'circle-radius': 6, 'circle-color': COLOR.tinta, 'circle-stroke-color': COLOR.noche, 'circle-stroke-width': 2 } })
          // Rótulos con las fuentes del estilo de OpenFreeMap; si no cargan, quedan solo los puntos.
          m.addLayer({
            id: 'nombres',
            type: 'symbol',
            source: 'sitios',
            layout: { 'text-field': ['get', 'nombre'], 'text-font': ['Noto Sans Regular'], 'text-size': 13, 'text-offset': [0.9, 0], 'text-anchor': 'left' },
            paint: { 'text-color': COLOR.tinta, 'text-halo-color': COLOR.noche, 'text-halo-width': 1.5 },
          })
          // El encuadre incluye el círculo de referencia de cada sitio.
          const b = new LngLatBounds()
          for (const s of sitios) for (const p of radioKm ? circle(s.ll, radioKm, 24) : [[s.ll[1], s.ll[0]] as [number, number]]) b.extend(p)
          m.fitBounds(b, { padding: 24, duration: 0 })
          draw()
        })
      } catch {
        if (!dead) onFail()
      }
    })()
    return () => {
      dead = true
      window.clearTimeout(timer)
      map.current?.remove()
      map.current = null
    }
    // Se monta una sola vez; el círculo se actualiza en el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const draw = () => {
    const m = map.current
    const src = m?.getSource('alcance') as import('maplibre-gl').GeoJSONSource | undefined
    if (!m || !src) return
    const s = sitios[selected]
    src.setData({ type: 'FeatureCollection', features: radioKm && s ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: circle(s.ll, radioKm) } }] : [] })
  }
  useEffect(draw)

  return <div ref={el} className="aspect-[640/520] w-full border hairline" aria-label="Mapa base de OpenFreeMap con los sitios anunciados" />
}
