export type LeaderStatus = 'Активен' | 'В архиве' | 'Требует обновления'

export const CATEGORIES = [
  'Персональный состав (Заместители акима и Рукап)',
  'Персональный состав (Акимы районов)',
  'Руководители управлений',
  'Руководители департаментов',
  'Депутаты маслихата',
  'Члены общественного совета',
  'Лидеры общественного мнения',
] as const

export interface Leader {
  id: string
  category: string
  fio: string
  photo?: string
  birthDate: string
  appointmentDate: string
  position: string
  partyAffiliation?: string
  supervisedIssues: string
  characteristic: string
  additionalDescription?: string
  contacts: string[]
  updatedAt: string
  status: LeaderStatus
}

export interface Party {
  id: string
  name: string
  logo?: string
  chairman: string
  membership: number
  deputiesCount: number
  updatedAt: string
  status: LeaderStatus
}

export interface RiskMapRecord {
  id: string
  territory: string
  riskType: string
  riskLevel: string
  indicator: string
  measures: string
  slide?: number
}

export interface RiskMapData {
  period: string
  updatedAt: string
  summary20: string
  records: RiskMapRecord[]
}

export interface OrderGG {
  id: string
  number: string
  description: string
  executor: string
  deadline: string
  status: string
  lastComment: string
}

export interface SERIndicator {
  id: string
  name: string
  period1: string
  value1: number | string
  change: string
  period2: string
  value2: number | string
  unit: string
}

export interface SERBudgetRow {
  id: string
  name: string
  plan: number
  execution: number
  percent: number
}

export interface SERData {
  period: string
  updatedAt: string
  slide29: SERIndicator[]
  slide30: SERIndicator[]
  revenues: SERBudgetRow[]
  expenses: SERBudgetRow[]
}
