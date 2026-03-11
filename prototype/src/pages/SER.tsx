import { useState, useMemo } from 'react'
import type { SERData, SERIndicator, SERBudgetRow, SERIndicatorHistoryEntry } from '../types'
import type { SERPeriodType } from '../types'
import { EXPENSE_GROUPS } from '../types'
import { mockExport } from '../utils/storage'

const SER_STORAGE_KEY = 'opiser_ser'

const MONTH_NAMES = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const QUARTER_ROMAN = ['I', 'II', 'III', 'IV'] as const

function getPeriodLabels(year: number, periodType: SERPeriodType, periodValue: number): { current: string; comparison: string } {
  const prevYear = year - 1
  if (periodType === 'month') {
    const monthName = MONTH_NAMES[periodValue - 1]
    return {
      current: periodValue === 1 ? `${monthName} ${year} г.` : `${MONTH_NAMES[0]}–${monthName} ${year} г.`,
      comparison: periodValue === 1 ? `${monthName} ${prevYear} г.` : `${MONTH_NAMES[0]}–${monthName} ${prevYear} г.`,
    }
  }
  const q = QUARTER_ROMAN[periodValue - 1]
  return {
    current: `${q} кв. ${year} г.`,
    comparison: `${q} кв. ${prevYear} г.`,
  }
}

function periodKey(year: number, periodType: string, periodValue: number): string {
  return `${year}_${periodType}_${periodValue}`
}

function formatHistoryLabel(entry: SERIndicatorHistoryEntry): string {
  const { current } = getPeriodLabels(entry.year, entry.periodType, entry.periodValue)
  return `${current} (${entry.updatedAt})`
}

/** Показатели, для которых рост = плохо */
const CHANGE_RED_WHEN_POSITIVE = new Set([
  'Инфляция',
  'Уровень безработицы',
  'Уровень бедности',
  'Уровень бедности (доля населения с доходом ниже прожиточного минимума)',
  'Доля расходов на продовольствие',
  'Доля расходов населения на продовольствие (в структуре расходов)',
])

function getChangeColor(indicatorName: string, changeNum: number): 'green' | 'red' {
  if (changeNum === 0) return 'red'
  const isPositive = changeNum > 0
  if (CHANGE_RED_WHEN_POSITIVE.has(indicatorName)) return isPositive ? 'red' : 'green'
  return isPositive ? 'green' : 'red'
}

/** Изменение = разница в тех же единицах (по образцу слайдов); относительный прирост не считается */
function calcChangeByUnit(value1: number | string, value2: number | string): number | '' {
  const n1 = typeof value1 === 'string' ? parseFloat(value1) : value1
  const n2 = typeof value2 === 'string' ? parseFloat(value2) : value2
  if (Number.isNaN(n1) || Number.isNaN(n2)) return ''
  return Math.round((n2 - n1) * 1000) / 1000
}

const SLIDE29_NAMES_UNITS: { name: string; unit: string }[] = [
  { name: 'ВРП (ИФО)', unit: '%' },
  { name: 'Вклад МСБ в ВРП', unit: '%' },
  { name: 'Количество активных субъектов МСБ', unit: 'тыс. ед.' },
  { name: 'Объём выпуска МСБ', unit: 'млрд тнг' },
  { name: 'Краткосрочный экономический индикатор', unit: '%' },
  { name: 'Обрабатывающая промышленность (ИФО)', unit: '%' },
  { name: 'Инвестиции в основной капитал', unit: 'млрд тнг' },
  { name: 'Валовый приток иностранных инвестиций', unit: 'млн долл.' },
]

const SLIDE30_NAMES_UNITS: { name: string; unit: string }[] = [
  { name: 'Инфляция', unit: '%' },
  { name: 'Уровень безработицы', unit: '%' },
  { name: 'Индекс реальной зарплаты', unit: '%' },
  { name: 'Медианная зарплата', unit: 'тыс. тнг' },
  { name: 'Уровень бедности (доля населения с доходом ниже прожиточного минимума)', unit: '%' },
  { name: 'Доля расходов населения на продовольствие (в структуре расходов)', unit: '%' },
]

