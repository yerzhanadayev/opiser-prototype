import { useState, useEffect } from 'react'
import type { SERData, SERIndicator, SERBudgetRow } from '../types'
import { mockExport } from '../utils/storage'

const SER_STORAGE_KEY = 'opiser_ser'

const SLIDE29_TEMPLATE: Omit<SERIndicator, 'id'>[] = [
  { name: 'ВРП (ИФО)', period1: 'январь–сентябрь 2024 г.', value1: '', change: '', period2: 'январь–сентябрь 2025 г.', value2: '', unit: '%' },
  { name: 'Вклад МСБ в ВРП', period1: 'январь–сентябрь 2024 г.', value1: '', change: '', period2: 'январь–сентябрь 2025 г.', value2: '', unit: '%' },
  { name: 'Количество активных субъектов МСБ', period1: 'на 01.01.2025', value1: '', change: '', period2: 'на 01.01.2026', value2: '', unit: 'тыс. ед.' },
  { name: 'Объём выпуска МСБ', period1: 'январь–сентябрь 2024 г.', value1: '', change: '', period2: 'январь–сентябрь 2025 г.', value2: '', unit: 'млрд тнг' },
  { name: 'Краткосрочный экономический индикатор', period1: 'январь–декабрь 2024 г.', value1: '', change: '', period2: 'январь–декабрь 2025 г.', value2: '', unit: '%' },
  { name: 'Обрабатывающая промышленность (ИФО)', period1: 'декабрь 2024 г.', value1: '', change: '', period2: 'декабрь 2025 г.', value2: '', unit: '%' },
  { name: 'Инвестиции в основной капитал', period1: 'январь–декабрь 2024 г.', value1: '', change: '', period2: 'январь–декабрь 2025 г.', value2: '', unit: 'млрд тнг' },
  { name: 'Валовый приток иностранных инвестиций', period1: 'январь–сентябрь 2024 г.', value1: '', change: '', period2: 'январь–сентябрь 2025 г.', value2: '', unit: 'млн долл.' },
]

const SLIDE30_TEMPLATE: Omit<SERIndicator, 'id'>[] = [
  { name: 'Инфляция', period1: 'декабрь 2024 г.', value1: '', change: '', period2: 'декабрь 2025 г.', value2: '', unit: '%' },
  { name: 'Уровень безработицы', period1: 'III кв. 2024 г.', value1: '', change: '', period2: 'III кв. 2025 г.', value2: '', unit: '%' },
  { name: 'Индекс реальной зарплаты', period1: 'за III кв. 2024 г.', value1: '', change: '', period2: 'за III кв. 2025 г.', value2: '', unit: '%' },
  { name: 'Медианная зарплата', period1: 'за 2024 г.', value1: '', change: '', period2: 'на 01.11.2025 г.', value2: '', unit: 'тыс. тнг' },
  { name: 'Уровень бедности', period1: 'за III кв. 2024 г.', value1: '', change: '', period2: 'за III кв. 2025 г.', value2: '', unit: '%' },
  { name: 'Доля расходов на продовольствие', period1: 'за III кв. 2024 г.', value1: '', change: '', period2: 'за III кв. 2025 г.', value2: '', unit: '%' },
]

const REVENUES_NAMES = ['Всего по доходам', 'Налоговые поступления', 'Неналоговые поступления', 'Поступления от продажи основного капитала', 'Трансферты']
const EXPENSES_NAMES = ['Всего по затратам', 'Образование', 'ЖКХ', 'Транспорт и коммуникации', 'Соц. обеспечение']

function defaultBudgetRows(names: string[]): SERBudgetRow[] {
  return names.map((name, i) => ({
    id: `row-${i}`,
    name,
    plan: 0,
    execution: 0,
    percent: 0,
  }))
}

function loadSER(period: string): SERData {
  try {
    const raw = localStorage.getItem(`${SER_STORAGE_KEY}_${period}`)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    period,
    updatedAt: '',
    slide29: SLIDE29_TEMPLATE.map((t, i) => ({ ...t, id: `s29-${i}`, value1: '', value2: '', change: '' })),
    slide30: SLIDE30_TEMPLATE.map((t, i) => ({ ...t, id: `s30-${i}`, value1: '', value2: '', change: '' })),
    revenues: defaultBudgetRows(REVENUES_NAMES),
    expenses: defaultBudgetRows(EXPENSES_NAMES),
  }
}

function saveSER(data: SERData) {
  data.updatedAt = new Date().toISOString().slice(0, 10)
  localStorage.setItem(`${SER_STORAGE_KEY}_${data.period}`, JSON.stringify(data))
}

function calcPercent(plan: number, execution: number): number {
  if (!plan) return 0
  return Math.round((execution / plan) * 1000) / 10
}

