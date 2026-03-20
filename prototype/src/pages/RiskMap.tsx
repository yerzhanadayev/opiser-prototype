import { useState, useMemo } from 'react'
import type {
  RiskMapData,
  RiskMapOpsRecord,
  RiskMapCardRecord,
  RiskMapOpsRecordType,
  RiskMapOpsStatus,
  RiskMapCardRecordType,
  RiskMapCardLevel,
} from '../types'
import { mockExport } from '../utils/storage'

const STORAGE_KEY = 'opiser_risk_map'

const OPS_TYPES: RiskMapOpsRecordType[] = ['ОПС', 'РС']
const CARD_TYPES: RiskMapCardRecordType[] = ['Системный риск', 'Очаг социальной напряжённости']
const CARD_LEVELS: RiskMapCardLevel[] = ['Красный', 'Оранжевый', 'Жёлтый']

function nowISO(): string {
  return new Date().toISOString()
}

function defaultRiskMapData(): RiskMapData {
  return {
    updatedAt: '',
    opsRecords: [],
    mapRecords: [],
  }
}

function normalizeRiskMapData(raw: RiskMapData): RiskMapData {
  return {
    updatedAt: raw.updatedAt ?? '',
    opsRecords: (raw.opsRecords ?? []).map((r) => ({
      ...r,
      status: (r.status === 'Архивный' ? 'Архивный' : 'Активный') as RiskMapOpsStatus,
    })),
    mapRecords: (raw.mapRecords ?? []).map((r) => {
      const anyR = r as RiskMapCardRecord & { slide?: number; sortOrder?: number; status?: string }
      return {
        id: anyR.id,
        recordType: anyR.recordType,
        title: anyR.title ?? '',
        description: anyR.description ?? '',
        measures: anyR.measures ?? '',
        level: (CARD_LEVELS.includes(anyR.level as RiskMapCardLevel) ? anyR.level : 'Жёлтый') as RiskMapCardLevel,
        status: (anyR.status === 'Архивный' ? 'Архивный' : 'Активный') as RiskMapOpsStatus,
        createdAt: anyR.createdAt ?? nowISO(),
        updatedAt: anyR.updatedAt ?? nowISO(),
      }
    }),
  }
}

function isNewFormat(raw: unknown): raw is RiskMapData {
  if (!raw || typeof raw !== 'object') return false
  const o = raw as Record<string, unknown>
  return Array.isArray(o.opsRecords) && Array.isArray(o.mapRecords)
}

function loadRiskMap(): RiskMapData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultRiskMapData()
    const parsed = JSON.parse(raw)
    if (isNewFormat(parsed)) {
      return normalizeRiskMapData({
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
        opsRecords: parsed.opsRecords,
        mapRecords: parsed.mapRecords,
      })
    }
  } catch {}
  return defaultRiskMapData()
}

