// Textos conceptuales (sin cifras). Son BORRADOR: se revisan antes de publicar.
// Toda cifra va en data/*.json, nunca acá.

import type { Configuracion, ForceId, HangarView, Hotspot, PortadorId } from '../store.ts'

export const CARRIER_TEXT: Record<PortadorId, string[]> = {
  bateria: [
    'Guarda energía en forma química y la entrega como electricidad a los motores eléctricos.',
    'Su masa prácticamente no cambia al descargarse: la aeronave aterriza con el mismo peso con el que despegó.',
  ],
  hidrogeno: [
    'Puede alimentar una pila de combustible (fuel cell) que produce electricidad para los motores, o quemarse en un motor térmico.',
    'Se almacena comprimido a alta presión o licuado a muy baja temperatura (criogénico). A medida que se consume, la masa a bordo disminuye.',
  ],
  saf: [
    'Combustible líquido producido a partir de fuentes no fósiles (por ejemplo, residuos o biomasa) o por síntesis, pensado para usarse mezclado con el queroseno de aviación (jet fuel).',
    'Se quema en un motor térmico: en una aeronave de rotores eléctricos, eso implica un esquema híbrido. A medida que se consume, la masa a bordo disminuye.',
  ],
  hibrido: [
    'Combina un motor térmico (con combustible convencional, SAF o hidrógeno) con baterías.',
    'En una de las arquitecturas posibles, el motor térmico mueve un generador y los rotores siguen siendo eléctricos.',
  ],
}

export const FORCE_TEXT: Record<ForceId, { es: string; en: string; body: string }> = {
  peso: {
    es: 'peso',
    en: 'weight',
    body: 'La fuerza con que la gravedad atrae la masa total: estructura, pasajeros, carga y el portador de energía.',
  },
  sustentacion: {
    es: 'sustentación',
    en: 'lift',
    body: 'La fuerza hacia arriba que sostiene la aeronave. En despegue vertical la generan los rotores; en crucero, si hay ala, la genera el ala.',
  },
  resistencia: {
    es: 'resistencia',
    en: 'drag',
    body: 'La fuerza que el aire opone al avance. Aparece cuando la aeronave se desplaza y crece con la velocidad.',
  },
  empuje: {
    es: 'empuje',
    en: 'thrust',
    body: 'La fuerza que generan rotores o hélices al acelerar aire. En despegue vertical, el empuje de los rotores apunta hacia arriba y cumple el papel de sustentación; en crucero, el que importa es el que apunta hacia adelante.',
  },
}

export const PHASE_TEXT = [
  {
    id: 'hover',
    es: 'despegue vertical',
    en: 'hover',
    body: 'En vuelo estacionario, la sustentación de los rotores equilibra el peso. No hay avance, así que no hay resistencia al avance ni empuje horizontal.',
  },
  {
    id: 'transicion',
    es: 'transición',
    en: 'transition',
    body: 'La aeronave acelera hacia adelante: el empuje supera a la resistencia. Si tiene ala, el ala empieza a tomar parte de la sustentación.',
  },
  {
    id: 'crucero',
    es: 'crucero',
    en: 'cruise',
    body: 'En vuelo estable, la sustentación equilibra el peso y el empuje equilibra la resistencia.',
  },
]

export const CONFIG_TEXT: Record<Configuracion, { es: string; en: string; body: string }> = {
  multicoptero: {
    es: 'multicóptero',
    en: 'multicopter',
    body: 'Sin ala: los mismos rotores dan la sustentación y, inclinando la aeronave, el empuje hacia adelante.',
  },
  sustentacion_crucero: {
    es: 'sustentación + crucero',
    en: 'lift + cruise',
    body: 'Rotores dedicados al despegue vertical y una hélice aparte para avanzar; en crucero, el ala sostiene la aeronave.',
  },
  rotores_basculantes: {
    es: 'rotores basculantes',
    en: 'tilt-rotor',
    body: 'Los mismos rotores giran de vertical a horizontal: primero sostienen, después empujan; en crucero, el ala sostiene la aeronave.',
  },
}

