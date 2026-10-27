// Forma funcional del alcance según Breguet, normalizada (Informe v04, §1.5 y Figura 3).
// Esquema conceptual, no datos: compara la FORMA de las dos expresiones para una misma fracción
// másica f de energía sobre masa total, sin valores de ninguna aeronave. La referencia
// bibliográfica de las fórmulas sigue pendiente (docs/formulas.md).

// Con combustible el avión se aliviana al quemarlo: R ∝ ln(W0/W1) = ln[1/(1−f)].
export function alcanceCombustible(f: number): number {
  if (!(f >= 0 && f < 1)) throw new RangeError('f debe estar en [0, 1)')
  return Math.log(1 / (1 - f))
}

// Con batería la masa no cambia en vuelo: R ∝ f.
export function alcanceBateria(f: number): number {
  if (!(f >= 0 && f < 1)) throw new RangeError('f debe estar en [0, 1)')
  return f
}

// Puntos de las dos curvas entre 0 y fMax, para dibujarlas.
export function curvas(fMax = 0.6, n = 61) {
  return Array.from({ length: n }, (_, i) => {
    const f = (fMax * i) / (n - 1)
    return { f, combustible: alcanceCombustible(f), bateria: alcanceBateria(f) }
  })
}