function saveRiskMap(data: RiskMapData) {
  const next = { ...data, updatedAt: nowISO().slice(0, 10) }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

type OpsForm = {
  recordType: RiskMapOpsRecordType
  title: string
  description: string
  measures: string
}

type MapForm = {
  recordType: RiskMapCardRecordType
  title: string
  description: string
  measures: string
  level: RiskMapCardLevel
}

const emptyOpsForm = (): OpsForm => ({
  recordType: 'ОПС',
  title: '',
  description: '',
  measures: '',
})

const emptyMapForm = (): MapForm => ({
  recordType: 'Системный риск',
  title: '',
  description: '',
  measures: '',
  level: 'Жёлтый',
})

function truncateCell(s: string, max: number): string {
  if (!s?.trim()) return '—'
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

function dateOnly(iso: string): string {
  if (!iso) return '—'
  return iso.slice(0, 10)
}

/** Фильтр по календарной дате (YYYY-MM-DD): пустые from/to = без ограничения с этой стороны */
function matchesDateRange(iso: string, from: string, to: string): boolean {
  if (!from && !to) return true
  const d = iso ? iso.slice(0, 10) : ''
  if (!d || d.length < 10) return false
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

export default function RiskMap() {
  const [activeTab, setActiveTab] = useState<'ops' | 'map'>('ops')
  const [data, setData] = useState<RiskMapData>(loadRiskMap)

  const [filterOpsStatus, setFilterOpsStatus] = useState<'all' | RiskMapOpsStatus>('all')
  const [filterOpsType, setFilterOpsType] = useState<'all' | RiskMapOpsRecordType>('all')
  const [filterOpsCreatedFrom, setFilterOpsCreatedFrom] = useState('')
  const [filterOpsCreatedTo, setFilterOpsCreatedTo] = useState('')
  const [filterOpsUpdatedFrom, setFilterOpsUpdatedFrom] = useState('')
  const [filterOpsUpdatedTo, setFilterOpsUpdatedTo] = useState('')

  const [filterCardType, setFilterCardType] = useState<'all' | RiskMapCardRecordType>('all')
  const [filterMapLevel, setFilterMapLevel] = useState<'all' | RiskMapCardLevel>('all')
  const [filterMapStatus, setFilterMapStatus] = useState<'all' | RiskMapOpsStatus>('all')
  const [filterMapCreatedFrom, setFilterMapCreatedFrom] = useState('')
  const [filterMapCreatedTo, setFilterMapCreatedTo] = useState('')
  const [filterMapUpdatedFrom, setFilterMapUpdatedFrom] = useState('')
  const [filterMapUpdatedTo, setFilterMapUpdatedTo] = useState('')

  const [opsDrawer, setOpsDrawer] = useState<'add' | 'edit' | 'view' | null>(null)
  const [mapDrawer, setMapDrawer] = useState<'add' | 'edit' | 'view' | null>(null)
  const [editingOpsId, setEditingOpsId] = useState<string | null>(null)
  const [editingMapId, setEditingMapId] = useState<string | null>(null)
  const [formOps, setFormOps] = useState<OpsForm>(emptyOpsForm())
  const [formMap, setFormMap] = useState<MapForm>(emptyMapForm())

  const filteredOpsRecords = useMemo(() => {
    return data.opsRecords.filter((r) => {
      if (filterOpsStatus !== 'all' && r.status !== filterOpsStatus) return false
      if (filterOpsType !== 'all' && r.recordType !== filterOpsType) return false
      if (!matchesDateRange(r.createdAt, filterOpsCreatedFrom, filterOpsCreatedTo)) return false
      if (!matchesDateRange(r.updatedAt, filterOpsUpdatedFrom, filterOpsUpdatedTo)) return false
      return true
    })
  }, [
    data.opsRecords,
    filterOpsStatus,
    filterOpsType,
    filterOpsCreatedFrom,
    filterOpsCreatedTo,
    filterOpsUpdatedFrom,
    filterOpsUpdatedTo,
  ])

  const filteredMapRecords = useMemo(() => {
    return data.mapRecords.filter((r) => {
      if (filterCardType !== 'all' && r.recordType !== filterCardType) return false
      if (filterMapLevel !== 'all' && r.level !== filterMapLevel) return false
      if (filterMapStatus !== 'all' && r.status !== filterMapStatus) return false
      if (!matchesDateRange(r.createdAt, filterMapCreatedFrom, filterMapCreatedTo)) return false
      if (!matchesDateRange(r.updatedAt, filterMapUpdatedFrom, filterMapUpdatedTo)) return false
      return true
    })
  }, [
    data.mapRecords,
    filterCardType,
    filterMapLevel,
    filterMapStatus,
    filterMapCreatedFrom,
    filterMapCreatedTo,
    filterMapUpdatedFrom,
    filterMapUpdatedTo,
  ])

  const handleSave = () => {
    const saved = saveRiskMap(data)
    setData(saved)
  }

  const openAddOps = () => {
    setFormOps(emptyOpsForm())
    setEditingOpsId(null)
    setOpsDrawer('add')
  }
  const openEditOps = (r: RiskMapOpsRecord) => {
    setEditingOpsId(r.id)
    setFormOps({
      recordType: r.recordType,
      title: r.title,
      description: r.description,
      measures: r.measures,
    })
    setOpsDrawer('edit')
  }
  const openViewOps = (r: RiskMapOpsRecord) => {
    setEditingOpsId(r.id)
    setFormOps({
      recordType: r.recordType,
      title: r.title,
      description: r.description,
      measures: r.measures,
    })
    setOpsDrawer('view')
  }
  const submitOps = () => {
    const t = nowISO()
    if (opsDrawer === 'add') {
      const newRecord: RiskMapOpsRecord = {
        id: crypto.randomUUID(),
        ...formOps,
        status: 'Активный',
        createdAt: t,
        updatedAt: t,
      }
      setData((d) => ({ ...d, opsRecords: [...d.opsRecords, newRecord] }))
    } else if (opsDrawer === 'edit' && editingOpsId) {
      setData((d) => ({
        ...d,
        opsRecords: d.opsRecords.map((r) =>
          r.id === editingOpsId ? { ...r, ...formOps, updatedAt: t } : r
        ),
      }))
    }
    setOpsDrawer(null)
  }

  const archiveOps = (r: RiskMapOpsRecord) => {
    const t = nowISO()
    setData((d) => ({
      ...d,
      opsRecords: d.opsRecords.map((x) =>
        x.id === r.id ? { ...x, status: 'Архивный' as const, updatedAt: t } : x
      ),
    }))
    setOpsDrawer(null)
  }

  const openAddMap = () => {
    setFormMap(emptyMapForm())
    setEditingMapId(null)
    setMapDrawer('add')
  }
  const openEditMap = (r: RiskMapCardRecord) => {
    setEditingMapId(r.id)
    setFormMap({
      recordType: r.recordType,
      title: r.title,
      description: r.description,
      measures: r.measures,
      level: r.level,
    })
    setMapDrawer('edit')
  }
  const openViewMap = (r: RiskMapCardRecord) => {
    setEditingMapId(r.id)
    setFormMap({
      recordType: r.recordType,
      title: r.title,
      description: r.description,
      measures: r.measures,
      level: r.level,
    })
    setMapDrawer('view')
  }
  const submitMap = () => {
    const t = nowISO()
    if (mapDrawer === 'add') {
      const newRecord: RiskMapCardRecord = {
        id: crypto.randomUUID(),
        ...formMap,
        status: 'Активный',
        createdAt: t,
        updatedAt: t,
      }
      setData((d) => ({ ...d, mapRecords: [...d.mapRecords, newRecord] }))
    } else if (mapDrawer === 'edit' && editingMapId) {
      setData((d) => ({
        ...d,
        mapRecords: d.mapRecords.map((r) =>
          r.id === editingMapId ? { ...r, ...formMap, updatedAt: t } : r
        ),
      }))
    }
    setMapDrawer(null)
  }

  const archiveMap = (r: RiskMapCardRecord) => {
    const t = nowISO()
    setData((d) => ({
      ...d,
      mapRecords: d.mapRecords.map((x) =>
        x.id === r.id ? { ...x, status: 'Архивный' as const, updatedAt: t } : x
      ),
    }))
    setMapDrawer(null)
  }

  const badgeStatus = (s: RiskMapOpsStatus) =>
    s === 'Активный' ? 'badge-active' : 'badge-archive'

  const avatarLetter = (title: string, fallback: string) => {
    const t = (title || fallback).trim()
    return (t[0] || '?').toUpperCase()
  }

  return (
    <>
      <div className="breadcrumb">ОПИСЭР / Карта социальных рисков</div>
      <div className="page-header">
        <h1 className="page-title">Карта социальных рисков</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => mockExport('pdf')}>
            Выгрузить в PDF
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => mockExport('pptx')}>
            Выгрузить в PPTX
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleSave}>
            Сохранить
          </button>
          {activeTab === 'ops' ? (
            <button type="button" className="btn btn-primary" onClick={openAddOps}>
              + Добавить запись
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={openAddMap}>
              + Добавить запись
            </button>
          )}
        </div>
      </div>
      <div className="page-body">
        {data.updatedAt && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
            Дата последнего обновления модуля: {data.updatedAt}
          </p>
        )}

        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeTab === 'ops' ? 'active' : ''}`}
            onClick={() => setActiveTab('ops')}
          >
            ОПС/РС
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            Карта социальных рисков
          </button>
        </div>

        {activeTab === 'ops' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 0 }}>
              Слайд 20. В выгрузку попадают только активные записи. Новая запись — со статусом «Активный»; в архив — кнопкой в строке.
            </p>
            <div className="filters-bar">
              <select value={filterOpsType} onChange={(e) => setFilterOpsType(e.target.value as typeof filterOpsType)}>
                <option value="all">Тип: все</option>
                {OPS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select value={filterOpsStatus} onChange={(e) => setFilterOpsStatus(e.target.value as typeof filterOpsStatus)}>
                <option value="all">Статус: все</option>
                <option value="Активный">Активные</option>
                <option value="Архивный">Архивные</option>
              </select>
              <input
                type="date"
                value={filterOpsCreatedFrom}
                onChange={(e) => setFilterOpsCreatedFrom(e.target.value)}
                title="Дата создания — с"
                aria-label="Дата создания с"
              />
              <input
                type="date"
                value={filterOpsCreatedTo}
                onChange={(e) => setFilterOpsCreatedTo(e.target.value)}
                title="Дата создания — по"
                aria-label="Дата создания по"
              />
              <input
                type="date"
                value={filterOpsUpdatedFrom}
                onChange={(e) => setFilterOpsUpdatedFrom(e.target.value)}
                title="Дата обновления — с"
                aria-label="Дата обновления с"
              />
              <input
                type="date"
                value={filterOpsUpdatedTo}
                onChange={(e) => setFilterOpsUpdatedTo(e.target.value)}
                title="Дата обновления — по"
                aria-label="Дата обновления по"
              />
              <button type="button" className="btn btn-secondary">Все фильтры</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Заголовок</th>
                    <th>Тип</th>
                    <th>Описание</th>
                    <th>Меры</th>
                    <th>Дата создания</th>
                    <th>Дата обновления</th>
                    <th>Статус</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpsRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ color: 'var(--text-muted)' }}>
                        Нет записей по выбранному фильтру.
                      </td>
                    </tr>
                  ) : (
                    filteredOpsRecords.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar avatar-sm">{avatarLetter(r.title, r.recordType)}</div>
                            {r.title || '—'}
                          </div>
                        </td>
                        <td>{r.recordType}</td>
                        <td style={{ maxWidth: 220 }} title={r.description}>{truncateCell(r.description, 80)}</td>
                        <td style={{ maxWidth: 200 }} title={r.measures}>{truncateCell(r.measures, 70)}</td>
                        <td>{dateOnly(r.createdAt)}</td>
                        <td>{dateOnly(r.updatedAt)}</td>
                        <td>
                          <span className={`badge ${badgeStatus(r.status)}`}>{r.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button type="button" className="actions-btn" onClick={() => openViewOps(r)} title="Просмотр">⋯</button>
                            <button type="button" className="actions-btn" onClick={() => openEditOps(r)} title="Редактировать">✎</button>
                            {r.status === 'Активный' && (
                              <button type="button" className="actions-btn" onClick={() => archiveOps(r)} title="В архив">Архив</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'map' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 0 }}>
              Слайды 21–23. Статус при создании — «Активный»; в архив — кнопкой в строке.
            </p>
            <div className="filters-bar">
              <select value={filterCardType} onChange={(e) => setFilterCardType(e.target.value as typeof filterCardType)}>
                <option value="all">Тип записи: все</option>
                {CARD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select value={filterMapLevel} onChange={(e) => setFilterMapLevel(e.target.value as typeof filterMapLevel)}>
                <option value="all">Уровень: все</option>
                {CARD_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <select value={filterMapStatus} onChange={(e) => setFilterMapStatus(e.target.value as typeof filterMapStatus)}>
                <option value="all">Статус: все</option>
                <option value="Активный">Активные</option>
                <option value="Архивный">Архивные</option>
              </select>
              <input
                type="date"
                value={filterMapCreatedFrom}
                onChange={(e) => setFilterMapCreatedFrom(e.target.value)}
                title="Дата создания — с"
                aria-label="Дата создания с"
              />
              <input
                type="date"
                value={filterMapCreatedTo}
                onChange={(e) => setFilterMapCreatedTo(e.target.value)}
                title="Дата создания — по"
                aria-label="Дата создания по"
              />
              <input
                type="date"
                value={filterMapUpdatedFrom}
                onChange={(e) => setFilterMapUpdatedFrom(e.target.value)}
                title="Дата обновления — с"
                aria-label="Дата обновления с"
              />
              <input
                type="date"
                value={filterMapUpdatedTo}
                onChange={(e) => setFilterMapUpdatedTo(e.target.value)}
                title="Дата обновления — по"
                aria-label="Дата обновления по"
              />
              <button type="button" className="btn btn-secondary">Все фильтры</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Заголовок</th>
                    <th>Тип записи</th>
                    <th>Уровень</th>
                    <th>Описание</th>
                    <th>Меры</th>
                    <th>Дата создания</th>
                    <th>Дата обновления</th>
                    <th>Статус</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMapRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ color: 'var(--text-muted)' }}>
                        Нет записей по выбранным фильтрам.
                      </td>
                    </tr>
                  ) : (
                    filteredMapRecords.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar avatar-sm">{avatarLetter(r.title, r.recordType)}</div>
                            {r.title || '—'}
                          </div>
                        </td>
                        <td>{r.recordType}</td>
                        <td>{r.level}</td>
                        <td style={{ maxWidth: 200 }} title={r.description}>{truncateCell(r.description, 70)}</td>
                        <td style={{ maxWidth: 180 }} title={r.measures}>{truncateCell(r.measures, 60)}</td>
                        <td>{dateOnly(r.createdAt)}</td>
                        <td>{dateOnly(r.updatedAt)}</td>
                        <td>
                          <span className={`badge ${badgeStatus(r.status)}`}>{r.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button type="button" className="actions-btn" onClick={() => openViewMap(r)} title="Просмотр">⋯</button>
                            <button type="button" className="actions-btn" onClick={() => openEditMap(r)} title="Редактировать">✎</button>
                            {r.status === 'Активный' && (
                              <button type="button" className="actions-btn" onClick={() => archiveMap(r)} title="В архив">Архив</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {opsDrawer && (
        <>
          <div className="drawer-overlay" onClick={() => setOpsDrawer(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <h2 className="drawer-title">
                {opsDrawer === 'add'
                  ? 'Новая запись ОПС/РС'
                  : opsDrawer === 'view'
                    ? 'Запись ОПС/РС'
                    : 'Редактировать запись ОПС/РС'}
              </h2>
              <button type="button" className="drawer-close" onClick={() => setOpsDrawer(null)}>×</button>
            </div>
            <div className="drawer-body">
              <div className="form-group">
                <label>Тип записи</label>
                <select
                  value={formOps.recordType}
                  onChange={(e) => setFormOps((f) => ({ ...f, recordType: e.target.value as RiskMapOpsRecordType }))}
                  disabled={opsDrawer === 'view'}
                >
                  {OPS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Заголовок (тема)</label>
                <input
                  value={formOps.title}
                  onChange={(e) => setFormOps((f) => ({ ...f, title: e.target.value }))}
                  disabled={opsDrawer === 'view'}
                />
              </div>
              <div className="form-group">
                <label>Описание ситуации</label>
                <textarea
                  value={formOps.description}
                  onChange={(e) => setFormOps((f) => ({ ...f, description: e.target.value }))}
                  rows={5}
                  disabled={opsDrawer === 'view'}
                />
              </div>
              <div className="form-group">
                <label>Принимаемые меры</label>
                <textarea
                  value={formOps.measures}
                  onChange={(e) => setFormOps((f) => ({ ...f, measures: e.target.value }))}
                  rows={5}
                  disabled={opsDrawer === 'view'}
                />
              </div>
              {opsDrawer === 'add' && (
                <p className="form-hint">Статус при сохранении будет «Активный».</p>
              )}
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setOpsDrawer(null)}>Отменить</button>
              {opsDrawer === 'view' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => editingOpsId && setOpsDrawer('edit')}
                >
                  Редактировать
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={submitOps}>
                  {opsDrawer === 'add' ? 'Создать' : 'Сохранить'}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {mapDrawer && (
        <>
          <div className="drawer-overlay" onClick={() => setMapDrawer(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <h2 className="drawer-title">
                {mapDrawer === 'add'
                  ? 'Новая запись карты рисков'
                  : mapDrawer === 'view'
                    ? 'Запись карты рисков'
                    : 'Редактировать запись карты рисков'}
              </h2>
              <button type="button" className="drawer-close" onClick={() => setMapDrawer(null)}>×</button>
            </div>
            <div className="drawer-body">
              <div className="form-group">
                <label>Тип записи</label>
                <select
                  value={formMap.recordType}
                  onChange={(e) => setFormMap((f) => ({ ...f, recordType: e.target.value as RiskMapCardRecordType }))}
                  disabled={mapDrawer === 'view'}
                >
                  {CARD_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Заголовок</label>
                <input
                  value={formMap.title}
                  onChange={(e) => setFormMap((f) => ({ ...f, title: e.target.value }))}
                  disabled={mapDrawer === 'view'}
                />
              </div>
              <div className="form-group">
                <label>Описание проблемы</label>
                <textarea
                  value={formMap.description}
                  onChange={(e) => setFormMap((f) => ({ ...f, description: e.target.value }))}
                  rows={5}
                  disabled={mapDrawer === 'view'}
                />
              </div>
              <div className="form-group">
                <label>Принимаемые меры</label>
                <textarea
                  value={formMap.measures}
                  onChange={(e) => setFormMap((f) => ({ ...f, measures: e.target.value }))}
                  rows={5}
                  disabled={mapDrawer === 'view'}
                />
              </div>
              <div className="form-group">
                <label>Уровень</label>
                <select
                  value={formMap.level}
                  onChange={(e) => setFormMap((f) => ({ ...f, level: e.target.value as RiskMapCardLevel }))}
                  disabled={mapDrawer === 'view'}
                >
                  {CARD_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              {mapDrawer === 'add' && (
                <p className="form-hint">Статус при сохранении будет «Активный».</p>
              )}
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setMapDrawer(null)}>Отменить</button>
              {mapDrawer === 'view' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => editingMapId && setMapDrawer('edit')}
                >
                  Редактировать
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={submitMap}>
                  {mapDrawer === 'add' ? 'Создать' : 'Сохранить'}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
