// Esquema de data/*.json. Las reglas de CLAUDE.md se hacen cumplir acá:
// el validador (scripts/validate-data.ts) y la app usan este mismo esquema.
import { z } from 'zod'

export const ESTADOS = ['operando', 'en_preparacion', 'proyectado'] as const
export type Estado = (typeof ESTADOS)[number]

// Marcas de los informes Aviacion2050: V, E, P.
export const TIPOS = ['verificado', 'estimacion', 'especulacion'] as const
export type TipoDato = (typeof TIPOS)[number]

export const CONFIGURACIONES = ['multicoptero', 'sustentacion_crucero', 'rotores_basculantes'] as const
export const PORTADORES = ['bateria', 'hidrogeno', 'saf', 'hibrido'] as const

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha en formato AAAA-MM-DD')

export const Fuente = z
  .object({
    titulo: z.string().min(1),
    url: z.url({ protocol: /^https$/ }),
    // null = página sin fecha (se cita "s. f."); la fecha de consulta es obligatoria igual.
    anio: z.number().int().min(1900).max(2100).nullable(),
    consultado: fecha,
    tipo: z.enum(['primaria', 'secundaria']),
    // "lectura": se leyó la página. "buscador": se confirmó con el resumen de un buscador
    // porque la red del entorno no permitía abrirla; hay que releerla. "informe": la cita un
    // informe Aviacion2050 que la marca como verificada; no se abrió ni se buscó todavía.
    verificacion: z.enum(['lectura', 'buscador', 'informe']),
  })
  .strict()
export type Fuente = z.infer<typeof Fuente>

// Informe Aviacion2050 que produce una estimación o especulación (sin link: Drive es privado).
export const Informe = z
  .object({
    titulo: z.string().min(1),
    version: z.string().min(1),
    fecha,
    autor: z.string().min(1),
    seccion: z.string().optional(),
  })
  .strict()
export type Informe = z.infer<typeof Informe>

const base = {
  unidad: z.string().optional(),
  tipo: z.enum(TIPOS).nullable().default(null),
  fuentes: z.array(Fuente).default([]),
  informe: Informe.optional(),
  // Se muestra al público junto al valor: nivel (celda o paquete), condiciones, alcance.
  contexto: z.string().optional(),
  // Uso interno: solo aparece en el panel de revisión.
  nota: z.string().optional(),
  conflicts: z.array(z.string()).default([]),
}

function reglas(d: { valor: unknown; tipo: TipoDato | null; fuentes: Fuente[]; informe?: Informe }, ctx: z.RefinementCtx) {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message })
  if (d.valor === null) {
    if (d.tipo !== null) issue('un valor null no lleva tipo')
    return
  }
  if (d.tipo === null) issue('un valor no null necesita tipo (verificado, estimacion o especulacion)')
  if (d.tipo === 'verificado' && d.fuentes.length === 0) issue('un dato verificado necesita al menos una fuente')
  if ((d.tipo === 'estimacion' || d.tipo === 'especulacion') && !d.informe && d.fuentes.length === 0)
    issue('una estimación o especulación cita el informe que la produce')
}

// Dato<T>: { valor: T | null, tipo, fuentes, … } con las reglas de arriba.
export function dato<T extends z.ZodType, E extends z.ZodRawShape = {}>(valor: T, extra: E = {} as E) {
  return z
    .object({ valor: valor.nullable(), ...base, ...extra })
    .strict()
    .superRefine((d, ctx) => reglas(d as Parameters<typeof reglas>[0], ctx))
}

export const datoEstado = dato(z.enum(ESTADOS))

// ---- Archivos ----

export const EnergyCarriersFile = z
  .object({
    _nota: z.string(),
    portadores: z.array(
      z
        .object({
          id: z.enum(PORTADORES),
          nombre: z.string(),
          nombre_en: z.string(),
          energia_especifica: dato(z.number().positive()),
          densidad_energetica_volumetrica: dato(z.number().positive()),
          estado_uso_evtol: datoEstado,
          // Solo batería: el paquete instalado no es la celda (escena 3).
          energia_especifica_paquete: dato(z.number().positive()).optional(),
          // Escenarios de diseño para aviones de pasajeros eléctricos: energía de celda y de paquete por alcance.
          escenarios: z
            .array(z.object({ alcance_km: z.number().positive(), celda: dato(z.number().positive()), paquete: dato(z.number().positive()) }).strict())
            .optional(),
          conflicts: z.array(z.string()).default([]),
        })
        .strict(),
    ),
  })
  .strict()

