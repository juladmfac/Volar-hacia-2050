import { TIPO_LABEL, type TipoDato } from '../data/resolve.ts'

// Marca V / E / P de los informes Aviacion2050, como superíndice.
export default function TipoBadge({ tipo }: { tipo: TipoDato }) {
  const t = TIPO_LABEL[tipo]
  return (
    <sup
      className={`ml-0.5 font-mono text-[0.6rem] font-medium ${tipo === 'verificado' ? 'text-acento' : 'text-ilustrativo'}`}
      title={t.texto}
      aria-label={t.texto}
    >
      {t.marca}
    </sup>
  )
}
