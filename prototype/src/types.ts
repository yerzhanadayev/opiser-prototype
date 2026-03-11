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
  /** Текущий период по этому показателю */
  year: number
  periodType: SERPeriodType
  periodValue: number
  updatedAt?: string
  /** Снимки за сохранённые периоды для просмотра истории */
  history?: SERIndicatorHistoryEntry[]
}

export interface SERIndicatorHistoryEntry {
  year: number
  periodType: SERPeriodType
  periodValue: number
  value1: number | string
  value2: number | string
  updatedAt: string
}

export interface SERBudgetRow {
  id: string
  name: string
  plan: number
  execution: number
  percent: number
  sharePercent?: number
}

export type SERPeriodType = 'month' | 'quarter'

export interface SERData {
  updatedAt: string
  slide29: SERIndicator[]
  slide30: SERIndicator[]
  revenues: SERBudgetRow[]
  expenses: SERBudgetRow[]
  planYear: number
  executionLabel: string
}

/** 15 функциональных групп затрат по ТЗ 4.1 п. 3.5 (коды 01–15) */
export const EXPENSE_GROUPS = [
  'Государственные услуги общего характера',
  'Оборона',
  'Общественный порядок, безопасность, правовая, судебная, уголовно-исполнительная деятельность',
  'Образование',
  'Здравоохранение',
  'Социальная помощь и социальное обеспечение',
  'Жилищно-коммунальное хозяйство',
  'Культура, спорт, туризм и информационное пространство',
  'Топливно-энергетический комплекс и недропользование',
  'Сельское, водное, лесное, рыбное хозяйство, особо охраняемые природные территории, охрана окружающей среды и животного мира, земельные отношения',
  'Промышленность, архитектурная, градостроительная и строительная деятельность',
  'Транспорт и коммуникации',
  'Прочие',
  'Обслуживание долга',
  'Трансферты',
] as const
