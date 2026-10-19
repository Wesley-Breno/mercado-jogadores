export type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA'
export type Condition = 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE'

export type Player = {
  id: number
  name: string
  position: Position
  agility: number
  age: number
  condition: Condition
  base_value: number
  market_value: number
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defending: number
  physical: number
  potential: number
  overall: number
  club_id: number | null
}

export type PlayerCreate = Pick<
  Player,
  | 'name'
  | 'position'
  | 'agility'
  | 'age'
  | 'pace'
  | 'shooting'
  | 'passing'
  | 'dribbling'
  | 'defending'
  | 'physical'
  | 'potential'
>

export type PlayerUpdate = Pick<Player, 'name' | 'position' | 'agility' | 'age'>

type PageMeta = {
  page: number
  limit: number
  total_items: number
  total_pages: number
}

export type PlayerPage = {
  data: Player[]
  meta: PageMeta
}

export type PlayerSort = 'name' | 'value_asc' | 'value_desc' | 'age_asc' | 'age_desc' | 'position'

export type PlayerQuery = {
  search?: string
  position?: Position
  condition?: Condition
  free?: boolean
  club_id?: number
  min_age?: number
  max_age?: number
  min_value?: string
  max_value?: string
  sort?: PlayerSort
  page?: number
  limit?: number
}

export type ClubSort = 'name' | 'net_worth_desc' | 'net_worth_asc'

export type ClubCreate = {
  name: string
  acronym: string
}

export type Club = {
  id: number
  name: string
  acronym: string
  cash: number
  squad_value: number
  net_worth: number
}
