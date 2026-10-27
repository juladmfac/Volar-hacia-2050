// Muestra todas las versiones tal cual, sin elegir entre ellas.
export default function ConflictNote({ conflicts }: { conflicts: string[] }) {
  if (!conflicts?.length) return null
  return (
    <div className="mt-1 border-l border-saf/70 pl-2 text-[0.75rem] leading-snug text-tinta/80">
      <p className="eyebrow text-saf!">Fuentes contradictorias</p>
      <ul className="mt-0.5 space-y-0.5">
        {conflicts.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  )
}
