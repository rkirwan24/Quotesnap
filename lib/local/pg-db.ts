// PostgreSQL implementation of all database operations.
// Used when POSTGRES_URL env var is set.
import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'

type Row = Record<string, unknown>

let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    // Prefer non-pooling URL for Vercel Postgres (Neon) to avoid pgBouncer limits on DDL
    const url = process.env.POSTGRES_URL_NON_POOLING
      || process.env.POSTGRES_URL
      || process.env.DATABASE_URL
      || ''
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1')
    _pool = new Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    })
    _pool.on('error', (err) => {
      console.error('[pg pool] idle client error', err.message)
    })
  }
  return _pool
}

let _schemaReady = false

async function ensureSchema(): Promise<void> {
  if (_schemaReady) return
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY REFERENCES users(id),
      business_name TEXT,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      abn TEXT,
      license_number TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      postcode TEXT,
      logo_url TEXT,
      brand_color TEXT DEFAULT '#C9982A',
      default_margin_percent NUMERIC DEFAULT 20,
      default_gst_included BOOLEAN DEFAULT TRUE,
      payment_terms TEXT DEFAULT 'Payment due within 14 days of acceptance',
      quote_validity_days INTEGER DEFAULT 30,
      bank_details TEXT,
      stripe_customer_id TEXT,
      subscription_status TEXT DEFAULT 'trial',
      subscription_tier TEXT DEFAULT 'pro',
      trial_ends_at TIMESTAMPTZ,
      quotes_this_month INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      postcode TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      quote_number TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      job_type TEXT,
      job_description TEXT,
      site_notes TEXT,
      line_items JSONB DEFAULT '[]',
      subtotal NUMERIC DEFAULT 0,
      margin_percent NUMERIC DEFAULT 20,
      margin_amount NUMERIC DEFAULT 0,
      gst_amount NUMERIC DEFAULT 0,
      total NUMERIC DEFAULT 0,
      gst_included BOOLEAN DEFAULT TRUE,
      scope_of_work TEXT,
      exclusions TEXT,
      assumptions TEXT,
      timeline TEXT,
      payment_terms TEXT,
      validity_days INTEGER DEFAULT 30,
      voice_note_url TEXT,
      voice_transcript TEXT,
      photo_urls JSONB DEFAULT '[]',
      photo_analysis TEXT,
      pdf_url TEXT,
      sent_at TIMESTAMPTZ,
      accepted_at TIMESTAMPTZ,
      declined_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quote_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      job_type TEXT,
      default_line_items JSONB DEFAULT '[]',
      default_scope TEXT,
      default_exclusions TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  _schemaReady = true
}

export async function ping(): Promise<void> {
  const result = await getPool().query('SELECT 1 AS ping')
  if (!result.rows[0]) throw new Error('Postgres ping failed')
}

async function q(text: string, params?: unknown[]): Promise<Row[]> {
  await ensureSchema()
  const result = await getPool().query(text, params)
  return result.rows as Row[]
}

// Serialize values for Postgres JSONB columns
function pgVal(key: string, val: unknown): unknown {
  const jsonCols = ['line_items', 'photo_urls', 'default_line_items']
  if (jsonCols.includes(key) && typeof val !== 'string') return JSON.stringify(val ?? [])
  return val ?? null
}

// ── User operations ───────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<(Row & { password_hash: string }) | null> {
  const rows = await q('SELECT * FROM users WHERE email = $1', [email])
  return (rows[0] as (Row & { password_hash: string })) || null
}

export async function getUserById(id: string): Promise<Row | null> {
  const rows = await q('SELECT * FROM users WHERE id = $1', [id])
  return rows[0] || null
}

export async function createUser(email: string, passwordHash: string, contactName?: string, tier?: string): Promise<Row> {
  const id = uuidv4()
  await q('INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)', [id, email, passwordHash])
  await createProfile(id, email, contactName, tier)
  return { id, email }
}

// ── Profile operations ────────────────────────────────────────────────────────

export async function createProfile(userId: string, email: string, contactName?: string, tier = 'pro'): Promise<void> {
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  await q(
    `INSERT INTO profiles (id, email, contact_name, subscription_tier, subscription_status, trial_ends_at)
     VALUES ($1, $2, $3, $4, 'trial', $5) ON CONFLICT (id) DO NOTHING`,
    [userId, email, contactName || null, tier, trialEndsAt]
  )
}

export async function getProfile(userId: string): Promise<Row | null> {
  const rows = await q('SELECT * FROM profiles WHERE id = $1', [userId])
  return rows[0] || null
}