export const CARRIER_WEIGHT_TEXT: Record<PortadorId, string> = {
  bateria: 'Con batería, la flecha de peso no cambia durante el vuelo.',
  hidrogeno: 'Con hidrógeno, la flecha de peso se acorta a medida que se consume.',
  saf: 'Con SAF (vía un esquema híbrido), la flecha de peso se acorta a medida que se consume.',
  hibrido: 'Con un híbrido, la parte de combustible se consume y la flecha de peso se acorta; la batería no cambia su masa.',
}

// Escena 4 (hangar). Textos conceptuales, sin cifras; se indica la sección del informe.
export const HOTSPOT_TEXT: Record<Hotspot, { titulo: string; cuerpo: string; fuerza: string }> = {
  cabina: {
    titulo: 'Cabina',
    fuerza: 'resistencia',
    cuerpo: 'Puesto de piloto con panel de instrumentos y dos filas de asientos de pasajeros, con una puerta por lado (arquetipo genérico). Ese volumen fija el ancho del fuselaje, y con él buena parte de la resistencia de forma que hay que vencer en crucero.',
  },
  ala: {
    titulo: 'Ala',
    fuerza: 'sustentación',
    cuerpo: 'En crucero, el ala sostiene la aeronave: es el mecanismo más barato para sostener masa en el aire (Informe v04, §5.5). El multicóptero no la tiene y paga ese costo con potencia.',
  },
  rotor: {
    titulo: 'Rotores',
    fuerza: 'empuje',
    cuerpo: 'En despegue vertical toda la sustentación sale de los rotores. La potencia necesaria crece con la carga de disco: un rotor grande y lento consume menos que uno chico y rápido (Informe v04, §5.1).',
  },
  energia: {
    titulo: 'Paquete de energía',
    fuerza: 'peso',
    cuerpo: 'Va bajo el piso, cerca del centro de gravedad. Con batería su masa no cambia en vuelo; con combustible baja a medida que se consume, y por eso las ecuaciones de alcance son distintas (Informe v04, §1.5).',
  },
  cola: {
    titulo: 'Cola en V',
    fuerza: 'estabilidad',
    cuerpo: 'Dos superficies inclinadas cumplen la función de la deriva y del estabilizador horizontal: dan estabilidad y control en el avance.',
  },
}

export const VIEW_TEXT: Record<HangarView, string> = {
  tres_cuartos: 'tres cuartos',
  frente: 'frente',
  lateral: 'lateral',
  superior: 'planta',
  inferior: 'inferior',
}

// Escena 2: el SAF como protagonista. Sin cifras: los valores salen de data/saf.json.
export const SAF_RUTAS: { id: string; nombre: string; nombre_en: string; insumo: string }[] = [
  { id: 'hefa', nombre: 'Ésteres y ácidos grasos hidroprocesados', nombre_en: 'HEFA', insumo: 'Aceites vegetales, aceite de cocina usado y grasas animales.' },
  { id: 'atj', nombre: 'Alcohol a combustible', nombre_en: 'alcohol-to-jet, ATJ', insumo: 'Alcoholes como el etanol, obtenidos de azúcares, almidones o residuos.' },
  { id: 'ft', nombre: 'Fischer-Tropsch', nombre_en: 'FT', insumo: 'Biomasa o residuos que se gasifican y se vuelven a armar como hidrocarburos.' },
  { id: 'esaf', nombre: 'Combustible sintético con electricidad', nombre_en: 'e-SAF, power-to-liquid', insumo: 'Hidrógeno verde y CO₂ capturado, unidos con electricidad renovable.' },
]

