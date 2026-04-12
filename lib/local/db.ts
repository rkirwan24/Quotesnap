import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = path.join(DATA_DIR, 'quotesnap.db')

let _db: Database.Database | null = null

export function getDB(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
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
      default_margin_percent REAL DEFAULT 20,
      default_gst_included INTEGER DEFAULT 1,
      payment_terms TEXT DEFAULT 'Payment due within 14 days of acceptance',
      quote_validity_days INTEGER DEFAULT 30,
      bank_details TEXT,
      stripe_customer_id TEXT,
      subscription_status TEXT DEFAULT 'trial',
      subscription_tier TEXT DEFAULT 'pro',
      trial_ends_at TEXT,
      quotes_this_month INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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
      created_at TEXT DEFAULT (datetime('now'))
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
      line_items TEXT DEFAULT '[]',
      subtotal REAL DEFAULT 0,
      margin_percent REAL DEFAULT 20,
      margin_amount REAL DEFAULT 0,
      gst_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      gst_included INTEGER DEFAULT 1,
      scope_of_work TEXT,
      exclusions TEXT,
      assumptions TEXT,
      timeline TEXT,
      payment_terms TEXT,
      validity_days INTEGER DEFAULT 30,
      voice_note_url TEXT,
      voice_transcript TEXT,
      photo_urls TEXT DEFAULT '[]',
      photo_analysis TEXT,
      pdf_url TEXT,
      sent_at TEXT,
      accepted_at TEXT,
      declined_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quote_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      job_type TEXT,
      default_line_items TEXT DEFAULT '[]',
      default_scope TEXT,
      default_exclusions TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

// ── Generic query builder matching Supabase-ish API ───────────────────────────

type Row = Record<string, unknown>

function parseRow(row: Row): Row {
  const result: Row = {}
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === 'string') {
      // Try JSON parse for known JSON columns
      if (k === 'line_items' || k === 'photo_urls' || k === 'default_line_items') {
        try { result[k] = JSON.parse(v as string) } catch { result[k] = v }
      } else {
        result[k] = v
      }
    } else if (typeof v === 'number' && (k === 'default_gst_included' || k === 'gst_included')) {
      result[k] = v === 1
    } else {
      result[k] = v
    }
  }
  return result
}

function serializeForDB(obj: Row): Row {
  const result: Row = {}
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'line_items' || k === 'photo_urls' || k === 'default_line_items') {
      result[k] = typeof v === 'string' ? v : JSON.stringify(v)
    } else if (typeof v === 'boolean') {
      result[k] = v ? 1 : 0
    } else {
      result[k] = v
    }
  }
  return result
}

// ── Profile operations ────────────────────────────────────────────────────────

export function createProfile(userId: string, email: string, contactName?: string, tier = 'pro') {
  const db = getDB()
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  db.prepare(`
    INSERT OR IGNORE INTO profiles (id, email, contact_name, subscription_tier, subscription_status, trial_ends_at)
    VALUES (?, ?, ?, ?, 'trial', ?)
  `).run(userId, email, contactName || null, tier, trialEndsAt)
}

export function getProfile(userId: string): Row | null {
  const db = getDB()
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(userId) as Row | undefined
  return row ? parseRow(row) : null
}

export function updateProfile(userId: string, data: Row): void {
  const db = getDB()
  const serialized = serializeForDB(data)
  const updates = Object.keys(serialized).map((k) => `${k} = ?`).join(', ')
  const values = Object.values(serialized)
  db.prepare(`UPDATE profiles SET ${updates}, updated_at = datetime('now') WHERE id = ?`).run(...values, userId)
}

// ── Client operations ─────────────────────────────────────────────────────────