export async function updateProfile(userId: string, data: Row): Promise<void> {
  const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'user_id')
  if (keys.length === 0) return
  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
  const values = keys.map(k => pgVal(k, data[k]))
  await q(
    `UPDATE profiles SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1}`,
    [...values, userId]
  )
}

// ── Client operations ─────────────────────────────────────────────────────────

export async function getClients(userId: string): Promise<Row[]> {
  return q('SELECT * FROM clients WHERE user_id = $1 ORDER BY name', [userId])
}

export async function getClient(id: string, userId: string): Promise<Row | null> {
  const rows = await q('SELECT * FROM clients WHERE id = $1 AND user_id = $2', [id, userId])
  return rows[0] || null
}

export async function createClientRecord(userId: string, data: Row): Promise<Row> {
  const id = uuidv4()
  const cols = ['id', 'user_id', 'name', 'email', 'phone', 'address', 'city', 'state', 'postcode', 'notes']
  const vals = [id, userId, data.name, data.email, data.phone, data.address, data.city, data.state, data.postcode, data.notes].map(v => v ?? null)
  await q(
    `INSERT INTO clients (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})`,
    vals
  )
  return (await getClient(id, userId))!
}

export async function updateClientRecord(id: string, userId: string, data: Row): Promise<Row | null> {
  const keys = Object.keys(data).filter(k => !['id', 'user_id'].includes(k))
  if (keys.length === 0) return getClient(id, userId)
  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
  const values = keys.map(k => data[k] ?? null)
  await q(
    `UPDATE clients SET ${setClause} WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2}`,
    [...values, id, userId]
  )
  return getClient(id, userId)
}

export async function deleteClientRecord(id: string, userId: string): Promise<void> {
  await q('DELETE FROM clients WHERE id = $1 AND user_id = $2', [id, userId])
}

// ── Quote operations ──────────────────────────────────────────────────────────

async function attachClient(quote: Row, userId: string): Promise<Row> {
  if (quote.client_id) {
    const client = await getClient(quote.client_id as string, userId)
    return { ...quote, client }
  }
  return { ...quote, client: null }
}

export async function getQuotes(userId: string, limit?: number): Promise<Row[]> {
  const rows = await q(
    limit
      ? 'SELECT * FROM quotes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2'
      : 'SELECT * FROM quotes WHERE user_id = $1 ORDER BY created_at DESC',
    limit ? [userId, limit] : [userId]
  )
  return Promise.all(rows.map(r => attachClient(r, userId)))
}

export async function getQuote(id: string, userId: string): Promise<Row | null> {
  const rows = await q('SELECT * FROM quotes WHERE id = $1 AND user_id = $2', [id, userId])
  if (!rows[0]) return null
  return attachClient(rows[0], userId)
}

export async function createQuoteRecord(userId: string, data: Row): Promise<Row> {
  const id = uuidv4()
  const d: Row = { ...data, id, user_id: userId }
  const keys = Object.keys(d)
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
  const values = keys.map(k => pgVal(k, d[k]))
  await q(
    `INSERT INTO quotes (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders})`,
    values
  )
  return (await getQuote(id, userId))!
}

export async function updateQuoteRecord(id: string, userId: string, data: Row): Promise<Row | null> {
  const keys = Object.keys(data).filter(k => !['id', 'user_id'].includes(k))
  if (keys.length === 0) return getQuote(id, userId)
  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
  const values = keys.map(k => pgVal(k, data[k]))
  await q(
    `UPDATE quotes SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2}`,
    [...values, id, userId]
  )
  return getQuote(id, userId)
}

export async function countQuotes(userId: string): Promise<number> {
  const rows = await q('SELECT COUNT(*) AS count FROM quotes WHERE user_id = $1', [userId])
  return Number(rows[0]?.count ?? 0)
}

// ── Template operations ───────────────────────────────────────────────────────

export async function getTemplates(userId: string): Promise<Row[]> {
  return q('SELECT * FROM quote_templates WHERE user_id = $1 ORDER BY name', [userId])
}

export async function createTemplate(userId: string, data: Row): Promise<Row> {
  const id = uuidv4()
  await q(
    `INSERT INTO quote_templates (id, user_id, name, job_type, default_line_items, default_scope, default_exclusions)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      id, userId,
      data.name,
      data.job_type || null,
      JSON.stringify(data.default_line_items || []),
      data.default_scope || null,
      data.default_exclusions || null,
    ]
  )
  const rows = await q('SELECT * FROM quote_templates WHERE id = $1', [id])
  return rows[0]
}