const REVENUES_NAMES = ['Всего по доходам', 'Налоговые поступления', 'Неналоговые поступления', 'Поступления от продажи основного капитала', 'Трансферты']
/** Исполнение — на первое число месяца; год исполнения = год плана */
const EXECUTION_MONTH_OPTIONS = ['на 1 февраля', 'на 1 марта', 'на 1 апреля', 'на 1 мая', 'на 1 июня', 'на 1 июля', 'на 1 августа', 'на 1 сентября', 'на 1 октября', 'на 1 ноября', 'на 1 декабря', 'на 1 января следующего года']
const YEARS = [2024, 2025, 2026, 2027]

function defaultBudgetRows(names: string[]): SERBudgetRow[] {
  return names.map((name, i) => ({
    id: `row-${i}`,
    name,
    plan: 0,
    execution: 0,
    percent: 0,
  }))
}

function defaultExpenses(): SERBudgetRow[] {
  const total: SERBudgetRow = { id: 'exp-total', name: 'Всего по затратам', plan: 0, execution: 0, percent: 0 }
  const groups = EXPENSE_GROUPS.map((name, i) => ({
    id: `exp-${i}`,
    name,
    plan: 0,
    execution: 0,
    percent: 0,
    sharePercent: 0,
  }))
  return [total, ...groups]
}

function createIndicator(slide: 's29' | 's30', i: number, item: { name: string; unit: string }): SERIndicator {
  const year = 2025
  const periodType: SERPeriodType = 'month'
  const periodValue = 9
  const { current, comparison } = getPeriodLabels(year, periodType, periodValue)
  return {
    id: `${slide}-${i}`,
    name: item.name,
    period1: comparison,
    period2: current,
    value1: '',
    value2: '',
    change: '',
    unit: item.unit,
    year,
    periodType,
    periodValue,
    history: [],
  }
}

function loadSER(): SERData {
  try {
    const raw = localStorage.getItem(SER_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SERData & { year?: number; periodType?: SERPeriodType; periodValue?: number }
      if (parsed.slide29?.length && parsed.expenses?.length) {
        const globalYear = parsed.year ?? 2025
        const globalPeriodType = parsed.periodType ?? 'month'
        const globalPeriodValue = parsed.periodValue ?? 9
        const slide29 = parsed.slide29.map((ind: SERIndicator) => ({
          ...ind,
          year: ind.year ?? globalYear,
          periodType: ind.periodType ?? globalPeriodType,
          periodValue: ind.periodValue ?? globalPeriodValue,
          history: ind.history ?? [],
        }))
        const slide30 = parsed.slide30.map((ind: SERIndicator) => ({
          ...ind,
          year: ind.year ?? globalYear,
          periodType: ind.periodType ?? globalPeriodType,
          periodValue: ind.periodValue ?? globalPeriodValue,
          history: ind.history ?? [],
        }))
        return {
          updatedAt: parsed.updatedAt ?? '',
          slide29,
          slide30,
          revenues: parsed.revenues ?? defaultBudgetRows(REVENUES_NAMES),
          expenses: parsed.expenses.length > 1 ? parsed.expenses : defaultExpenses(),
          planYear: parsed.planYear ?? 2025,
          executionLabel: EXECUTION_MONTH_OPTIONS.includes(parsed.executionLabel as string) ? parsed.executionLabel : EXECUTION_MONTH_OPTIONS[0],
        }
      }
    }
  } catch {}
  return {
    updatedAt: '',
    slide29: SLIDE29_NAMES_UNITS.map((item, i) => createIndicator('s29', i, item)),
    slide30: SLIDE30_NAMES_UNITS.map((item, i) => createIndicator('s30', i, item)),
    revenues: defaultBudgetRows(REVENUES_NAMES),
    expenses: defaultExpenses(),
    planYear: 2025,
    executionLabel: EXECUTION_MONTH_OPTIONS[0],
  }
}

