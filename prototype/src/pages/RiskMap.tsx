import { useState, useEffect } from 'react'
import type { RiskMapData, RiskMapRecord } from '../types'
import { mockExport } from '../utils/storage'

const RISK_LEVELS = ['высокий', 'средний', 'низкий']
const STORAGE_KEY = 'opiser_risk_map'

function loadRiskMap(period: string): RiskMapData {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${period}`)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    period,
    updatedAt: '',
    summary20: '',
    records: [],
  }
}

function saveRiskMap(data: RiskMapData) {
  data.updatedAt = new Date().toISOString().slice(0, 10)
  localStorage.setItem(`${STORAGE_KEY}_${data.period}`, JSON.stringify(data))
}

export default function RiskMap() {
  const [period, setPeriod] = useState('2025-Q1')
  const [data, setData] = useState<RiskMapData>(loadRiskMap('2025-Q1'))

  useEffect(() => {
    setData(loadRiskMap(period))
  }, [period])

  const handleSave = () => {
    saveRiskMap(data)
    setData({ ...data, updatedAt: new Date().toISOString().slice(0, 10) })
  }

  const addRecord = () => {
    const newRecord: RiskMapRecord = {
      id: crypto.randomUUID(),
      territory: '',
      riskType: '',
      riskLevel: '',
      indicator: '',
      measures: '',
    }
    setData((d) => ({ ...d, records: [...d.records, newRecord] }))
  }

  const updateRecord = (id: string, field: keyof RiskMapRecord, value: string | number) => {
    setData((d) => ({
      ...d,
      records: d.records.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }))
  }

  const removeRecord = (id: string) => {
    setData((d) => ({ ...d, records: d.records.filter((r) => r.id !== id) }))
  }

  return (
    <>
      <div className="breadcrumb">ОПИСЭР / Карта социальных рисков</div>
      <div className="page-header">
        <h1 className="page-title">Карта социальных рисков</h1>
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
        <div className="form-group" style={{ maxWidth: 200 }}>
          <label>Период отчётности</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="2025-Q1">2025 I квартал</option>
            <option value="2025-Q2">2025 II квартал</option>
            <option value="2024-Q4">2024 IV квартал</option>
          </select>
        </div>
        {data.updatedAt && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Дата обновления: {data.updatedAt}</p>}

        <h3 style={{ marginTop: 24 }}>Стр. 20 — Сводка / описание</h3>
        <div className="form-group">
          <textarea
            value={data.summary20}
            onChange={(e) => setData((d) => ({ ...d, summary20: e.target.value }))}
            placeholder="Текст сводки для слайда 20"
            style={{ minHeight: 100 }}
          />
        </div>

        <h3 style={{ marginTop: 24 }}>Стр. 21–23 — Записи (территория, вид риска, уровень, показатель, меры)</h3>
        <button type="button" className="btn btn-primary" onClick={addRecord} style={{ marginBottom: 12 }}>
          + Добавить запись
        </button>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Территория / район</th>
                <th>Вид риска</th>
                <th>Уровень риска</th>
                <th>Показатель</th>
                <th>Принятые меры</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((r) => (
                <tr key={r.id}>
                  <td>
                    <input
                      value={r.territory}
                      onChange={(e) => updateRecord(r.id, 'territory', e.target.value)}
                      style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>
                    <input
                      value={r.riskType}
                      onChange={(e) => updateRecord(r.id, 'riskType', e.target.value)}
                      style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>
                    <select
                      value={r.riskLevel}
                      onChange={(e) => updateRecord(r.id, 'riskLevel', e.target.value)}
                      style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    >
                      <option value="">—</option>
                      {RISK_LEVELS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={r.indicator}
                      onChange={(e) => updateRecord(r.id, 'indicator', e.target.value)}
                      style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>
                    <input
                      value={r.measures}
                      onChange={(e) => updateRecord(r.id, 'measures', e.target.value)}
                      style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 4, padding: 6 }}
                    />
                  </td>
                  <td>
                    <button type="button" className="actions-btn" onClick={() => removeRecord(r.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
