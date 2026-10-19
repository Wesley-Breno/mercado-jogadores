import type { BadgeTone } from '../../components/ui/Badge'
import type { Condition, PlayerSort, Position } from '../../api/types'

export const POSITION_LABELS: Record<Position, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  MEI: 'Meio-campo',
  ATA: 'Atacante',
}

export const CONDITION_LABELS: Record<Condition, string> = {
  APTO: 'Apto',
  MAL_CONDICIONADO: 'Mal condicionado',
  DOENTE: 'Doente',
}

export const CONDITION_TONES: Record<Condition, BadgeTone> = {
  APTO: 'success',
  MAL_CONDICIONADO: 'warning',
  DOENTE: 'danger',
}

export const SORT_LABELS: Record<PlayerSort, string> = {
  name: 'Nome',
  value_desc: 'Maior valor de mercado',
  value_asc: 'Menor valor de mercado',
  age_desc: 'Maior idade',
  age_asc: 'Menor idade',
  position: 'Posição (GOL a ATA)',
}

export const COMBINATION_NOTE = '“Livres” não combina com o filtro por clube.'