const Hito = dato(z.string().min(1), { fecha })

export const VehiclesFile = z
  .object({
    _nota: z.string(),
    vehiculos: z.array(
      z
        .object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          nombre: z.string(),
          fabricante: z.string(),
          configuracion: dato(z.enum(CONFIGURACIONES)),
          asientos: dato(z.string()),
          alcance_km: dato(z.number().positive()),
          estado: datoEstado,
          certificacion: dato(z.string()),
          hitos: z.array(Hito).default([]),
          pendientes: z.array(z.string()).default([]),
        })
        .strict(),
    ),
  })
  .strict()

export const CitiesFile = z
  .object({
    _nota: z.string(),
    ciudades: z.array(
      z
        .object({
          id: z.string().regex(/^[a-z0-9_]+$/),
          nombre: z.string(),
          rol: dato(z.string()),
          estado: datoEstado,
          vertipuertos_planificados: z
            .object({
              estado: datoEstado,
              anunciado_por: dato(z.string()),
              sitios: dato(z.array(z.string()).min(1)),
              alcance: dato(z.string()),
              construidos: dato(z.number().int().nonnegative()),
              capacidad_pads: dato(z.number().int().positive()),
              fecha_inicio_obras: dato(fecha),
            })
            .strict()
            .optional(),
          // Escena 6: sitios en el mapa. Las coordenadas son [lat, lon] en grados.
          sitios_coordenadas: z
            .array(z.object({ nombre: z.string().min(1), coordenadas: dato(z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)])) }).strict())
            .optional(),
          poblacion: dato(z.number().positive()).optional(),
          densidad: dato(z.number().positive()).optional(),
          congestion: dato(z.string()).optional(),
          pendientes: z.array(z.string()).default([]),
          nota: z.string().optional(),
        })
        .strict(),
    ),
  })
  .strict()

const pct = z.number().positive().max(100)
const anio = { anio: z.number().int().min(2000).max(2100) }

// SAF: producción, mercado, mandatos y metas. Las rutas de producción se describen en
// src/content (sin cifras); acá van solo los valores con fuente o con informe.
export const SafFile = z
  .object({
    _nota: z.string(),
    produccion: z.array(
      z
        .object({ ...anio, toneladas_mt: dato(z.number().positive()), participacion_pct: dato(pct) })
        .strict(),
    ),
    capacidad_instalada_mt: dato(z.number().positive()),
    sobrecosto_musd: z.array(dato(z.number().positive(), anio)),
    precio_relativo: dato(z.string().min(1)),
    limite_mezcla_pct: dato(pct),
    rutas_certificadas: dato(z.number().int().positive()),
    trl: z.array(dato(z.string().min(1), { ruta: z.enum(['maduras', 'e_saf', 'sin_mezcla']) })),
    e_saf: z
      .object({
        capacidad_mt: dato(z.number().positive()),
        plantas_operando: dato(z.number().int().nonnegative()),
        exigido_2030_mt: dato(z.number().positive()),
      })
      .strict(),
    mandatos: z.array(
      z
        .object({
          id: z.string().regex(/^[a-z0-9_]+$/),
          region: z.string(),
          norma: z.string(),
          saf_pct: z.array(dato(pct, anio)),
          sintetico_pct: z.array(dato(pct, anio)),
          cumplimiento_pct: z.array(dato(pct, anio)),
        })
        .strict(),
    ),
    metas: z.array(
      z
        .object({
          id: z.string().regex(/^[a-z0-9_]+$/),
          organismo: z.string(),
          escenario: z.string(),
          // Un valor o un rango escrito ("entre 38 y 58"), siempre en %.
          combustibles_pct: dato(z.union([pct, z.string().min(1)])),
          pendientes: z.array(z.string()).default([]),
        })
        .strict(),
    ),
    argentina: z.object({ meta_nacional: dato(z.string().min(1)) }).strict(),
    pendientes: z.array(z.string()).default([]),
  })
  .strict()

