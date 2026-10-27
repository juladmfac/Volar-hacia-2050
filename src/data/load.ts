import energyRaw from '@data/energy_carriers.json'
import vehiclesRaw from '@data/vehicles.json'
import citiesRaw from '@data/cities.json'
import safRaw from '@data/saf.json'
import tecnologiasRaw from '@data/tecnologias.json'
import propulsionRaw from '@data/propulsion.json'
import convivenciaRaw from '@data/convivencia.json'
import aerodromoRaw from '@data/aerodromo.json'
import { AerodromoFile, CitiesFile, ConvivenciaFile, EnergyCarriersFile, PropulsionFile, SafFile, TecnologiasFile, VehiclesFile } from './schema.ts'
import { resolveDato } from './resolve.ts'

// Se valida al cargar: un JSON que no cumple el esquema no llega a la interfaz.
const energy = EnergyCarriersFile.parse(energyRaw)
const vehiclesData = VehiclesFile.parse(vehiclesRaw)
const cities = CitiesFile.parse(citiesRaw)
const aerodromoData = AerodromoFile.parse(aerodromoRaw)
export const saf = SafFile.parse(safRaw)

// Portadores de energía normalizados para las escenas 2 y 3.
export const energyCarriers = energy.portadores.map((p) => ({
  id: p.id,
  nombre: p.nombre,
  nombre_en: p.nombre_en,
  energia_especifica: resolveDato(p.energia_especifica),
  densidad_energetica_volumetrica: resolveDato(p.densidad_energetica_volumetrica),
  estado_uso_evtol: resolveDato(p.estado_uso_evtol),
  conflicts: p.conflicts,
}))
export type EnergyCarrier = (typeof energyCarriers)[number]

// Vehículos reales: en la escena 3 aparecen solo si su configuración tiene valor.
export const vehicles = vehiclesData.vehiculos.map((v) => ({
  id: v.id,
  nombre: v.nombre,
  fabricante: v.fabricante,
  configuracion: resolveDato(v.configuracion),
  asientos: resolveDato(v.asientos),
  alcance_km: resolveDato(v.alcance_km),
  estado: resolveDato(v.estado),
  certificacion: resolveDato(v.certificacion),
  hitos: v.hitos.map((h) => ({ fecha: h.fecha, texto: resolveDato(h) })),
}))
export type Vehicle = (typeof vehicles)[number]

// Validados, para el panel de revisión (?revision=1).
export const raw = { 'energy_carriers.json': energy, 'vehicles.json': vehiclesData, 'cities.json': cities, 'saf.json': saf, 'tecnologias.json': TecnologiasFile.parse(tecnologiasRaw), 'propulsion.json': PropulsionFile.parse(propulsionRaw), 'convivencia.json': ConvivenciaFile.parse(convivenciaRaw), 'aerodromo.json': aerodromoData }

// SAF (escena 2): todo pasa por resolveDato; los null se ven como "sin verificar".
export const safData = {
  produccion: saf.produccion.map((r) => ({ anio: r.anio, toneladas: resolveDato(r.toneladas_mt), participacion: resolveDato(r.participacion_pct) })),
  capacidad: resolveDato(saf.capacidad_instalada_mt),
  sobrecosto: saf.sobrecosto_musd.map((d) => ({ anio: d.anio, valor: resolveDato(d) })),
  precioRelativo: resolveDato(saf.precio_relativo),
  limiteMezcla: resolveDato(saf.limite_mezcla_pct),
  rutasCertificadas: resolveDato(saf.rutas_certificadas),
  trl: Object.fromEntries(saf.trl.map((d) => [d.ruta, resolveDato(d)])) as Record<'maduras' | 'e_saf' | 'sin_mezcla', ReturnType<typeof resolveDato<string>>>,
  eSaf: {
    capacidad: resolveDato(saf.e_saf.capacidad_mt),
    plantas: resolveDato(saf.e_saf.plantas_operando),
    exigido2030: resolveDato(saf.e_saf.exigido_2030_mt),
  },
  mandatos: saf.mandatos.map((m) => ({
    id: m.id,
    region: m.region,
    norma: m.norma,
    saf: m.saf_pct.map((d) => ({ anio: d.anio, valor: resolveDato(d) })),
    sintetico: m.sintetico_pct.map((d) => ({ anio: d.anio, valor: resolveDato(d) })),
    cumplimiento: m.cumplimiento_pct.map((d) => ({ anio: d.anio, valor: resolveDato(d) })),
  })),
  metas: saf.metas.map((m) => ({ id: m.id, organismo: m.organismo, escenario: m.escenario, combustibles: resolveDato(m.combustibles_pct) })),
  argentina: resolveDato(saf.argentina.meta_nacional),
}

