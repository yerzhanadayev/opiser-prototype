import type { Leader, Party } from '../types'

const LEADERS_KEY = 'opiser_leaders'
const PARTIES_KEY = 'opiser_parties'

export function getLeaders(): Leader[] {
  try {
    const raw = localStorage.getItem(LEADERS_KEY)
    const data: unknown[] = raw ? JSON.parse(raw) : []
    return data.map((l) => {
      const row = l as Record<string, unknown>
      const { organization: _o, phone, contacts, ...rest } = row
      return {
        ...rest,
        contacts: Array.isArray(contacts) ? (contacts as string[]) : typeof phone === 'string' && phone ? [phone] : [],
      } as Leader
    })
  } catch {
    return []
  }
}

export function setLeaders(data: Leader[]) {
  localStorage.setItem(LEADERS_KEY, JSON.stringify(data))
}

export function getParties(): Party[] {
  try {
    const raw = localStorage.getItem(PARTIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setParties(data: Party[]) {
  localStorage.setItem(PARTIES_KEY, JSON.stringify(data))
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export function mockExport(format: 'pdf' | 'pptx') {
  const name = `выгрузка_${format}_${Date.now()}.${format}`
  const blob = new Blob(['Прототип: выгрузка выполнена'], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
