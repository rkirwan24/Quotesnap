// Browser-side Supabase-compatible client that routes through local API endpoints

type Row = Record<string, unknown>
type QRes<T = Row[]> = { data: T | null; error: Error | null; count?: number | null }

async function localFetch(url: string, opts?: RequestInit): Promise<Response> {
  return fetch(url, opts)
}

// ── Storage ──────────────────────────────────────────────────────────────────

class StorageRef {
  constructor(private bucket: string) {}

  async upload(filePath: string, file: File | Blob, opts?: { contentType?: string; upsert?: boolean }) {
    const fd = new FormData()
    fd.append('bucket', this.bucket)
    fd.append('path', filePath)
    const fileObj =
      file instanceof File
        ? file
        : new File([file], 'blob', { type: opts?.contentType || 'application/octet-stream' })
    fd.append('file', fileObj)

    const res = await localFetch('/api/local/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { data: null, error: new Error(err.error || 'Upload failed') }
    }
    const json = await res.json()
    return { data: { path: json.path }, error: null }
  }

  getPublicUrl(filePath: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return { data: { publicUrl: `${origin}/api/storage/${this.bucket}/${filePath}` } }
  }
}

class LocalStorageClient {
  from(bucket: string) {
    return new StorageRef(bucket)
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function callAuth(body: Record<string, unknown>) {
  const res = await localFetch('/api/local/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

class LocalAuth {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const json = await callAuth({ action: 'sign-in', email, password })
    if (json.error) return { data: null, error: new Error(json.error) }
    return { data: { user: json.user }, error: null }
  }

  async signUp({
    email,
    password,
    options,
  }: {
    email: string
    password: string
    options?: { emailRedirectTo?: string; data?: { full_name?: string; plan?: string } }
  }) {
    const json = await callAuth({
      action: 'sign-up',
      email,
      password,
      contact_name: options?.data?.full_name,
      plan: options?.data?.plan,
    })
    if (json.error) return { data: null, error: new Error(json.error) }
    return { data: { user: json.user }, error: null }
  }

  async signInWithOtp({ email }: { email: string; options?: unknown }) {
    // Demo mode: magic link immediately signs the user in
    const json = await callAuth({ action: 'magic-link', email })
    if (json.error) return { data: null, error: new Error(json.error) }
    // Cookie is set server-side; redirect to dashboard
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard'
    }
    return { data: null, error: null }
  }

  async getUser() {
    const json = await callAuth({ action: 'get-user' })
    return { data: { user: json.user || null } }
  }

  async signOut() {
    await callAuth({ action: 'sign-out' })
    return { error: null }
  }
}

// ── Query builder ─────────────────────────────────────────────────────────────

class QueryBuilder {
  private _table: string
  private _conditions: Array<[string, string, unknown, string?]> = []
  private _limitVal?: number
  private _op = 'select'
  private _payload?: unknown
  private _countExact = false

  constructor(table: string) {
    this._table = table
  }

  select(_cols = '*', opts?: { count?: string }) {
    this._op = 'select'
    if (opts?.count === 'exact') this._countExact = true
    return this
  }

  insert(payload: unknown) { this._payload = payload; this._op = 'insert'; return this }
  update(payload: unknown) { this._payload = payload; this._op = 'update'; return this }
  upsert(payload: unknown) { this._payload = payload; this._op = 'upsert'; return this }
  delete() { this._op = 'delete'; return this }

  eq(field: string, value: unknown) {
    this._conditions.push([field, 'eq', value])
    return this
  }

  not(field: string, op: string, value: unknown) {
    this._conditions.push([field, 'not', value, op])
    return this
  }

  order(_field: string, _opts?: { ascending?: boolean }) { return this }
  limit(n: number) { this._limitVal = n; return this }

  async single(): Promise<{ data: Row | null; error: Error | null }> {
    const result = await this._exec()
    if (result.error) return { data: null, error: result.error }
    const arr = Array.isArray(result.data) ? result.data : result.data ? [result.data] : []
    return { data: (arr[0] as Row) ?? null, error: null }
  }

  // Thenable — used when awaiting without .single()
  then<T>(
    resolve?: ((v: QRes) => T) | null,
    reject?: ((e: unknown) => T) | null,
  ) {
    return this._exec().then(resolve as never, reject as never)
  }

  private eqMap() {
    return Object.fromEntries(
      this._conditions.filter(([, op]) => op === 'eq').map(([f, , v]) => [f, v])
    )
  }

  private async _exec(): Promise<QRes> {
    const eqM = this.eqMap()

    if (this._op === 'select') {
      const t = this._table
      let endpoint: string
      const params = new URLSearchParams()

      if (t === 'profiles') {
        endpoint = '/api/local/profiles'
      } else if (t === 'clients') {
        endpoint = '/api/local/clients'
      } else if (t === 'quotes') {
        endpoint = '/api/local/quotes'
        if (eqM.id) params.set('id', eqM.id as string)
        if (this._countExact) params.set('countOnly', 'true')
        if (this._limitVal) params.set('limit', String(this._limitVal))
      } else if (t === 'quote_templates') {
        endpoint = '/api/local/templates'
      } else {
        return { data: null, error: new Error(`Unknown table: ${t}`) }
      }

      const qs = params.toString()
      const res = await localFetch(`${endpoint}${qs ? `?${qs}` : ''}`)
      if (!res.ok) return { data: null, error: new Error('Fetch failed') }
      const json = await res.json()

      if (t === 'profiles') return { data: json.profile ? [json.profile] : [], error: null }
      if (t === 'clients') return { data: json.clients || [], error: null }
      if (t === 'quotes') {
        if (this._countExact) return { data: [], error: null, count: json.count ?? 0 }
        if (eqM.id) return { data: json.quote ? [json.quote] : [], error: null }
        return { data: json.quotes || [], error: null }
      }
      if (t === 'quote_templates') return { data: json.templates || [], error: null }
      return { data: [], error: null }
    }

    if (this._op === 'insert') {
      const t = this._table
      let endpoint: string
      if (t === 'clients') endpoint = '/api/local/clients'
      else if (t === 'quotes') endpoint = '/api/local/quotes'
      else if (t === 'quote_templates') endpoint = '/api/local/templates'
      else return { data: null, error: new Error(`Insert not supported: ${t}`) }

      const res = await localFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this._payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { data: null, error: new Error(err.error || 'Insert failed') }
      }
      const json = await res.json()
      const record = json.client ?? json.quote ?? json.template
      return { data: record ? [record] : [], error: null }
    }

    if (this._op === 'update') {
      const t = this._table
      let endpoint: string
      const params = new URLSearchParams()

      if (t === 'profiles') {
        endpoint = '/api/local/profiles'
      } else if (t === 'clients') {
        endpoint = '/api/local/clients'
        if (eqM.id) params.set('id', eqM.id as string)
      } else if (t === 'quotes') {
        endpoint = '/api/local/quotes'
        if (eqM.id) params.set('id', eqM.id as string)
      } else {
        return { data: null, error: new Error(`Update not supported: ${t}`) }
      }

      const qs = params.toString()
      const res = await localFetch(`${endpoint}${qs ? `?${qs}` : ''}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this._payload),
      })
      if (!res.ok) return { data: null, error: new Error('Update failed') }
      const json = await res.json()
      const record = json.profile ?? json.client ?? json.quote
      return { data: record ? [record] : [], error: null }
    }

    if (this._op === 'upsert') {
      if (this._table === 'profiles') {
        const res = await localFetch('/api/local/profiles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this._payload),
        })
        if (!res.ok) return { data: null, error: new Error('Upsert failed') }
        return { data: [], error: null }
      }
      return { data: null, error: new Error(`Upsert not supported: ${this._table}`) }
    }

    if (this._op === 'delete') {
      if (this._table === 'clients') {
        const params = new URLSearchParams()
        if (eqM.id) params.set('id', eqM.id as string)
        const res = await localFetch(`/api/local/clients?${params.toString()}`, {
          method: 'DELETE',
        })
        if (!res.ok) return { data: null, error: new Error('Delete failed') }
        return { data: [], error: null }
      }
      return { data: null, error: new Error(`Delete not supported: ${this._table}`) }
    }

    return { data: null, error: new Error('Unknown operation') }
  }
}

// ── Public client factory ─────────────────────────────────────────────────────

export class LocalBrowserClient {
  auth = new LocalAuth()
  storage = new LocalStorageClient()

  from(table: string) {
    return new QueryBuilder(table)
  }
}

export function createLocalBrowserClient() {
  return new LocalBrowserClient()
}
