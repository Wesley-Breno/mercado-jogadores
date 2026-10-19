import { History, Shield, Trophy, Users, type LucideIcon } from 'lucide-react'

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
}

export const NAVIGATION: NavigationItem[] = [
  { label: 'Jogadores', path: '/jogadores', icon: Users },
  { label: 'Clubes', path: '/clubes', icon: Shield },
  { label: 'Partidas', path: '/partidas', icon: History },
  { label: 'Classificação', path: '/classificacao', icon: Trophy },
]
