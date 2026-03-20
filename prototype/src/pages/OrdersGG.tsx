import { useState, useEffect, useMemo, useCallback } from 'react'
import { mockExport } from '../utils/storage'
import { MOCK_ORDERS_GG, PROTOCOL_TYPE_LABEL } from '../data/ordersGGFromSlides'

const STORAGE_INCLUDE = 'opiser_orders_gg_include'
const FIXED_EXECUTOR_LINE = 'Аппарат акима города Шымкент'

function loadIncludeMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_INCLUDE)
    if (!raw) return {}
    const p = JSON.parse(raw)
    return typeof p === 'object' && p !== null ? p : {}
  } catch {
    return {}
  }
}

function saveIncludeMap(m: Record<string, boolean>) {
  localStorage.setItem(STORAGE_INCLUDE, JSON.stringify(m))
}

export default function OrdersGG() {
  const [includeMap, setIncludeMap] = useState<Record<string, boolean>>({})
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    const stored = loadIncludeMap()
    const next: Record<string, boolean> = { ...stored }
    for (const o of MOCK_ORDERS_GG) {
      if (next[o.id] === undefined) next[o.id] = true
    }
    setIncludeMap(next)
  }, [refreshTick])

  const persistInclude = useCallback((id: string, value: boolean) => {
    setIncludeMap((prev) => {
      const n = { ...prev, [id]: value }
      saveIncludeMap(n)
      return n
    })
  }, [])

  const rowMeta = useMemo(() => {
    return MOCK_ORDERS_GG.map((o, idx) => {
      const prev = MOCK_ORDERS_GG[idx - 1]
      const isFirstInProtocol = !prev || prev.protocolKey !== o.protocolKey
      const span = MOCK_ORDERS_GG.filter((x) => x.protocolKey === o.protocolKey).length
      return { isFirstInProtocol, rowSpan: span }
    })
  }, [])

  const handleRefresh = () => {
    setRefreshTick((t) => t + 1)
    window.alert('Данные обновлены из модуля «Поручения» (имитация). В прототипе список фиксирован по слайдам 24–28.')
  }

  const selectedCount = MOCK_ORDERS_GG.filter((o) => includeMap[o.id]).length

  return (
    <>
      <div className="breadcrumb">ОПИСЭР / Поручения ГГ</div>
      <div className="page-header">
        <h1 className="page-title">Поручения ГГ</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={handleRefresh}>
            Обновить из «Поручения»
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => mockExport('pdf')}>
            Выгрузить в PDF
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => mockExport('pptx')}>
            Выгрузить в PPTX
          </button>
        </div>
      </div>
      <div className="page-body">
        <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 14 }}>
          Источник: основной модуль <strong>«Поручения»</strong>, отбор по типу протокола —{' '}
          <strong>{PROTOCOL_TYPE_LABEL}</strong>. Создание и редактирование поручений здесь недоступны; в выгрузку
          PPTX/PDF попадают только строки с отметкой <strong>«В выгрузку»</strong> ({selectedCount} из{' '}
          {MOCK_ORDERS_GG.length}).
        </p>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>
          Макет таблицы — по презентации <strong>«Слайды Шымкент 2025», стр. 24–28</strong> (мок-данные перенесены с
          этих страниц).
        </p>
        <div className="table-wrap">
          <table className="orders-gg-table">
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Наименование протокола</th>
                <th style={{ width: 48 }}>№ п/п</th>
                <th style={{ minWidth: 140 }}>Номер документа</th>
                <th style={{ minWidth: 220 }}>Содержание поручения и сроки</th>
                <th style={{ minWidth: 180 }}>Ответственные исполнители</th>
                <th style={{ minWidth: 280 }}>Ход реализации</th>
                <th style={{ width: 100 }}>В выгрузку</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ORDERS_GG.map((o, idx) => {
                const { isFirstInProtocol, rowSpan } = rowMeta[idx]
                return (
                  <tr key={o.id}>
                    {isFirstInProtocol && (
                      <td rowSpan={rowSpan} className="orders-gg-protocol-cell">
                        {o.protocolTitle}
                      </td>
                    )}
                    <td>{o.orderInProtocol}</td>
                    <td>{o.documentRef}</td>
                    <td>
                      <div style={{ marginBottom: 8 }}>{o.content}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.initialDeadline}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.currentDeadline}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>{FIXED_EXECUTOR_LINE}</div>
                      <div style={{ fontSize: 13, marginBottom: 4 }}>{o.executorsNational}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{o.executorsCityDept}</div>
                    </td>
                    <td style={{ fontSize: 13, verticalAlign: 'top', maxWidth: 400 }}>{o.implementation}</td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        checked={includeMap[o.id] !== false}
                        onChange={(e) => persistInclude(o.id, e.target.checked)}
                        aria-label={`Включить поручение ${o.documentRef} в выгрузку`}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          Ссылка «Открыть в Поручениях» (к карточке в основном модуле) — в продукте; в прототипе не реализована.
        </p>
      </div>
    </>
  )
}