export default function SER() {
  const [period, setPeriod] = useState('2025')
  const [data, setData] = useState<SERData>(loadSER('2025'))

  useEffect(() => {
    setData(loadSER(period))
  }, [period])

  const handleSave = () => {
    const next = { ...data }
    next.revenues = next.revenues.map((r) => ({ ...r, percent: calcPercent(r.plan, r.execution) }))
    next.expenses = next.expenses.map((r) => ({ ...r, percent: calcPercent(r.plan, r.execution) }))
    saveSER(next)
    setData(next)
  }

  const updateIndicator = (slide: 'slide29' | 'slide30', id: string, field: keyof SERIndicator, value: string | number) => {
    setData((d) => ({
      ...d,
      [slide]: d[slide].map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    }))
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

  return (
    <>
      <div className="breadcrumb">ОПИСЭР / СЭР</div>
      <div className="page-header">
        <h1 className="page-title">Социально-экономическое развитие</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={() => mockExport('pdf')}>
            Выгрузить в PDF
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => mockExport('pptx')}>
            Выгрузить в PPTX
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
      <div className="page-body">
        <div className="form-group" style={{ maxWidth: 120 }}>
          <label>Период (год)</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
        {data.updatedAt && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Дата обновления: {data.updatedAt}</p>}

        <h3 style={{ marginTop: 24 }}>Стр. 29 — Ключевые показатели (часть 1)</h3>
        <div className="table-wrap" style={{ marginBottom: 24 }}>
          <table>
            <thead>
              <tr>
                <th>Показатель</th>
                <th>Период 1</th>
                <th>Значение 1</th>
                <th>Изменение</th>
                <th>Период 2</th>
                <th>Значение 2</th>
                <th>Ед. изм.</th>
              </tr>
            </thead>
            <tbody>
              {data.slide29.map((i) => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.period1}</td>
                  <td>
                    <input
                      type="text"
                      value={String(i.value1)}
                      onChange={(e) => updateIndicator('slide29', i.id, 'value1', e.target.value)}
                      style={{ width: 80, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={i.change}
                      onChange={(e) => updateIndicator('slide29', i.id, 'change', e.target.value)}
                      style={{ width: 80, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>{i.period2}</td>
                  <td>
                    <input
                      type="text"
                      value={String(i.value2)}
                      onChange={(e) => updateIndicator('slide29', i.id, 'value2', e.target.value)}
                      style={{ width: 80, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>{i.unit}</td>
                </tr>
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
                <th>Период 1</th>
                <th>Значение 1</th>
                <th>Изменение</th>
                <th>Период 2</th>
                <th>Значение 2</th>
                <th>Ед. изм.</th>
              </tr>
            </thead>
            <tbody>
              {data.slide30.map((i) => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.period1}</td>
                  <td>
                    <input
                      type="text"
                      value={String(i.value1)}
                      onChange={(e) => updateIndicator('slide30', i.id, 'value1', e.target.value)}
                      style={{ width: 80, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={i.change}
                      onChange={(e) => updateIndicator('slide30', i.id, 'change', e.target.value)}
                      style={{ width: 80, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>{i.period2}</td>
                  <td>
                    <input
                      type="text"
                      value={String(i.value2)}
                      onChange={(e) => updateIndicator('slide30', i.id, 'value2', e.target.value)}
                      style={{ width: 80, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>{i.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: 24 }}>Стр. 31 — Показатели бюджета (млн тнг)</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>ДОХОДЫ, в т.ч.</p>
        <div className="table-wrap" style={{ marginBottom: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Наименование</th>
                <th>План на 2025 г.</th>
                <th>Исполнение на 01.01.2026 г.</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {data.revenues.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>
                    <input
                      type="number"
                      value={r.plan || ''}
                      onChange={(e) => updateBudget('revenues', r.id, 'plan', Number(e.target.value) || 0)}
                      style={{ width: 120, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={r.execution || ''}
                      onChange={(e) => updateBudget('revenues', r.id, 'execution', Number(e.target.value) || 0)}
                      style={{ width: 120, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>{r.percent ? `${r.percent}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>ЗАТРАТЫ</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Наименование</th>
                <th>План на 2025 г.</th>
                <th>Исполнение на 01.01.2026 г.</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {data.expenses.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>
                    <input
                      type="number"
                      value={r.plan || ''}
                      onChange={(e) => updateBudget('expenses', r.id, 'plan', Number(e.target.value) || 0)}
                      style={{ width: 120, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={r.execution || ''}
                      onChange={(e) => updateBudget('expenses', r.id, 'execution', Number(e.target.value) || 0)}
                      style={{ width: 120, border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>{r.percent ? `${r.percent}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
