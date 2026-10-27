// Capacidad de un pad de vertipuerto (escena 6): aritmética sobre minutos que elige el usuario.
// No es un modelo de capacidad: supone etapas en serie, sin esperas ni demoras, y un solo
// vehículo por pad a la vez. Ningún valor de entrada es dato.

export interface EtapasPad {
  aproximacion: number // min con el pad ocupado por la llegada
  desembarque: number
  carga: number // recarga o cambio de batería
  embarque: number
  salida: number // min con el pad ocupado por la salida
}

// Minutos que el pad queda ocupado por cada vehículo que llega y vuelve a salir.
export function ocupacion(e: EtapasPad): number {
  const xs = [e.aproximacion, e.desembarque, e.carga, e.embarque, e.salida]
  if (xs.some((x) => !(x >= 0) || !Number.isFinite(x))) throw new RangeError('los minutos deben ser números no negativos')
  return xs.reduce((a, b) => a + b, 0)
}

// Ciclos por hora (una llegada y una salida cada uno) con `pads` pads iguales.
export function ciclosPorHora(e: EtapasPad, pads = 1): number {
  if (!(Number.isInteger(pads) && pads >= 1)) throw new RangeError('pads debe ser un entero ≥ 1')
  const t = ocupacion(e)
  return t === 0 ? Infinity : (60 / t) * pads
}

// Dimensiones mínimas de la geometría de EASA (PTS-VPT-DSN) en función de D, el diámetro del menor
// círculo que envuelve a la aeronave. Los factores llegan desde data/aerodromo.json.
// La FATO es además al menos la dimensión que fija el manual de vuelo; eso no se calcula acá.
export function fatoMinima(d: number, factor: number): number {
  if (!(d > 0) || !(factor > 0)) throw new RangeError('d y factor deben ser positivos')
  return d * factor
}

// Ancho mínimo del área de seguridad: el mayor entre un valor fijo y una fracción de D (C.220).
export function areaSeguridad(d: number, metros: number, factor: number): number {
  if (!(d > 0) || !(metros > 0) || !(factor > 0)) throw new RangeError('d, metros y factor deben ser positivos')
  return Math.max(metros, d * factor)
}