// Mapa de tecnologías (escena 3). El TRL cuenta por el valor más bajo del rango.
const tecnologiasData = TecnologiasFile.parse(tecnologiasRaw)
export const trlMin = (s: string | null) => (s ? Number(s.split('–')[0]) : null)
export const tecnologias = tecnologiasData.tecnologias.map((t) => ({
  id: t.id,
  nombre: t.nombre,
  tema: t.tema,
  hito: resolveDato(t.hito),
  mueve: resolveDato(t.mueve),
  penaliza: resolveDato(t.penaliza),
  trlHoy: resolveDato(t.trl_hoy),
  proyeccion: t.proyeccion.map((p) => ({ anio: p.anio, trl: resolveDato(p) })),
  ventana: { ...resolveDato(t.ventana), incertidumbre: t.ventana.incertidumbre ?? null, declarada: t.ventana.declarada ?? null },
}))
export type Tecnologia = (typeof tecnologias)[number]

// Batería: celda frente a paquete (escena 3).
const bat = energy.portadores.find((p) => p.id === 'bateria')
export const bateria = {
  celda: resolveDato(bat?.energia_especifica),
  paquete: resolveDato(bat?.energia_especifica_paquete),
  escenarios: (bat?.escenarios ?? []).map((e) => ({ alcanceKm: e.alcance_km, celda: resolveDato(e.celda), paquete: resolveDato(e.paquete) })),
}

// Programas de propulsión (escena 5).
export const programas = PropulsionFile.parse(propulsionRaw).programas.map((p) => ({
  id: p.id,
  nombre: p.nombre,
  familia: p.familia,
  hito: resolveDato(p.hito),
  proximo: resolveDato(p.proximo),
  trl: resolveDato(p.trl),
  penaliza: resolveDato(p.penaliza),
}))
export type Programa = (typeof programas)[number]

// Matriz de convivencia (escenas 5 y 6).
export const convivencia = ConvivenciaFile.parse(convivenciaRaw).segmentos.map((s) => ({
  id: s.id,
  nombre: s.nombre,
  celdas: s.celdas.map((c) => ({ anio: c.anio, valor: resolveDato(c) })),
}))

// Aeródromo y vertipuerto (escena 6).
const ala = aerodromoData.ala_plegable
const vp = aerodromoData.vertipuerto
export const aerodromo = {
  claves: aerodromoData.claves.map((c) => ({ letra: c.letra, desde: resolveDato(c.envergadura_desde_m), hasta: resolveDato(c.envergadura_hasta_m) })),
  ala: {
    aeronave: ala.aeronave,
    vuelo: resolveDato(ala.envergadura_vuelo_m),
    plegada: resolveDato(ala.envergadura_plegada_m),
    estado: resolveDato(ala.estado),
    norma: resolveDato(ala.norma),
    abierto: resolveDato(ala.abierto),
  },
  vertipuerto: {
    fatoD: resolveDato(vp.easa_fato_d),
    seguridadM: resolveDato(vp.easa_seguridad_m),
    seguridadD: resolveDato(vp.easa_seguridad_d),
    easa: resolveDato(vp.easa_alcance),
    faaMtow: resolveDato(vp.faa_mtow_lb),
    faa: resolveDato(vp.faa_alcance),
    oaci: resolveDato(vp.oaci),
  },
  argentina: { anac319: resolveDato(aerodromoData.argentina.anac_319), marcoEvtol: resolveDato(aerodromoData.argentina.marco_evtol) },
}

// Ciudades (escena 6): estado, sitios y coordenadas.
export const ciudades = cities.ciudades.map((c) => ({
  id: c.id,
  nombre: c.nombre,
  estado: resolveDato(c.estado),
  rol: resolveDato(c.rol),
  pendientes: c.pendientes,
  red: c.vertipuertos_planificados
    ? { estado: resolveDato(c.vertipuertos_planificados.estado), anunciadoPor: resolveDato(c.vertipuertos_planificados.anunciado_por), alcance: resolveDato(c.vertipuertos_planificados.alcance), construidos: resolveDato(c.vertipuertos_planificados.construidos) }
    : null,
  sitios: (c.sitios_coordenadas ?? []).map((s) => ({ nombre: s.nombre, coordenadas: resolveDato(s.coordenadas) })),
}))
export type Ciudad = (typeof ciudades)[number]
