// Unified async database interface.
// Routes to PostgreSQL (pg-db) when POSTGRES_URL is set, otherwise SQLite (local/db).

type Row = Record<string, unknown>

const IS_PG = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL)

// ── Lazy loaders ──────────────────────────────────────────────────────────────

async function pg() {
  return await import('./local/pg-db')
}

// SQLite is synchronous — wrap in Promise.resolve so callers always await
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sq = () => require('./local/db') as typeof import('./local/db')

// ── User operations ───────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<(Row & { password_hash: string }) | null> {
  if (IS_PG) return (await pg()).getUserByEmail(email)
  return Promise.resolve(sq().getUserByEmail(email))
}

export async function getUserById(id: string): Promise<Row | null> {
  if (IS_PG) return (await pg()).getUserById(id)
  return Promise.resolve(sq().getUserById(id))
}

export async function createUser(email: string, passwordHash: string, contactName?: string): Promise<Row> {
  if (IS_PG) return (await pg()).createUser(email, passwordHash, contactName)
  return Promise.resolve(sq().createUser(email, passwordHash, contactName))
}

// ── Profile operations ────────────────────────────────────────────────────────

export async function createProfile(userId: string, email: string, contactName?: string, tier?: string): Promise<void> {
  if (IS_PG) return (await pg()).createProfile(userId, email, contactName, tier)
  return Promise.resolve(sq().createProfile(userId, email, contactName, tier))
}

export async function getProfile(userId: string): Promise<Row | null> {
  if (IS_PG) return (await pg()).getProfile(userId)
  return Promise.resolve(sq().getProfile(userId))
}

export async function updateProfile(userId: string, data: Row): Promise<void> {
  if (IS_PG) return (await pg()).updateProfile(userId, data)
  return Promise.resolve(sq().updateProfile(userId, data))
}

// ── Client operations ─────────────────────────────────────────────────────────

export async function getClients(userId: string): Promise<Row[]> {
  if (IS_PG) return (await pg()).getClients(userId)
  return Promise.resolve(sq().getClients(userId))
}

export async function getClient(id: string, userId: string): Promise<Row | null> {
  if (IS_PG) return (await pg()).getClient(id, userId)
  return Promise.resolve(sq().getClient(id, userId))
}

export async function createClientRecord(userId: string, data: Row): Promise<Row> {
  if (IS_PG) return (await pg()).createClientRecord(userId, data)
  return Promise.resolve(sq().createClientRecord(userId, data))
}

export async function updateClientRecord(id: string, userId: string, data: Row): Promise<Row | null> {
  if (IS_PG) return (await pg()).updateClientRecord(id, userId, data)
  return Promise.resolve(sq().updateClientRecord(id, userId, data))
}

export async function deleteClientRecord(id: string, userId: string): Promise<void> {
  if (IS_PG) return (await pg()).deleteClientRecord(id, userId)
  return Promise.resolve(sq().deleteClientRecord(id, userId))
}

// ── Quote operations ──────────────────────────────────────────────────────────

export async function getQuotes(userId: string, limit?: number): Promise<Row[]> {
  if (IS_PG) return (await pg()).getQuotes(userId, limit)
  return Promise.resolve(sq().getQuotes(userId, limit))
}

export async function getQuote(id: string, userId: string): Promise<Row | null> {
  if (IS_PG) return (await pg()).getQuote(id, userId)
  return Promise.resolve(sq().getQuote(id, userId))
}

export async function createQuoteRecord(userId: string, data: Row): Promise<Row> {
  if (IS_PG) return (await pg()).createQuoteRecord(userId, data)
  return Promise.resolve(sq().createQuoteRecord(userId, data))
}

export async function updateQuoteRecord(id: string, userId: string, data: Row): Promise<Row | null> {
  if (IS_PG) return (await pg()).updateQuoteRecord(id, userId, data)
  return Promise.resolve(sq().updateQuoteRecord(id, userId, data))
}

export async function countQuotes(userId: string): Promise<number> {
  if (IS_PG) return (await pg()).countQuotes(userId)
  return Promise.resolve(sq().countQuotes(userId))
}

// ── Template operations ───────────────────────────────────────────────────────

export async function getTemplates(userId: string): Promise<Row[]> {
  if (IS_PG) return (await pg()).getTemplates(userId)
  return Promise.resolve(sq().getTemplates(userId))
}

export async function createTemplate(userId: string, data: Row): Promise<Row> {
  if (IS_PG) return (await pg()).createTemplate(userId, data)
  return Promise.resolve(sq().createTemplate(userId, data))
}