function saveSER(data: SERData) {
  const updatedAt = new Date().toISOString().slice(0, 10)
  const next = { ...data, updatedAt }
  next.slide29 = next.slide29.map((ind) => {
    const key = periodKey(ind.year, ind.periodType, ind.periodValue)
    const history = ind.history ?? []
    const existing = history.findIndex((h) => periodKey(h.year, h.periodType, h.periodValue) === key)
    const entry: SERIndicatorHistoryEntry = {
      year: ind.year,
      periodType: ind.periodType,
      periodValue: ind.periodValue,
      value1: ind.value1,
      value2: ind.value2,
      updatedAt,
    }
    const newHistory = existing >= 0 ? [...history.slice(0, existing), entry, ...history.slice(existing + 1)] : [...history, entry]
    return { ...ind, updatedAt, history: newHistory }
  })
  next.slide30 = next.slide30.map((ind) => {
    const key = periodKey(ind.year, ind.periodType, ind.periodValue)
    const history = ind.history ?? []
    const existing = history.findIndex((h) => periodKey(h.year, h.periodType, h.periodValue) === key)
    const entry: SERIndicatorHistoryEntry = {
      year: ind.year,
      periodType: ind.periodType,
      periodValue: ind.periodValue,
      value1: ind.value1,
      value2: ind.value2,
      updatedAt,
    }
    const newHistory = existing >= 0 ? [...history.slice(0, existing), entry, ...history.slice(existing + 1)] : [...history, entry]
    return { ...ind, updatedAt, history: newHistory }
  })
  localStorage.setItem(SER_STORAGE_KEY, JSON.stringify(next))
}

function calcPercent(plan: number, execution: number): number {
  if (!plan) return 0
  return Math.round((execution / plan) * 1000) / 10
}