export const SAF_TEXT = {
  queEs: [
    'Es queroseno de aviación hecho sin extraer carbono fósil nuevo. Mezclado con queroseno fósil cumple la misma especificación, así que entra en el mismo tanque y se quema en el mismo motor.',
    'Esa es su ventaja decisiva: no hace falta un avión nuevo ni un aeródromo nuevo. Es la única palanca que actúa sobre la flota que ya vuela. Y es también su límite: no mejora nada del avión, solo cambia de dónde vino el carbono.',
  ],
  rutas: 'Hay varias rutas de producción, con insumos distintos. Todas terminan en el mismo combustible.',
  mezcla: [
    'Hoy se usa mezclado con queroseno fósil, y la norma fija un tope para esa mezcla según la ruta de producción.',
    'Volar con SAF puro ya se probó en demostraciones, pero todavía no hay una especificación para uso comercial.',
  ],
  mezclaNota: 'En el tanque se mezclan; acá se separan para mostrar la proporción.',
  pedido: 'Lo que se le pide y lo que hay',
  pedidoCuerpo:
    'Los escenarios internacionales le asignan a los combustibles la mayor parte de la reducción de emisiones de la aviación al 2050. Hoy el SAF es una fracción mínima del combustible que se usa. Las dos cifras miden cosas distintas, por eso no van en la misma escala: lo que importa es la distancia entre una y otra.',
  produccion: 'La capacidad existe; la mayor parte no se usa',
  produccionCuerpo: 'La producción mundial crece, pero cada vez más despacio. Y la capacidad instalada supera varias veces lo que efectivamente se produce.',
  mandato: 'La Unión Europea ya lo exige',
  mandatoCuerpo: 'El reglamento ReFuelEU Aviation fija un mínimo de SAF en el combustible que se carga en sus aeropuertos, creciente hasta 2050. El primer año se cumplió; la pendiente que sigue es mucho más empinada.',
  costo: 'Cuesta más, y alguien lo paga',
  costoCuerpo: 'El SAF cuesta varias veces más que el combustible fósil. Ese sobreprecio lo absorben hoy las aerolíneas.',
  esaf: 'El e-SAF casi no existe todavía',
  esafCuerpo:
    'El combustible sintético no depende de cultivos ni de residuos, sino de electricidad renovable y CO₂ capturado. Por eso es la ruta que más puede crecer, y la que más lejos está: su capacidad es mínima frente a lo que ya exigen los mandatos.',
  argentina: 'Argentina: la materia prima está',
  argentinaCuerpo:
    'De todo el panorama tecnológico, el SAF es la palanca donde Argentina tiene una ventaja estructural, y la razón es agroindustrial antes que aeronáutica.',
  otras: 'Las otras tres',
  otrasCuerpo:
    'Batería, hidrógeno e híbrido-eléctrico exigen aviones nuevos y, en el caso del hidrógeno, una infraestructura que no existe a escala de aeropuerto. Sirven para tramos y segmentos acotados; la escena 3 muestra por qué.',
}

// Escena 3, fase 2: mapa de tecnologías, Breguet y celda frente a paquete. Sin cifras.
export const TEMA_TEXT: Record<'peso' | 'resistencia' | 'sustentacion' | 'empuje' | 'energia' | 'operaciones' | 'aerodromo', string> = {
  peso: 'peso',
  resistencia: 'resistencia',
  sustentacion: 'sustentación',
  empuje: 'empuje',
  energia: 'energía',
  operaciones: 'operaciones',
  aerodromo: 'aeródromo',
}

