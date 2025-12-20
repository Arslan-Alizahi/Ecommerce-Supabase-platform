import { getDb } from './index'

export function migrateSettings() {
  const db = getDb()

  console.log('Running settings migration...')

  // Create store_settings table if it doesn't exist
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

    CREATE TRIGGER IF NOT EXISTS update_store_settings_timestamp
    AFTER UPDATE ON store_settings
    BEGIN
      UPDATE store_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `)

  // Check if settings already exist
  const existingSettings = db.prepare('SELECT COUNT(*) as count FROM store_settings').get() as { count: number }

  if (existingSettings.count === 0) {
    console.log('Adding default store settings...')

    const storeSettings = [
      { key: 'tax_rate', value: '18', type: 'number', description: 'Tax rate percentage applied to orders (e.g., 18 for 18%)' },
      { key: 'currency_symbol', value: 'Rs. ', type: 'string', description: 'Currency symbol displayed in prices' },
      { key: 'store_name', value: 'ZinyasRang', type: 'string', description: 'Store name displayed across the site' },
      { key: 'low_stock_threshold', value: '5', type: 'number', description: 'Threshold for low stock warnings' },
      { key: 'free_shipping_threshold', value: '0', type: 'number', description: 'Minimum order amount for free shipping (0 for always free)' },
    ]

    const insertSetting = db.prepare(`
      INSERT INTO store_settings (setting_key, setting_value, setting_type, description)
      VALUES (?, ?, ?, ?)
    `)

    storeSettings.forEach((setting) => {
      insertSetting.run(setting.key, setting.value, setting.type, setting.description)
    })

    console.log('Default settings added successfully!')
  } else {
    console.log('Settings already exist, skipping seed.')
  }

  console.log('Settings migration completed!')
}

// Run migration if called directly
migrateSettings()