function IndicatorRow({
  indicator,
  onUpdate,
  years,
}: {
  indicator: SERIndicator
  onUpdate: (id: string, field: keyof SERIndicator, value: number | string) => void
  years: number[]
}) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState<SERIndicatorHistoryEntry | null>(null)
  const labels = useMemo(() => getPeriodLabels(indicator.year, indicator.periodType, indicator.periodValue), [indicator.year, indicator.periodType, indicator.periodValue])
  const changeVal = calcChangeByUnit(indicator.value1, indicator.value2)
  const changeColor = changeVal !== '' ? getChangeColor(indicator.name, changeVal) : null
  const history = indicator.history ?? []

  return (
    <tr key={indicator.id}>
      <td>{indicator.name}</td>
      <td>
        <select value={indicator.year} onChange={(e) => onUpdate(indicator.id, 'year', Number(e.target.value))} style={{ width: 72, padding: 4 }}>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </td>
      <td>
        <select value={indicator.periodType} onChange={(e) => onUpdate(indicator.id, 'periodType', e.target.value)} style={{ width: 70, padding: 4 }}>
          <option value="month">Месяц</option>
          <option value="quarter">Квартал</option>
        </select>
        {indicator.periodType === 'month' ? (
          <select value={indicator.periodValue} onChange={(e) => onUpdate(indicator.id, 'periodValue', Number(e.target.value))} style={{ width: 100, marginLeft: 4, padding: 4 }}>
            {MONTH_NAMES.map((_, i) => (
              <option key={i} value={i + 1}>{MONTH_NAMES[i]}</option>
            ))}
          </select>
        ) : (
          <select value={indicator.periodValue} onChange={(e) => onUpdate(indicator.id, 'periodValue', Number(e.target.value))} style={{ width: 60, marginLeft: 4, padding: 4 }}>
            {QUARTER_ROMAN.map((q, i) => (
              <option key={q} value={i + 1}>{q} кв.</option>
            ))}
          </select>
        )}
      </td>
      <td>{labels.comparison}</td>
      <td>
        <input type="text" value={String(indicator.value1)} onChange={(e) => onUpdate(indicator.id, 'value1', e.target.value)} style={{ width: 80, border: '1px solid var(--border)', borderRadius: 4, padding: 4 }} />
      </td>
      <td className={changeColor ? `ser-change-${changeColor}` : ''} style={{ minWidth: 64 }}>
        {changeVal !== '' ? (indicator.unit === '%' ? `${changeVal}%` : changeVal) : '—'}
      </td>
      <td>{labels.current}</td>
      <td>
        <input type="text" value={String(indicator.value2)} onChange={(e) => onUpdate(indicator.id, 'value2', e.target.value)} style={{ width: 80, border: '1px solid var(--border)', borderRadius: 4, padding: 4 }} />
      </td>
      <td>{indicator.unit}</td>
      <td>
        <div style={{ position: 'relative' }}>
          <button type="button" className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => setHistoryOpen(!historyOpen)}>
            История
          </button>
          {historyOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setHistoryOpen(false)} />
              <div style={{ position: 'absolute', left: 0, top: '100%', marginTop: 4, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 11, minWidth: 220, maxHeight: 280, overflow: 'auto' }}>
                {history.length === 0 ? (
                  <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>Нет сохранённых периодов</div>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 8 }}>
                    {[...history].reverse().map((entry, idx) => (
                      <li key={idx}>
                        <button type="button" style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', background: selectedHistory === entry ? 'var(--primary-light, #e8eeff)' : 'transparent', borderRadius: 4, cursor: 'pointer', fontSize: 13 }} onClick={() => setSelectedHistory(selectedHistory === entry ? null : entry)}>
                          {formatHistoryLabel(entry)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedHistory && (
                <div style={{ marginTop: 8, padding: 10, background: 'var(--bg-muted)', borderRadius: 6, fontSize: 12 }}>
                  <div><strong>Период:</strong> {formatHistoryLabel(selectedHistory)}</div>
                  <div>Значение за период сравнения: {String(selectedHistory.value1)}</div>
                  <div>Значение за текущий период: {String(selectedHistory.value2)}</div>
                </div>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function SER() {
  const [planYear, setPlanYear] = useState(2025)
  const [executionLabel, setExecutionLabel] = useState(EXECUTION_MONTH_OPTIONS[0])
  const [data, setData] = useState<SERData>(loadSER)

  const updateIndicator = (slide: 'slide29' | 'slide30', id: string, field: keyof SERIndicator, value: number | string) => {
    setData((d) => ({
      ...d,
      [slide]: d[slide].map((i) => {
        if (i.id !== id) return i
        const next = { ...i, [field]: value }
        if (field === 'year' || field === 'periodType' || field === 'periodValue') {
          const labels = getPeriodLabels(next.year, next.periodType, next.periodValue)
          next.period1 = labels.comparison
          next.period2 = labels.current
        }
        return next
      }),
    }))
  }

  const handleSave = () => {
    const next = { ...data, planYear, executionLabel }
    next.slide29 = next.slide29.map((i) => {
      const labels = getPeriodLabels(i.year, i.periodType, i.periodValue)
      return { ...i, period1: labels.comparison, period2: labels.current }
    })
    next.slide30 = next.slide30.map((i) => {
      const labels = getPeriodLabels(i.year, i.periodType, i.periodValue)
      return { ...i, period1: labels.comparison, period2: labels.current }
    })
    next.revenues = next.revenues.map((r) => ({ ...r, percent: calcPercent(r.plan, r.execution) }))
    const totalExecution = next.expenses[0]?.execution ?? 0
    next.expenses = next.expenses.map((r, idx) => {
      const percent = calcPercent(r.plan, r.execution)
      const sharePercent = idx === 0 ? 0 : (totalExecution ? Math.round((r.execution / totalExecution) * 1000) / 10 : 0)
      return { ...r, percent, sharePercent }
    })
    saveSER(next)
    setData(loadSER())
  }

  const updateBudget = (type: 'revenues' | 'expenses', id: string, field: 'plan' | 'execution', value: number) => {
    setData((d) => ({
      ...d,
      [type]: d[type].map((r) => {
        if (r.id !== id) return r
        const next = { ...r, [field]: value }
        next.percent = calcPercent(next.plan, next.execution)
        return next
      }),
    }))
  }

  /** Итоги по доходам: первая строка «Всего» = сумма строк 1–4 (автоматически) */
  const revenuesWithTotal = useMemo(() => {
    const list = data.revenues
    if (list.length < 5) return list
    const planTotal = list.slice(1, 5).reduce((s, r) => s + (r.plan || 0), 0)
    const execTotal = list.slice(1, 5).reduce((s, r) => s + (r.execution || 0), 0)
    return list.map((r, idx) =>
      idx === 0 ? { ...r, plan: planTotal, execution: execTotal, percent: calcPercent(planTotal, execTotal) } : r
    )
  }, [data.revenues])

  /** Общая сумма затрат по плану (для удельного веса и топ-5) */
  const totalExpensePlan = useMemo(() => {
    const list = data.expenses
    if (list.length <= 1) return 0
    return list.slice(1).reduce((s, r) => s + (r.plan || 0), 0)
  }, [data.expenses])

  /** Итоги по затратам: первая строка «Всего» = сумма групп; уд. вес от плана; топ-5 по плану */
  const expensesWithShare = useMemo(() => {
    const list = data.expenses
    if (list.length <= 1) return list
    const totalPlan = totalExpensePlan
    const totalExecution = list.slice(1).reduce((s, r) => s + (r.execution || 0), 0)
    return list.map((r, idx) => {
      if (idx === 0) {
        return { ...r, plan: totalPlan, execution: totalExecution, percent: calcPercent(totalPlan, totalExecution), sharePercent: 0 }
      }
      const sharePercent = totalPlan ? Math.round((r.plan || 0) / totalPlan * 1000) / 10 : 0
      return { ...r, sharePercent }
    })
  }, [data.expenses, totalExpensePlan])

  const top5ExpenseIndices = useMemo(() => {
    if (data.expenses.length <= 1) return new Set<number>()
    const withIndex = data.expenses.slice(1).map((r, i) => ({ i: i + 1, plan: r.plan || 0 }))
    withIndex.sort((a, b) => b.plan - a.plan)
    return new Set(withIndex.slice(0, 5).map((x) => x.i))
  }, [data.expenses])

  return (
    <>
      <div className="breadcrumb">ОПИСЭР / СЭР</div>
      <div className="page-header">
        <h1 className="page-title">Социально-экономическое развитие</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => mockExport('pdf')}>Выгрузить в PDF</button>
          <button type="button" className="btn btn-secondary" onClick={() => mockExport('pptx')}>Выгрузить в PPTX</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>Сохранить</button>
        </div>
      </div>
      <div className="page-body">
        {data.updatedAt && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Дата обновления: {data.updatedAt}</p>}

        <h3 style={{ marginTop: 24 }}>Стр. 29 — Ключевые показатели (часть 1)</h3>
        <div className="table-wrap" style={{ marginBottom: 24 }}>
          <table>
            <thead>
              <tr>
                <th>Показатель</th>
                <th>Отчётный год</th>
                <th>Период</th>
                <th>Период сравнения</th>
                <th>Значение</th>
                <th>Изменение</th>
                <th>Текущий период</th>
                <th>Значение</th>
                <th>Ед. изм.</th>
                <th>История</th>
              </tr>
            </thead>
            <tbody>
              {data.slide29.map((i) => (
                <IndicatorRow key={i.id} indicator={i} onUpdate={(id, field, value) => updateIndicator('slide29', id, field, value)} years={YEARS} />
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: 24 }}>Стр. 30 — Ключевые показатели (часть 2)</h3>
        <div className="table-wrap" style={{ marginBottom: 24 }}>
          <table>
            <thead>
              <tr>
                <th>Показатель</th>
                <th>Отчётный год</th>
                <th>Период</th>
                <th>Период сравнения</th>
                <th>Значение</th>
                <th>Изменение</th>
                <th>Текущий период</th>
                <th>Значение</th>
                <th>Ед. изм.</th>
                <th>История</th>
              </tr>
            </thead>
            <tbody>
              {data.slide30.map((i) => (
                <IndicatorRow key={i.id} indicator={i} onUpdate={(id, field, value) => updateIndicator('slide30', id, field, value)} years={YEARS} />
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: 24 }}>Стр. 31 — Показатели бюджета (млн тнг)</h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
          <div className="form-group" style={{ maxWidth: 120 }}>
            <label>Год плана</label>
            <select value={planYear} onChange={(e) => setPlanYear(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ maxWidth: 180 }}>
            <label>Период исполнения</label>
            <select value={executionLabel} onChange={(e) => setExecutionLabel(e.target.value)}>
              {EXECUTION_MONTH_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>План — с учётом последних актуальных уточнений и корректировок.</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>ДОХОДЫ, в т.ч.</p>
        <div className="table-wrap" style={{ marginBottom: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Наименование</th>
                <th>План на {planYear} г.</th>
                <th>Исполнение на {executionLabel}</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {revenuesWithTotal.map((r, idx) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  {idx === 0 ? (
                    <>
                      <td style={{ background: 'var(--bg-muted)' }}>{r.plan || '—'}</td>
                      <td style={{ background: 'var(--bg-muted)' }}>{r.execution || '—'}</td>
                    </>
                  ) : (
                    <>
                      <td><input type="number" value={r.plan || ''} onChange={(e) => updateBudget('revenues', r.id, 'plan', Number(e.target.value) || 0)} style={{ width: 120, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }} /></td>
                      <td><input type="number" value={r.execution || ''} onChange={(e) => updateBudget('revenues', r.id, 'execution', Number(e.target.value) || 0)} style={{ width: 120, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }} /></td>
                    </>
                  )}
                  <td>{r.percent ? `${r.percent}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>ЗАТРАТЫ — функциональные группы (топ-5 по удельному весу)</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Наименование</th>
                <th>План на {planYear} г.</th>
                <th>Исполнение на {executionLabel}</th>
                <th>%</th>
                <th>Уд. вес</th>
              </tr>
            </thead>
            <tbody>
              {expensesWithShare.map((r, idx) => (
                <tr key={r.id} className={top5ExpenseIndices.has(idx) ? 'ser-expense-top5' : ''}>
                  <td>{r.name}{top5ExpenseIndices.has(idx) && <span className="ser-top5-badge"> топ-5</span>}</td>
                  {idx === 0 ? (
                    <>
                      <td style={{ background: 'var(--bg-muted)' }}>{r.plan || '—'}</td>
                      <td style={{ background: 'var(--bg-muted)' }}>{r.execution || '—'}</td>
                    </>
                  ) : (
                    <>
                      <td><input type="number" value={r.plan || ''} onChange={(e) => updateBudget('expenses', r.id, 'plan', Number(e.target.value) || 0)} style={{ width: 120, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }} /></td>
                      <td><input type="number" value={r.execution || ''} onChange={(e) => updateBudget('expenses', r.id, 'execution', Number(e.target.value) || 0)} style={{ width: 120, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }} /></td>
                    </>
                  )}
                  <td>{r.percent ? `${r.percent}%` : '—'}</td>
                  <td>{idx > 0 && (r.sharePercent ?? 0) > 0 ? `${r.sharePercent}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
