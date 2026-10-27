import Beat from '../../scroll/Beat.tsx'
import Headline from '../../scroll/Headline.tsx'
import Term from '../../components/Term.tsx'
import IllustrativeTag from '../../components/IllustrativeTag.tsx'

// Columna de texto a la izquierda, sobre un degradado; sin tarjetas.
const column = 'absolute inset-x-0 bottom-0 px-4 pb-20 sm:inset-y-0 sm:right-auto sm:flex sm:w-[min(46rem,60vw)] sm:flex-col sm:justify-center sm:px-10 sm:pb-0'

export default function Overlay1() {
  return (
    <div className="relative h-full">
      <Beat scene="s1" from={-1} to={0.2} className="scrim-bottom absolute inset-0 flex flex-col justify-end px-4 pb-24 sm:px-10 sm:pb-20">
        <p className="eyebrow">Escenario 2050 · proyecto de investigación personal</p>
        <Headline as="h1" className="display display-xl mt-4">
          Volar en 2050
        </Headline>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="lede">Nuevas tecnologías para la aviación del futuro, vistas desde las 4 fuerzas. Escenarios, no predicciones.</p>
          <p className="eyebrow">Deslizá para subir ↓</p>
        </div>
      </Beat>

      <Beat scene="s1" from={0.24} to={0.46} className={`${column} scrim-left`}>
        <p className="eyebrow">01 — El carril de arriba</p>
        <Headline className="display display-lg mt-4">El suelo ya está ocupado</Headline>
        <p className="lede mt-6">En las megaciudades, el suelo ya está repartido entre calles, vías y edificios.</p>
        <IllustrativeTag className="mt-6" detail="ciudad genérica, no representa una ciudad real" />
      </Beat>

      <Beat scene="s1" from={0.5} to={0.72} className={`${column} scrim-left`}>
        <p className="eyebrow">01 — El carril de arriba</p>
        <Headline className="display display-lg mt-4">Un carril nuevo</Headline>
        <p className="lede mt-6">
          Algunas intentan abrirlo en el <Term es="espacio aéreo bajo" en="low-altitude airspace" first />, para aeronaves
          eléctricas de despegue y aterrizaje vertical (<Term es="eVTOL" en="electric vertical take-off and landing" first />
          ).
        </p>
        <IllustrativeTag className="mt-6" detail="la altura de la capa no es un dato regulatorio" />
      </Beat>

      <Beat scene="s1" from={0.76} to={2} className={`${column} scrim-left`}>
        <p className="eyebrow">01 — El carril de arriba</p>
        <Headline className="display display-lg mt-4">No está demostrado</Headline>
        <p className="lede mt-6">Que este carril alivie el congestionamiento no está demostrado.</p>
        <p className="body-copy mt-4">
          Por eso presentamos el eVTOL como un complemento para trayectos puntuales, no como un reemplazo del transporte
          masivo.
        </p>
      </Beat>
    </div>
  )
}