export const S3_TEXT = {
  mapa: 'Qué mueve cada tecnología',
  mapaCuerpo:
    'Cada tecnología mejora un derivado de una fuerza y paga en otra. Lo que ya está en servicio rinde poco por vuelo; lo que promete mucho llega a la década de 2030 o después. Se muestran las de madurez tecnológica (TRL) 5 o más; si el TRL es un rango, cuenta el valor más bajo.',
  mapaLeyenda:
    'El TRL de hoy es estimación del autor; la proyección y la ventana de TRL 9 son especulación prospectiva. Tocá una fila para ver el último hito verificado, qué mueve y qué penaliza.',
  breguet: 'Por qué el largo alcance sigue siendo líquido',
  breguetCuerpo: [
    'La ecuación de alcance de Breguet junta las cuatro fuerzas: sustentación y resistencia en el cociente L/D, empuje en el consumo específico y peso en el cociente de pesos.',
    'Con combustible, el avión se aliviana a medida que lo quema: cada kilo consumido baja el peso a sustentar, la resistencia inducida y el consumo. Por eso el alcance crece de forma logarítmica. Una batería descargada pesa lo mismo que una cargada: el término desaparece y el alcance crece en línea recta.',
    'Mejores baterías corren el umbral hacia distancias mayores, pero no cambian la forma de la ecuación. En medio y largo alcance queda el combustible líquido de alta densidad, y por lo tanto el SAF.',
  ],
  breguetNota: 'esquema conceptual de la forma de Breguet (Informe v04, §1.5); no muestra valores de ninguna aeronave',
  celda: 'Una celda no es un paquete',
  celdaCuerpo: [
    'La cifra de titular de una batería suele ser la de la celda. Instalada, la batería suma carcasa, gestión térmica, sistema de gestión, cableado, estructura de contención y una reserva que no se puede usar.',
    'Y el perfil de misión importa: una celda pensada para descargar despacio no entrega la potencia de un despegue sin perder energía efectiva. El eVTOL es el caso más exigente.',
  ],
  celdaEscenarios: 'Escenarios de diseño para aviones de pasajeros eléctricos: energía de paquete necesaria por alcance.',
}

// Escena 5: propulsión. Sin cifras: los valores salen de data/.
export const S5_TEXT = {
  intro: 'Tres formas de empujar',
  introCuerpo:
    'El tren de potencia (powertrain) es el camino de la energía al empuje: dónde se guarda, cómo se convierte y qué mueve el aire. Hay tres familias, y cada una sirve para segmentos distintos.',
  turbofan: 'El turbofán, con SAF',
  turbofanCuerpo: [
    'Un fan grande mueve la mayor parte del aire por fuera del núcleo; el núcleo comprime, quema el combustible y mueve las turbinas que hacen girar el fan.',
    'El SAF entra al mismo motor, mezclado con queroseno. Las mejoras de motor bajan el consumo específico (TSFC); el SAF cambia de dónde vino el carbono. Las dos palancas se suman.',
  ],
  hibrido: 'Híbrido-eléctrico en serie',
  hibridoCuerpo:
    'Un turbogenerador produce electricidad; la batería cubre los picos de potencia; un motor eléctrico mueve la hélice. En el despegue suman la batería y el generador; en crucero alcanza con el generador. Es la familia que más avanzó en 2026.',
  hibridoFase: { despegue: 'Despegue: batería y generador', crucero: 'Crucero: solo el generador' },
  electrico: 'Eléctrico de baterías',
  electricoCuerpo:
    'Sin motor térmico: la batería alimenta un inversor y el motor eléctrico. El motor eléctrico ya está certificado; el límite es la energía por kilo de la batería, y por eso hoy sirve en aviones chicos y trayectos cortos.',
  evtol: 'El eVTOL por dentro',
  evtolCuerpo:
    'El eVTOL lleva la propulsión eléctrica distribuida: muchos motores chicos en lugar de uno grande. El paquete de batería va bajo el piso de la cabina, con el piloto adelante y los pasajeros atrás. Cambiá la configuración para ver cómo se reparten los rotores.',
  horizonte: 'En el horizonte',
  horizonteCuerpo:
    'Estas tecnologías tienen hoy un nivel de madurez menor a 5: están en investigación o en laboratorio. Pueden cambiar el panorama después de 2035, pero no son parte de la flota cercana.',
  segmentos: 'Qué empuja a cada segmento',
  segmentosCuerpo:
    'Vector energético dominante por segmento, en el escenario base. El largo alcance no se mueve del combustible líquido en toda la ventana: depende de resolver el problema del SAF.',
}

