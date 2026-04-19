import { getSessionFromCookies } from './auth'
import {
  getProfile,
  updateProfile,
  getClients,
  createClientRecord,
  updateClientRecord,
  deleteClientRecord,
  getQuotes,
  getQuote,
  createQuoteRecord,
  updateQuoteRecord,
  countQuotes,
  getTemplates,
  createTemplate,
} from '../db'

type Row = Record<string, unknown>
type QRes<T = Row | Row[]> = { data: T | null; error: Error | null; count?: number | null }

function ok<T>(data: T, count?: number): QRes<T> {
  return { data, error: null, count: count ?? null }
}

class ServerQueryBuilder {
  private _table: string
  private _conditions: Array<[string, string, unknown]> = []
  private _notConds: Array<[string, string, unknown]> = []
  private _limitVal?: number
  private _op = 'select'
  private _payload?: Row
  private _countExact = false
  private _userId: string

  constructor(table: string, userId: string) {
    this._table = table
    this._userId = userId
  }

  select(_cols = '*', opts?: { count?: string }) {
    this._op = 'select'
    if (opts?.count === 'exact') this._countExact = true
    return this
  }

  insert(payload: Row) { this._payload = payload; this._op = 'insert'; return this }
  update(payload: Row) { this._payload = payload; this._op = 'update'; return this }
  upsert(payload: Row) { this._payload = payload; this._op = 'upsert'; return this }
  delete() { this._op = 'delete'; return this }

  eq(field: string, value: unknown) {
    this._conditions.push([field, 'eq', value])
    return this
  }

  not(field: string, op: string, value: unknown) {
    this._notConds.push([field, op, value])
    return this
  }

  order(_field: string, _opts?: { ascending?: boolean }) { return this }
  limit(n: number) { this._limitVal = n; return this }

  async single(): Promise<{ data: Row | null; error: Error | null }> {
    const result = await this._exec()
    if (result.error) return { data: null, error: result.error }
    const arr = Array.isArray(result.data) ? result.data : result.data ? [result.data] : []
    return { data: arr[0] ?? null, error: null }
  }

  then<T>(
    resolve?: ((v: QRes) => T) | null,
    reject?: ((e: unknown) => T) | null,
  ) {
    return this._exec().then(resolve as never, reject as never)
  }

  private async _exec(): Promise<QRes> {
    try {
      return await this._execInner()
    } catch (err) {
      console.error('[ServerQueryBuilder]', this._table, this._op, err)
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  private async _execInner(): Promise<QRes> {
    const eqMap = Object.fromEntries(
      this._conditions.filter(([, op]) => op === 'eq').map(([f, , v]) => [f, v])
    )

    if (this._op === 'select') {
      switch (this._table) {
        case 'profiles': {
          const p = await getProfile(this._userId)
          return ok(p ? [p] : [])
        }
        case 'clients': {
          const rows = await getClients(this._userId)
          return ok(rows)
        }
        case 'quotes': {
          if (eqMap.id) {
            const q = await getQuote(eqMap.id as string, this._userId)
            return ok(q ? [q] : [])
          }
          if (this._countExact) {
            return ok([], await countQuotes(this._userId))
          }
          let rows = await getQuotes(this._userId, this._limitVal)
          for (const [field, op, value] of this._notConds) {
            if (op === 'is' && value === null) {
              rows = rows.filter((r) => r[field] != null)
            }
          }
          return ok(rows)
        }
        case 'quote_templates': {
          const rows = await getTemplates(this._userId)
          return ok(rows)
        }
        default:
          return ok([])
      }
    }

    if (this._op === 'insert') {
      const payload = this._payload || {}
      switch (this._table) {
        case 'clients': return ok([await createClientRecord(this._userId, payload)])
        case 'quotes': return ok([await createQuoteRecord(this._userId, payload)])
        case 'quote_templates': return ok([await createTemplate(this._userId, payload)])
        default: return { data: null, error: new Error(`Insert not supported: ${this._table}`) }
      }
    }

    if (this._op === 'update') {
      const payload = this._payload || {}
      switch (this._table) {
        case 'profiles': {
          await updateProfile(this._userId, payload)
          return ok([])
        }
        case 'clients': {
          const r = await updateClientRecord(eqMap.id as string, this._userId, payload)
          return ok(r ? [r] : [])
        }
        case 'quotes': {
          const r = await updateQuoteRecord(eqMap.id as string, this._userId, payload)
          return ok(r ? [r] : [])
        }
        default: return { data: null, error: new Error(`Update not supported: ${this._table}`) }
      }
    }

    if (this._op === 'upsert') {
      if (this._table === 'profiles') {
        await updateProfile(this._userId, this._payload || {})
        return ok([])
      }
      return { data: null, error: new Error(`Upsert not supported: ${this._table}`) }
    }

    if (this._op === 'delete') {
      if (this._table === 'clients') {
        await deleteClientRecord(eqMap.id as string, this._userId)
        return ok([])
      }
      return { data: null, error: new Error(`Delete not supported: ${this._table}`) }
    }

    return { data: null, error: new Error('Unknown operation') }
  }
}

class LocalServerAuth {
  constructor(
    private _userId: string | null,
    private _email: string | null,
  ) {}

  async getUser() {
    return {
      data: {
        user: this._userId ? { id: this._userId, email: this._email } : null,
      },
    }
  }
}

export class LocalServerClient {
  auth: LocalServerAuth

  constructor(
    private _userId: string | null,
    email: string | null,
  ) {
    this.auth = new LocalServerAuth(_userId, email)
  }

  from(table: string) {
    return new ServerQueryBuilder(table, this._userId || '')
  }

  storage = {
    from: (bucket: string) => ({
      upload: async (_path: string, _file: unknown) => ({
        data: null,
        error: new Error('Use /api/local/upload'),
      }),
      getPublicUrl: (filePath: string) => ({
        data: { publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/storage/${bucket}/${filePath}` },
      }),
    }),
  }
}

export async function createLocalServerClient(): Promise<LocalServerClient> {
  const session = await getSessionFromCookies()
  if (!session) return new LocalServerClient(null, null)
  return new LocalServerClient(session.userId, session.email)
}
