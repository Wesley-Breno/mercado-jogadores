export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-lg bg-blue-600 text-base font-bold text-white"
      >
        P
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold">Passe</span>
        <span className="block text-xs text-zinc-500">Gestão da liga</span>
      </span>
    </span>
  )
}
