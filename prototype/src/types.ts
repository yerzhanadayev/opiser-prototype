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

/** Вкладка ОПС/РС — стр. 20 (ТЗ 2.1 п. 3.2) */
export type RiskMapOpsRecordType = 'ОПС' | 'РС'
export type RiskMapOpsStatus = 'Активный' | 'Архивный'

export interface RiskMapOpsRecord {
  id: string
  recordType: RiskMapOpsRecordType
  title: string
  description: string
  measures: string
  status: RiskMapOpsStatus
  createdAt: string
  updatedAt: string
}

/** Вкладка «Карта социальных рисков» — стр. 21–23 (ТЗ 2.1 п. 3.3; в прототипе без номера слайда в UI) */
export type RiskMapCardRecordType = 'Системный риск' | 'Очаг социальной напряжённости'
export type RiskMapCardLevel = 'Красный' | 'Оранжевый' | 'Жёлтый'

export interface RiskMapCardRecord {
  id: string
  recordType: RiskMapCardRecordType
  title: string
  description: string
  measures: string
  level: RiskMapCardLevel
  status: RiskMapOpsStatus
  createdAt: string
  updatedAt: string
}

export interface RiskMapData {
  /** Дата последнего сохранения модуля */
  updatedAt: string
  opsRecords: RiskMapOpsRecord[]
  mapRecords: RiskMapCardRecord[]
}

/**
 * Поручение ГГ — строка таблицы по ТЗ 3.1 (данные из модуля «Поручения», мок — со слайдов 24–28).
 */
export interface OrderGG {
  id: string
  /** Ключ группы для объединения ячейки «Протокол» */
  protocolKey: string
  /** Наименование протокола (как на слайде) */
  protocolTitle: string
  /** № п/п в рамках протокола */
  orderInProtocol: number
  /** Номер документа: приказ/поручение, пункт, дата */
  documentRef: string
  /** Текст содержания поручения */
  content: string
  /** Первоначальный срок (строка для отображения) */
  initialDeadline: string
  /** Текущий / предварительный срок */
  currentDeadline: string
  /** Блок исполнителей из поручения (респ./отраслевой) */
  executorsNational: string
  /** Городское управление-исполнитель */
  executorsCityDept: string
  /** Ход реализации — ответ инспектора по последнему актуальному исполнению */
  implementation: string
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

/** month = январь–тек.месяц; month_single = конкретный месяц; day = конкретный день; quarter = конкретный квартал */
export type SERPeriodType = 'month' | 'quarter' | 'day' | 'month_single'

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
