// Término técnico en español; con `first`, agrega el término en inglés entre paréntesis.
export default function Term({ es, en, first = false }: { es: string; en?: string; first?: boolean }) {
  return (
    <span>
      {es}
      {first && en && <span className="text-tenue"> ({en})</span>}
    </span>
  )
}