// Mapa de tecnologías (escena 3), generado desde la Clasificación Tecnológica (informes Aviacion2050).
export const TEMAS = ['peso', 'resistencia', 'sustentacion', 'empuje', 'energia', 'operaciones', 'aerodromo'] as const
export type Tema = (typeof TEMAS)[number]
// TRL como en los informes: un valor o un rango ("4–5"); cuenta el valor más bajo.
const trl = z.string().regex(/^[1-9](–[1-9])?$/, 'TRL entre 1 y 9, o un rango como 4–5')

export const TecnologiasFile = z
  .object({
    _nota: z.string(),
    tecnologias: z.array(
      z
        .object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          nombre: z.string().min(1),
          tema: z.enum(TEMAS),
          hito: dato(z.string().min(1)),
          mueve: dato(z.string().min(1)),
          penaliza: dato(z.string().min(1)),
          trl_hoy: dato(trl),
          proyeccion: z.array(dato(trl, { anio: z.number().int().min(2026).max(2100) })),
          ventana: dato(z.string().min(1), { incertidumbre: z.string().optional(), declarada: z.string().optional() }),
        })
        .strict(),
    ),
    pendientes: z.array(z.string()).default([]),
  })
  .strict()

// Programas de propulsión (escena 5), generado desde Novedades en Propulsión.
export const FAMILIAS = ['turbofan', 'hibrido', 'rotor_abierto', 'hidrogeno', 'bateria', 'saf', 'frontera', 'otro'] as const
export const PropulsionFile = z
  .object({
    _nota: z.string(),
    programas: z.array(
      z
        .object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          nombre: z.string().min(1),
          familia: z.enum(FAMILIAS),
          hito: dato(z.string().min(1)),
          proximo: dato(z.string().min(1)),
          trl: dato(trl),
          penaliza: dato(z.string().min(1)),
        })
        .strict(),
    ),
  })
  .strict()

// Matriz de convivencia (escenas 5 y 6): vector energético dominante por segmento y año.
export const ConvivenciaFile = z
  .object({
    _nota: z.string(),
    segmentos: z.array(
      z
        .object({
          id: z.string().regex(/^[a-z0-9_]+$/),
          nombre: z.string().min(1),
          celdas: z.array(dato(z.string().min(1), { anio: z.number().int().min(2026).max(2100) })),
        })
        .strict(),
    ),
  })
  .strict()

// Aeródromo y vertipuerto (escena 6): claves de envergadura, ala plegable y normas.
const metros = z.number().positive()
export const AerodromoFile = z
  .object({
    _nota: z.string(),
    claves: z.array(z.object({ letra: z.string().regex(/^[A-F]$/), envergadura_desde_m: dato(metros), envergadura_hasta_m: dato(metros) }).strict()),
    ala_plegable: z
      .object({
        aeronave: z.string().min(1),
        envergadura_vuelo_m: dato(metros),
        envergadura_plegada_m: dato(metros),
        estado: datoEstado,
        norma: dato(z.string().min(1)),
        abierto: dato(z.string().min(1)),
      })
      .strict(),
    vertipuerto: z
      .object({
        easa_fato_d: dato(z.number().positive()),
        easa_seguridad_m: dato(metros),
        easa_seguridad_d: dato(z.number().positive()),
        easa_alcance: dato(z.string().min(1)),
        faa_mtow_lb: dato(z.number().positive()),
        faa_alcance: dato(z.string().min(1)),
        oaci: dato(z.string().min(1)),
      })
      .strict(),
    argentina: z.object({ anac_rpas: dato(z.string().min(1)), marco_evtol: dato(z.string().min(1)) }).strict(),
    pendientes: z.array(z.string()).default([]),
  })
  .strict()

export const FILES = {
  'energy_carriers.json': EnergyCarriersFile,
  'vehicles.json': VehiclesFile,
  'cities.json': CitiesFile,
  'saf.json': SafFile,
  'tecnologias.json': TecnologiasFile,
  'propulsion.json': PropulsionFile,
  'convivencia.json': ConvivenciaFile,
  'aerodromo.json': AerodromoFile,
} as const
