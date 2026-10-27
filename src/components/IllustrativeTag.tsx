// Rótulo obligatorio para todo valor o elemento ilustrativo.
export default function IllustrativeTag({ detail, className = '' }: { detail?: string; className?: string }) {
  return (
    <p className={`font-mono text-[0.6875rem] leading-snug text-ilustrativo ${className}`}>
      ◇ ilustrativo, no es dato{detail && <span className="text-ilustrativo/80"> · {detail}</span>}
    </p>
  )
}
