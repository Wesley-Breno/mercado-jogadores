import { ListOrdered, Shield, Swords, Users, type LucideIcon } from 'lucide-react'

type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
}

type NavigationSection = {
  label: string
  items: NavigationItem[]
}

export const NAVIGATION: NavigationSection[] = [
  {
    label: 'Mercado',
    items: [
      { label: 'Jogadores', path: '/jogadores', icon: Users },
      { label: 'Clubes', path: '/clubes', icon: Shield },
    ],
  },
  {
    label: 'Liga',
    items: [
      { label: 'Partidas', path: '/partidas', icon: Swords },
      { label: 'Classificação', path: '/classificacao', icon: ListOrdered },
    ],
  },
]

/** Section and screen of a path, shown as the breadcrumb of the panel ("Mercado › Jogadores"). */
export function breadcrumbFor(pathname: string): string[] {
  for (const section of NAVIGATION) {
    const item = section.items.find(({ path }) => pathname.startsWith(path))
    if (item) {
      return [section.label, item.label]
    }
  }
  return []
}

/** The browser tab names the screen, or the item it shows: "Águias FC · Passe". */
export function pageTitle(breadcrumb: string[]): string {
  return `${breadcrumb.at(-1) ?? 'Página não encontrada'} · Passe`
}