export function getClients(userId: string): Row[] {
  const db = getDB()
  return (db.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY name').all(userId) as Row[])
    .map(parseRow)
}

export function getClient(id: string, userId: string): Row | null {
  const db = getDB()
  const row = db.prepare('SELECT * FROM clients WHERE id = ? AND user_id = ?').get(id, userId) as Row | undefined
  return row ? parseRow(row) : null
}

export function createClientRecord(userId: string, data: Row): Row {
  const db = getDB()
  const id = uuidv4()
  const serialized = serializeForDB({ ...data, id, user_id: userId })
  const keys = Object.keys(serialized).join(', ')
  const placeholders = Object.keys(serialized).map(() => '?').join(', ')
  db.prepare(`INSERT INTO clients (${keys}) VALUES (${placeholders})`).run(...Object.values(serialized))
  return getClient(id, userId)!
}

export function updateClientRecord(id: string, userId: string, data: Row): Row | null {
  const db = getDB()
  const serialized = serializeForDB(data)
  const updates = Object.keys(serialized).map((k) => `${k} = ?`).join(', ')
  db.prepare(`UPDATE clients SET ${updates} WHERE id = ? AND user_id = ?`).run(...Object.values(serialized), id, userId)
  return getClient(id, userId)
}

export function deleteClientRecord(id: string, userId: string): void {
  const db = getDB()
  db.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?').run(id, userId)
}

// ── Quote operations ──────────────────────────────────────────────────────────

function attachClientToQuote(quote: Row, userId: string): Row {
  if (quote.client_id) {
    const client = getClient(quote.client_id as string, userId)
    return { ...quote, client }
  }
  return { ...quote, client: null }
}

export function getQuotes(userId: string, limit?: number): Row[] {
  const db = getDB()
  const stmt = limit
    ? db.prepare('SELECT * FROM quotes WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    : db.prepare('SELECT * FROM quotes WHERE user_id = ? ORDER BY created_at DESC')
  const rows = (limit ? stmt.all(userId, limit) : stmt.all(userId)) as Row[]
  return rows.map(parseRow).map((q) => attachClientToQuote(q, userId))
}

export function getQuote(id: string, userId: string): Row | null {
  const db = getDB()
  const row = db.prepare('SELECT * FROM quotes WHERE id = ? AND user_id = ?').get(id, userId) as Row | undefined
  if (!row) return null
  return attachClientToQuote(parseRow(row), userId)
}

export function createQuoteRecord(userId: string, data: Row): Row {
  const db = getDB()
  const id = uuidv4()
  const serialized = serializeForDB({ ...data, id, user_id: userId })
  const keys = Object.keys(serialized).join(', ')
  const placeholders = Object.keys(serialized).map(() => '?').join(', ')
  db.prepare(`INSERT INTO quotes (${keys}) VALUES (${placeholders})`).run(...Object.values(serialized))
  return getQuote(id, userId)!
}

export function updateQuoteRecord(id: string, userId: string, data: Row): Row | null {
  const db = getDB()
  const serialized = serializeForDB(data)
  const updates = Object.keys(serialized).map((k) => `${k} = ?`).join(', ')
  db.prepare(`UPDATE quotes SET ${updates}, updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(
    ...Object.values(serialized), id, userId
  )
  return getQuote(id, userId)
}

export function countQuotes(userId: string): number {
  const db = getDB()
  const result = db.prepare('SELECT COUNT(*) as count FROM quotes WHERE user_id = ?').get(userId) as { count: number }
  return result.count
}

// ── Template operations ───────────────────────────────────────────────────────

export function getTemplates(userId: string): Row[] {
  const db = getDB()
  return (db.prepare('SELECT * FROM quote_templates WHERE user_id = ? ORDER BY name').all(userId) as Row[]).map(parseRow)
}

export function createTemplate(userId: string, data: Row): Row {
  const db = getDB()
  const id = uuidv4()
  const serialized = serializeForDB({ ...data, id, user_id: userId })
  const keys = Object.keys(serialized).join(', ')
  const placeholders = Object.keys(serialized).map(() => '?').join(', ')
  db.prepare(`INSERT INTO quote_templates (${keys}) VALUES (${placeholders})`).run(...Object.values(serialized))
  return db.prepare('SELECT * FROM quote_templates WHERE id = ?').get(id) as Row
}

// ── User/auth operations ──────────────────────────────────────────────────────

export function getUserByEmail(email: string): (Row & { password_hash: string }) | null {
  const db = getDB()
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as (Row & { password_hash: string }) | null
}

export function getUserById(id: string): Row | null {
  const db = getDB()
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Row | null
}

export function createUser(email: string, passwordHash: string, contactName?: string): Row {
  const db = getDB()
  const id = uuidv4()
  db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, email, passwordHash)
  createProfile(id, email, contactName)
  return { id, email }
}
