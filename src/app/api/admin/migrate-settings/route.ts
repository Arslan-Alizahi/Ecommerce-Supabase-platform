import { NextResponse } from 'next/server'
import { runQuery, runGet, runInsert } from '@/lib/db'

export async function GET() {
  try {
    console.log('Running settings migration...')

    // Create store_settings table if it doesn't exist
    await runQuery(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id SERIAL PRIMARY KEY,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        setting_type TEXT DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Create index if it doesn't exist
    await runQuery(`CREATE INDEX IF NOT EXISTS idx_store_settings_key ON store_settings(setting_key);`)

    // Check if settings already exist
    const existingSettings = await runGet('SELECT COUNT(*) as count FROM store_settings') as { count: string }

    // Postgres COUNT returns bigint (string)
    const count = parseInt(existingSettings.count)

    if (count === 0) {
      console.log('Adding default store settings...')

      const storeSettings = [
        { key: 'tax_rate', value: '18', type: 'number', description: 'Tax rate percentage applied to orders (e.g., 18 for 18%)' },
        { key: 'currency_symbol', value: 'Rs. ', type: 'string', description: 'Currency symbol displayed in prices' },
        { key: 'store_name', value: 'ZinyasRang', type: 'string', description: 'Store name displayed across the site' },
        { key: 'low_stock_threshold', value: '5', type: 'number', description: 'Threshold for low stock warnings' },
        { key: 'free_shipping_threshold', value: '0', type: 'number', description: 'Minimum order amount for free shipping (0 for always free)' },
      ]

      const insertSql = `
        INSERT INTO store_settings (setting_key, setting_value, setting_type, description)
        VALUES ($1, $2, $3, $4)
      `

      for (const setting of storeSettings) {
        await runInsert(insertSql, [setting.key, setting.value, setting.type, setting.description])
      }

      return NextResponse.json({
        success: true,
        message: 'Settings migration completed! Default settings added.',
        settingsAdded: storeSettings.length,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Settings table exists. No migration needed.',
      existingSettings: count,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
