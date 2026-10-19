import { History, ListOrdered, Shield, Users, type LucideIcon } from 'lucide-react'

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
}

export type NavigationSection = {
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
      { label: 'Partidas', path: '/partidas', icon: History },
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