// Escena 6: ciudad y aeródromo. Sin cifras: todo valor sale de data/.
export const S6_TEXT = {
  intro: 'El suelo decide',
  introCuerpo:
    'Cada tecnología de las escenas anteriores termina pidiendo algo en tierra: combustible nuevo en los tanques, potencia eléctrica para cargar, lugar para alas más largas y pads para despegar en vertical. El cuello de botella se corre al aeródromo.',
  saf: 'El aeródromo abastece',
  safCuerpo: [
    'El SAF mezclado es un combustible de reemplazo directo (drop-in): entra por la misma planta de combustible y la misma red de hidrantes que el queroseno. Lo que cambia es de dónde viene y cuánto hay.',
    'En la Unión Europea, ReFuelEU no obliga a las aerolíneas a volar con SAF sino a los proveedores de combustible a entregar una parte mínima en cada aeropuerto: la obligación cae sobre el punto de abastecimiento.',
    'En la plataforma, el rodaje con remolcador y los equipos de tierra eléctricos ya están en servicio. Bajan el combustible en tierra, pero suman otra demanda: potencia eléctrica en el aeródromo.',
  ],
  safExigido: 'Parte mínima de SAF exigida a los proveedores',
  safCumplido: 'Parte entregada, según EASA',
  alas: 'Alas que no entran',
  alasCuerpo:
    'Las alas más largas mejoran la relación sustentación-resistencia, pero el aeródromo se diseña por envergadura: calles de rodaje, separaciones y puestos tienen un ancho fijo. La respuesta de un avión de línea es plegar las punteras en tierra.',
  alasNorma: 'Qué dice la norma',
  alasAbierto: 'Lo que sigue abierto',
  vertipuerto: 'El vertipuerto',
  vertipuertoCuerpo:
    'El eVTOL no necesita pista, pero sí un pad con áreas libres alrededor. La geometría se define a partir de D, el diámetro del menor círculo que envuelve a la aeronave: el área de aproximación final y despegue (FATO), el área de seguridad que la rodea y un volumen libre de obstáculos para subir y bajar en vertical.',
  vertipuertoD: 'Probá con un D',
  vertipuertoNota:
    'La FATO puede tener que ser más grande si el manual de vuelo de la aeronave pide un procedimiento más largo o más ancho. La FAA usa otra base: relaciona la FATO con el diámetro que envuelve solo a los rotores.',
  ciudades: 'Dónde se planifica',
  ciudadesCuerpo:
    'Algunas megaciudades quieren abrir un carril nuevo en el espacio aéreo bajo porque no pueden ensanchar sus calles. Que eso alivie la congestión no está demostrado: es una hipótesis y un objetivo de esas ciudades. Este es el estado de lo anunciado, no de lo construido.',
  ciudadesMapa: 'Red anunciada en el estado de São Paulo',
  ciudadesCirculo:
    'Círculo de referencia: el alcance declarado del EH216-S, alrededor del sitio elegido. Es una regla de medida, no una ruta: ese vehículo no está anunciado para esta red.',
  ciudadesOtras: 'Otras ciudades',
  anios: '2030 → 2050',
  aniosCuerpo:
    'Mové el año. Todo lo que está después de hoy es proyectado y se ve con borde punteado. Los años sin un valor publicado quedan sin verificar: no se interpola entre normas.',
  pad: '¿Cuántos por hora?',
  padCuerpo:
    'Un pad solo atiende a un vehículo a la vez. Con los minutos de cada etapa sale cuántas llegadas y salidas caben en una hora. Cada vehículo lleva pocos pasajeros: por eso el eVTOL es un complemento para trayectos puntuales y no un reemplazo del transporte masivo.',
  padEtapas: { aproximacion: 'Aproximación', desembarque: 'Desembarque', carga: 'Carga de batería', embarque: 'Embarque', salida: 'Salida' },
  argentina: 'Argentina y lo que sigue abierto',
  argentinaCuerpo:
    'En Argentina hay reglas para aeronaves pilotadas a distancia, pero no un marco para eVTOL tripulados. Las preguntas que quedan abiertas son de ingeniería de aeródromos:',
  preguntas: [
    '¿Qué parte de la red argentina puede recibir aviones de gran envergadura con ala plegada?',
    '¿Qué red de vertipuertos haría falta, y con qué dimensión de diseño?',
    '¿Cuánta potencia eléctrica va a demandar cada aeródromo?',
    '¿Cuándo va a dejar el SAF de ser una fracción mínima del combustible?',
  ],
}
