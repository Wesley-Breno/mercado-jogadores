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

/** RN11: the contract as it would be if the player were sold now. */
export type Contract = {
  purchase_value: number
  loyalty_until: string
  remaining_days: number
  penalty_rate: number
}

export type SquadPlayer = Player & { contract: Contract }

export type ClubDetail = Club & { players: SquadPlayer[] }

export type TransactionType = 'COMPRA' | 'VENDA'

/** RN17: a line of the club history; buy and sell answer one of these plus the result fields. */
export type Transaction = {
  id: number
  club_id: number
  player_id: number
  player_name: string
  type: TransactionType
  value: number
  fee: number
  penalty: number
  profit: number | null
  cash_change: number
  created_at: string
}

export type BuyRequest = {
  club_id: number
  loyalty_until: string
}

export type Purchase = Transaction & {
  contract: { purchase_value: number; loyalty_until: string; status: 'ATIVO' }
  club_cash: number
}

export type Sale = Transaction & {
  purchase_value: number
  remaining_days: number
  penalty_rate: number
  contract_status: 'RESCINDIDO' | 'ENCERRADO'
  club_cash: number
}

export type Formation = '3-1' | '2-2' | '2-1-1' | '1-2-1'

/** RN19: the saved lineup; a starter who was sold or fell sick leaves it and `complete` turns false. */
export type Lineup = {
  club_id: number
  formation: Formation | null
  complete: boolean
  players: Player[]
}
