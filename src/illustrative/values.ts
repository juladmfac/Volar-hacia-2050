// ILUSTRATIVO — valores inventados solo para que las animaciones funcionen.
// NO son datos: no salen de data/, no se muestran como números en pantalla
// y todo elemento que los use queda bajo el rótulo "ilustrativo, no es dato".

// Escena 1: ciudad genérica (no representa ninguna ciudad real).
export const CITY = {
  seed: 2050,
  lots: 34, // lotes por lado
  lot: 10, // ancho de lote
  street: 4, // ancho de calle
  minHeight: 6,
  maxHeight: 150,
  cars: 1400,
  airspaceAltitude: 185, // capa "espacio aéreo bajo", solo para la escena
  aircraft: 4,
}

// Escena 3: magnitudes RELATIVAS de las flechas, por fase [hover, transición, crucero].
// Iguales para las tres configuraciones a propósito: la escena no compara
// eficiencias entre configuraciones, solo muestra de dónde sale cada fuerza.
export const FORCES = {
  peso: [1, 1, 1],
  sustentacion: [1, 1, 1],
  empuje: [0, 0.7, 0.5],
  resistencia: [0, 0.35, 0.5],
}

// Parte de la sustentación que genera el ala, por fase [hover, transición, crucero].
export const WING_SHARE = {
  multicoptero: [0, 0, 0],
  sustentacion_crucero: [0, 0.5, 1],
  rotores_basculantes: [0, 0.5, 1],
}

// Reducción relativa de la flecha de peso al final del crucero.
// Solo distingue "la masa no cambia" (0) de "la masa disminuye" (> 0); el valor es arbitrario.
export const WEIGHT_DROP = {
  bateria: 0,
  hidrogeno: 0.1,
  saf: 0.1,
  hibrido: 0.1,
}

// Escala visual de las flechas, en unidades de escena.
export const ARROW_SCALE = 2.4

// Escena 2: llenado del tanque de SAF. El tope de mezcla sí es dato (data/saf.json);
// estas fracciones solo arman la animación.
export const SAF_TANK = {
  fill: 0.82, // fracción del tanque con líquido
  enRutas: 0.35, // parte del tope que se alcanza mientras entran las rutas
  sinDato: 0.3, // proporción a mostrar si el tope de mezcla no tuviera dato
}

// Escena 6: punto de partida de la calculadora del pad y del vertipuerto. Son arbitrarios
// (todos iguales a propósito) y el usuario los cambia: no representan ninguna operación real.
export const PAD_INICIAL = { aproximacion: 5, desembarque: 5, carga: 5, embarque: 5, salida: 5, pads: 1 }
export const D_INICIAL = 10 // m, solo para que el cálculo de la FATO tenga un valor de arranque

// Escena 6: aeródromo genérico (no representa ningún aeropuerto real).
export const AERODROMO = { seed: 2061 }
