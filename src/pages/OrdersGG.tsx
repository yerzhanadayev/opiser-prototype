import { mockExport } from '../utils/storage'
import type { OrderGG } from '../types'

const MOCK_ORDERS: OrderGG[] = [
  {
    id: '1',
    number: '№ 1-ГГ',
    description: 'Обеспечить выполнение плана по строительству объектов образования в 2025 г.',
    executor: 'Управление образования',
    deadline: '31.12.2025',
    status: 'В работе',
    lastComment: 'Подрядчик приступил к работам, сроки соблюдаются. Отчёт за ноябрь направлен.',
  },
  {
    id: '2',
    number: '№ 2-ГГ',
    description: 'Проработать вопрос увеличения охвата детей дошкольными организациями.',
    executor: 'Управление образования',
    deadline: '30.06.2025',
    status: 'В работе',
    lastComment: 'Проведён мониторинг очередей. Подготовлены предложения по новым объектам.',
  },
  {
    id: '3',
    number: '№ 3-ГГ',
    description: 'Обеспечить проведение мероприятий по поддержке МСБ в регионе.',
    executor: 'Управление экономики и бюджетного планирования',
    deadline: '31.12.2025',
    status: 'В работе',
    lastComment: 'Выдано 45 грантов. Следующая комиссия — 15.03.2025.',
  },
]

export default function OrdersGG() {
  return (
    <>
      <div className="breadcrumb">ОПИСЭР / Поручения ГГ</div>
      <div className="page-header">
        <h1 className="page-title">Поручения ГГ</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={() => mockExport('pdf')}>
            Выгрузить в PDF
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => mockExport('pptx')}>
            Выгрузить в PPTX
          </button>
        </div>
      </div>
      <div className="page-body">
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
          Данные подтягиваются из основного модуля «Поручения» (статус «В работе»). Только просмотр.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Номер / суть поручения</th>
                <th>Исполнитель</th>
                <th>Срок</th>
                <th>Статус</th>
                <th>Последний комментарий исполнителя</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ORDERS.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.number}</strong>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{o.description}</div>
                  </td>
                  <td>{o.executor}</td>
                  <td>{o.deadline}</td>
                  <td><span className="badge badge-active">{o.status}</span></td>
                  <td style={{ maxWidth: 320 }}>{o.lastComment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
