import { useState, useEffect } from 'react'
import type { Leader, Party } from '../types'
import { CATEGORIES } from '../types'
import { getLeaders, setLeaders, getParties, setParties, fileToDataUrl, mockExport } from '../utils/storage'

type Tab = 'leaders' | 'party'
type LeaderDrawerMode = 'add' | 'edit' | 'view' | null
type PartyDrawerMode = 'add' | 'edit' | 'view' | null

const emptyLeader = (): Omit<Leader, 'id' | 'updatedAt' | 'status'> => ({
  category: '',
  fio: '',
  photo: undefined,
  birthDate: '',
  appointmentDate: '',
  position: '',
  partyAffiliation: '',
  supervisedIssues: '',
  characteristic: '',
  additionalDescription: '',
  contacts: [],
})

const emptyParty = (): Omit<Party, 'id' | 'updatedAt' | 'status'> => ({
  name: '',
  logo: undefined,
  chairman: '',
  membership: 0,
  deputiesCount: 0,
})

export default function Kadry() {
  const [tab, setTab] = useState<Tab>('leaders')
  const [leaders, setLeadersState] = useState<Leader[]>([])
  const [parties, setPartiesState] = useState<Party[]>([])
  const [leaderDrawer, setLeaderDrawer] = useState<LeaderDrawerMode>(null)
  const [partyDrawer, setPartyDrawer] = useState<PartyDrawerMode>(null)
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null)
  const [editingParty, setEditingParty] = useState<Party | null>(null)
  const [formLeader, setFormLeader] = useState(emptyLeader())
  const [formParty, setFormParty] = useState(emptyParty())
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  useEffect(() => {
    setLeadersState(getLeaders())
    setPartiesState(getParties())
  }, [])

  const saveLeaders = (next: Leader[]) => {
    setLeadersState(next)
    setLeaders(next)
  }
  const saveParties = (next: Party[]) => {
    setPartiesState(next)
    setParties(next)
  }

  const filteredLeaders = leaders.filter((l) => {
    if (search && !l.fio.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCat && l.category !== filterCat) return false
    return true
  })

  const openAddLeader = () => {
    setFormLeader(emptyLeader())
    setEditingLeader(null)
    setLeaderDrawer('add')
  }
  const openEditLeader = (l: Leader) => {
    setEditingLeader(l)
    setFormLeader({
      category: l.category,
      fio: l.fio,
      photo: l.photo,
      birthDate: l.birthDate,
      appointmentDate: l.appointmentDate,
      position: l.position,
      partyAffiliation: l.partyAffiliation ?? '',
      supervisedIssues: l.supervisedIssues,
      characteristic: l.characteristic,
      additionalDescription: l.additionalDescription ?? '',
      contacts: l.contacts?.length ? [...l.contacts] : [],
    })
    setLeaderDrawer('edit')
  }
  const openViewLeader = (l: Leader) => {
    setEditingLeader(l)
    setFormLeader({
      category: l.category,
      fio: l.fio,
      photo: l.photo,
      birthDate: l.birthDate,
      appointmentDate: l.appointmentDate,
      position: l.position,
      partyAffiliation: l.partyAffiliation ?? '',
      supervisedIssues: l.supervisedIssues,
      characteristic: l.characteristic,
      additionalDescription: l.additionalDescription ?? '',
      contacts: l.contacts?.length ? [...l.contacts] : [],
    })
    setLeaderDrawer('view')
  }
  const archiveLeader = (l: Leader) => {
    saveLeaders(leaders.map((x) => (x.id === l.id ? { ...x, status: 'В архиве' as const, updatedAt: new Date().toISOString().slice(0, 10) } : x)))
    setLeaderDrawer(null)
  }
  const saveLeader = () => {
    const updated = new Date().toISOString().slice(0, 10)
    if (editingLeader) {
      saveLeaders(
        leaders.map((x) =>
          x.id === editingLeader.id
            ? { ...x, ...formLeader, updatedAt: updated, status: 'Активен' as const }
            : x
        )
      )
    } else {
      const newLeader: Leader = {
        id: crypto.randomUUID(),
        ...formLeader,
        updatedAt: updated,
        status: 'Активен',
      }
      saveLeaders([...leaders, newLeader])
    }
    setLeaderDrawer(null)
  }
  const onLeaderPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const dataUrl = await fileToDataUrl(f)
    setFormLeader((p) => ({ ...p, photo: dataUrl }))
  }

  const openAddParty = () => {
    setFormParty(emptyParty())
    setEditingParty(null)
    setPartyDrawer('add')
  }
  const openEditParty = (p: Party) => {
    setEditingParty(p)
    setFormParty({
      name: p.name,
      logo: p.logo,
      chairman: p.chairman,
      membership: p.membership,
      deputiesCount: p.deputiesCount,
    })
    setPartyDrawer('edit')
  }
  const openViewParty = (p: Party) => {
    setEditingParty(p)
    setFormParty({
      name: p.name,
      logo: p.logo,
      chairman: p.chairman,
      membership: p.membership,
      deputiesCount: p.deputiesCount,
    })
    setPartyDrawer('view')
  }
  const saveParty = () => {
    const updated = new Date().toISOString().slice(0, 10)
    if (editingParty) {
      saveParties(
        parties.map((x) =>
          x.id === editingParty.id ? { ...x, ...formParty, updatedAt: updated, status: 'Активен' as const } : x
        )
      )
    } else {
      const newParty: Party = {
        id: crypto.randomUUID(),
        ...formParty,
        updatedAt: updated,
        status: 'Активен',
      }
      saveParties([...parties, newParty])
    }
    setPartyDrawer(null)
  }
  const onPartyLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const dataUrl = await fileToDataUrl(f)
    setFormParty((p) => ({ ...p, logo: dataUrl }))
  }

  const statusClass = (s: string) => (s === 'Активен' ? 'badge-active' : s === 'В архиве' ? 'badge-archive' : 'badge-update')

  return (
    <>
      <div className="breadcrumb">ОПИСЭР / Реестр кадров</div>
      <div className="page-header">
        <h1 className="page-title">Реестр кадров</h1>
        {tab === 'leaders' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={() => mockExport('pdf')}>
              Выгрузить в PDF
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => mockExport('pptx')}>
              Выгрузить в PPTX
            </button>
            <button type="button" className="btn btn-primary" onClick={openAddLeader}>
              + Добавить кадр
            </button>
          </div>
        )}
        {tab === 'party' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => mockExport('pdf')}>
              Выгрузить в PDF
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => mockExport('pptx')}>
              Выгрузить в PPTX
            </button>
            <button type="button" className="btn btn-primary" onClick={openAddParty}>
              + Добавить партию
            </button>
          </div>
        )}
      </div>
      <div className="page-body">
        <div className="tabs">
          <button type="button" className={`tab ${tab === 'leaders' ? 'active' : ''}`} onClick={() => setTab('leaders')}>
            Кадры
          </button>
          <button type="button" className={`tab ${tab === 'party' ? 'active' : ''}`} onClick={() => setTab('party')}>
            Партии
          </button>
        </div>

        {tab === 'leaders' && (
          <>
            <div className="filters-bar">
              <input
                type="search"
                placeholder="Поиск"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                <option value="">Категория</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button type="button" className="btn btn-secondary">Все фильтры</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th>Должность</th>
                    <th>Дата обновления</th>
                    <th>Статус</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaders.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm">{l.fio.slice(0, 1)}</div>
                          {l.fio}
                        </div>
                      </td>
                      <td>{l.position}</td>
                      <td>{l.updatedAt}</td>
                      <td><span className={`badge ${statusClass(l.status)}`}>{l.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button type="button" className="actions-btn" onClick={() => openViewLeader(l)} title="Просмотр">⋯</button>
                          <button type="button" className="actions-btn" onClick={() => openEditLeader(l)} title="Редактировать">✎</button>
                          {l.status !== 'В архиве' && (
                            <button type="button" className="actions-btn" onClick={() => archiveLeader(l)} title="В архив">Архив</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'party' && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Партия</th>
                  <th>Председатель</th>
                  <th>Дата обновления</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {parties.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.logo ? (
                          <img src={p.logo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                        ) : (
                          <div className="avatar avatar-sm">{p.name.slice(0, 1)}</div>
                        )}
                        {p.name}
                      </div>
                    </td>
                    <td>{p.chairman}</td>
                    <td>{p.updatedAt}</td>
                    <td><span className={`badge ${statusClass(p.status)}`}>{p.status}</span></td>
                    <td>
                      <button type="button" className="actions-btn" onClick={() => openViewParty(p)}>⋯</button>
                      <button type="button" className="actions-btn" onClick={() => openEditParty(p)}>✎</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {leaderDrawer && (
        <>
          <div className="drawer-overlay" onClick={() => setLeaderDrawer(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <h2 className="drawer-title">
                {leaderDrawer === 'add' ? 'Добавить руководителя' : leaderDrawer === 'view' ? 'Карточка руководителя' : 'Редактировать руководителя'}
              </h2>
              <button type="button" className="drawer-close" onClick={() => setLeaderDrawer(null)}>×</button>
            </div>
            <div className="drawer-body">
              <div className="form-group">
                <label>Основные детали</label>
              </div>
              <div className="form-group">
                <label>Вложение (фото)</label>
                <input type="file" accept="image/*" onChange={onLeaderPhoto} disabled={leaderDrawer === 'view'} />
                <small className="form-hint">Не более 1 МБ. Форматы: PNG, JPG, JPEG.</small>
              </div>
              <div className="form-group">
                <label>Категория</label>
                <select value={formLeader.category} onChange={(e) => setFormLeader((p) => ({ ...p, category: e.target.value }))} disabled={leaderDrawer === 'view'}>
                  <option value="">Выбрать</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>ФИО руководителя</label>
                <input value={formLeader.fio} onChange={(e) => setFormLeader((p) => ({ ...p, fio: e.target.value }))} placeholder="Введите" disabled={leaderDrawer === 'view'} />
              </div>
              <div className="form-group">
                <label>Дата назначения</label>
                <input type="date" value={formLeader.appointmentDate} onChange={(e) => setFormLeader((p) => ({ ...p, appointmentDate: e.target.value }))} disabled={leaderDrawer === 'view'} />
              </div>
              <div className="form-group">
                <label>Дата рождения</label>
                <input type="date" value={formLeader.birthDate} onChange={(e) => setFormLeader((p) => ({ ...p, birthDate: e.target.value }))} disabled={leaderDrawer === 'view'} />
              </div>
              <div className="form-group">
                <label>Должность</label>
                <input type="text" value={formLeader.position} onChange={(e) => setFormLeader((p) => ({ ...p, position: e.target.value }))} placeholder="Введите должность" disabled={leaderDrawer === 'view'} />
              </div>
              {formLeader.category === 'Депутаты маслихата' && (
                <div className="form-group">
                  <label>Партийная принадлежность</label>
                  <input value={formLeader.partyAffiliation ?? ''} onChange={(e) => setFormLeader((p) => ({ ...p, partyAffiliation: e.target.value }))} placeholder="Введите" disabled={leaderDrawer === 'view'} />
                </div>
              )}
              {formLeader.category === 'Персональный состав (Заместители акима и Рукап)' && (
                <div className="form-group">
                  <label>Курируемые вопросы</label>
                  <textarea value={formLeader.supervisedIssues} onChange={(e) => setFormLeader((p) => ({ ...p, supervisedIssues: e.target.value }))} placeholder="Введите" disabled={leaderDrawer === 'view'} />
                </div>
              )}
              {formLeader.category === 'Лидеры общественного мнения' && (
                <div className="form-group">
                  <label>Характеристика</label>
                  <textarea value={formLeader.characteristic} onChange={(e) => setFormLeader((p) => ({ ...p, characteristic: e.target.value }))} placeholder="Введите" disabled={leaderDrawer === 'view'} />
                </div>
              )}
              <div className="form-group">
                <label>Доп. описание</label>
                <textarea value={formLeader.additionalDescription ?? ''} onChange={(e) => setFormLeader((p) => ({ ...p, additionalDescription: e.target.value }))} placeholder="Введите" disabled={leaderDrawer === 'view'} />
              </div>
              <div className="form-group">
                <label>Контакты</label>
                {formLeader.contacts.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input value={c} onChange={(e) => setFormLeader((p) => ({ ...p, contacts: p.contacts.map((x, j) => (j === i ? e.target.value : x)) }))} placeholder="Контакт" disabled={leaderDrawer === 'view'} style={{ flex: 1 }} />
                    {leaderDrawer !== 'view' && (
                      <button type="button" className="btn btn-secondary" onClick={() => setFormLeader((p) => ({ ...p, contacts: p.contacts.filter((_, j) => j !== i) }))}>Удалить</button>
                    )}
                  </div>
                ))}
                {leaderDrawer !== 'view' && (
                  <button type="button" className="btn btn-secondary" onClick={() => setFormLeader((p) => ({ ...p, contacts: [...p.contacts, ''] }))}>Добавить контакт</button>
                )}
              </div>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setLeaderDrawer(null)}>Отменить</button>
              {leaderDrawer === 'view' ? (
                <button type="button" className="btn btn-primary" onClick={() => { setLeaderDrawer(null); openEditLeader(editingLeader!) }}>Редактировать</button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={saveLeader}>{editingLeader ? 'Сохранить' : 'Создать'}</button>
              )}
            </div>
          </div>
        </>
      )}

      {partyDrawer && (
        <>
          <div className="drawer-overlay" onClick={() => setPartyDrawer(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <h2 className="drawer-title">
                {partyDrawer === 'add' ? 'Добавить партию' : partyDrawer === 'view' ? editingParty?.name : 'Редактировать партию'}
              </h2>
              <button type="button" className="drawer-close" onClick={() => setPartyDrawer(null)}>×</button>
            </div>
            <div className="drawer-body">
              <div className="form-group">
                <label>Название партии</label>
                <input value={formParty.name} onChange={(e) => setFormParty((p) => ({ ...p, name: e.target.value }))} disabled={partyDrawer === 'view'} />
              </div>
              <div className="form-group">
                <label>Логотип</label>
                <input type="file" accept="image/*" onChange={onPartyLogo} disabled={partyDrawer === 'view'} />
                <small className="form-hint">Не более 1 МБ.</small>
              </div>
              <div className="form-group">
                <label>Председатель</label>
                <input value={formParty.chairman} onChange={(e) => setFormParty((p) => ({ ...p, chairman: e.target.value }))} disabled={partyDrawer === 'view'} />
              </div>
              <div className="form-group">
                <label>Численность (чел.)</label>
                <input type="number" value={formParty.membership || ''} onChange={(e) => setFormParty((p) => ({ ...p, membership: Number(e.target.value) || 0 }))} disabled={partyDrawer === 'view'} />
              </div>
              <div className="form-group">
                <label>Кол-во депутатов</label>
                <input type="number" value={formParty.deputiesCount || ''} onChange={(e) => setFormParty((p) => ({ ...p, deputiesCount: Number(e.target.value) || 0 }))} disabled={partyDrawer === 'view'} />
              </div>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setPartyDrawer(null)}>Отменить</button>
              {partyDrawer === 'view' ? (
                <button type="button" className="btn btn-primary" onClick={() => editingParty && (setPartyDrawer(null), openEditParty(editingParty))}>Редактировать</button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={saveParty}>{editingParty ? 'Сохранить' : 'Создать'}</button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
