import type { BadgeTone } from '../../components/ui/Badge'
import type { DuelAttribute, MatchResult } from '../../api/types'

export const RESULT_LABELS: Record<MatchResult, string> = {
  MANDANTE: 'Vitória do mandante',
  VISITANTE: 'Vitória do visitante',
  EMPATE: 'Empate',
}

export const RESULT_TONES: Record<MatchResult, BadgeTone> = {
  MANDANTE: 'outline',
  VISITANTE: 'outline',
  EMPATE: 'neutral',
}

export const ATTRIBUTE_LABELS: Record<DuelAttribute, string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  defending: 'Defesa',
}

export const ATTRIBUTE_SHORT_LABELS: Record<DuelAttribute, string> = {
  shooting: 'Fin',
  passing: 'Pas',
  dribbling: 'Dri',
  defending: 'Def',
}
