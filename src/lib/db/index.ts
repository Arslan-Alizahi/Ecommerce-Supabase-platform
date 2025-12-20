import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { createTables, createTriggers } from './schema'
import { seedDatabase } from './seed'

const DATABASE_PATH = process.env.DATABASE_PATH || './data/ecommerce.db'

let db: Database.Database | null = null

export const getDb = (): Database.Database => {
  if (!db) {
    // Ensure data directory exists
    const dir = dirname(DATABASE_PATH)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
      console.log(`Created directory: ${dir}`)
    }

    // Check if database file exists
    const isNewDatabase = !existsSync(DATABASE_PATH)

    // Create or open database
    db = new Database(DATABASE_PATH)
    console.log(`Database ${isNewDatabase ? 'created' : 'opened'} at: ${DATABASE_PATH}`)

    // Enable foreign keys
    db.pragma('foreign_keys = ON')

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL')

    // Create tables if new database
    if (isNewDatabase) {
      console.log('Initializing new database...')

      // Create all tables
      db.exec(createTables)
      console.log('Tables created successfully')

      // Create triggers
      db.exec(createTriggers)
      console.log('Triggers created successfully')

      // Seed initial data
      // seedDatabase(db) // Commented out - start with empty database
    } else {
      // Check if tables exist
      const tableCheck = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='products'
      `).get()

      if (!tableCheck) {
        console.log('Tables not found, creating...')
        db.exec(createTables)
        db.exec(createTriggers)
        // seedDatabase(db) // Commented out - start with empty database
      }

      // Check if revenue_transactions table exists (migration)
      const revenueTableCheck = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='revenue_transactions'
      `).get()

      if (!revenueTableCheck) {
        console.log('Revenue table not found, running migration...')
        try {
          const { migrateRevenue } = require('./migrate-revenue')
          migrateRevenue()
        } catch (error) {
          console.error('Failed to run revenue migration:', error)
        }
      }

      // Check if store_settings table exists (migration)
      const settingsTableCheck = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='store_settings'
      `).get()

      if (!settingsTableCheck) {
        console.log('Store settings table not found, creating...')
        db.exec(`
          CREATE TABLE IF NOT EXISTS store_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT NOT NULL,
            setting_type TEXT DEFAULT 'string',
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_store_settings_key ON store_settings(setting_key);
        `)
        console.log('Store settings table created')
      }

      // Check if store_settings has data, if not seed defaults
      const settingsCount = db.prepare('SELECT COUNT(*) as count FROM store_settings').get() as { count: number }
      const storeSettings = [
        { key: 'tax_rate', value: '18', type: 'number', description: 'Tax rate percentage applied to orders' },
        { key: 'currency_symbol', value: 'Rs. ', type: 'string', description: 'Currency symbol displayed in prices' },
        { key: 'store_name', value: 'ZinyasRang', type: 'string', description: 'Store name' },
        { key: 'low_stock_threshold', value: '5', type: 'number', description: 'Low stock warning threshold' },
        { key: 'free_shipping_threshold', value: '0', type: 'number', description: 'Free shipping minimum amount' },
        { key: 'shipping_cost', value: '200', type: 'number', description: 'Shipping cost when below free shipping threshold' },
      ]

      if (settingsCount.count === 0) {
        console.log('Seeding default store settings...')
        const insertSetting = db.prepare(`
          INSERT INTO store_settings (setting_key, setting_value, setting_type, description)
          VALUES (?, ?, ?, ?)
        `)
        storeSettings.forEach((s) => {
          insertSetting.run(s.key, s.value, s.type, s.description)
        })
        console.log('Default store settings seeded')
      } else {
        // Check for any missing settings and add them
        const insertIfMissing = db.prepare(`
          INSERT OR IGNORE INTO store_settings (setting_key, setting_value, setting_type, description)
          VALUES (?, ?, ?, ?)
        `)
        storeSettings.forEach((s) => {
          insertIfMissing.run(s.key, s.value, s.type, s.description)
        })
      }
    }
  }

  return db
}

// Helper functions for common database operations
export const runQuery = <T>(sql: string, params: any[] = []): T[] => {
  const database = getDb()
  const stmt = database.prepare(sql)
  return stmt.all(...params) as T[]
}

export const runGet = <T>(sql: string, params: any[] = []): T | undefined => {
  const database = getDb()
  const stmt = database.prepare(sql)
  return stmt.get(...params) as T | undefined
}

export const runInsert = (sql: string, params: any[] = []): number => {
  const database = getDb()
  const stmt = database.prepare(sql)
  const result = stmt.run(...params)
  return result.lastInsertRowid as number
}

export const runUpdate = (sql: string, params: any[] = []): number => {
  const database = getDb()
  const stmt = database.prepare(sql)
  const result = stmt.run(...params)
  return result.changes
}

export const runDelete = (sql: string, params: any[] = []): number => {
  const database = getDb()
  const stmt = database.prepare(sql)
  const result = stmt.run(...params)
  return result.changes
}

// Transaction helper
export const runTransaction = <T>(fn: (db: Database.Database) => T): T => {
  const database = getDb()
  return database.transaction(fn)(database)
}

// Close database connection (for cleanup)
export const closeDb = () => {
  if (db) {
    db.close()
    db = null
    console.log('Database connection closed')
  }
}

// Initialize database on module load
if (typeof window === 'undefined') {
  // Only initialize on server-side
  getDb()
}