import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET all settings or specific setting by key
export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')

    if (key) {
      // Get specific setting
      const setting = db
        .prepare('SELECT * FROM store_settings WHERE setting_key = ?')
        .get(key) as any

      if (!setting) {
        return NextResponse.json(
          { success: false, error: 'Setting not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: setting,
      })
    }

    // Get all settings
    const settings = db
      .prepare('SELECT * FROM store_settings ORDER BY setting_key')
      .all() as any[]

    // Convert to key-value object for easier access
    const settingsMap = settings.reduce((acc, setting) => {
      let value: any = setting.setting_value

      // Parse value based on type
      if (setting.setting_type === 'number') {
        value = parseFloat(setting.setting_value)
      } else if (setting.setting_type === 'boolean') {
        value = setting.setting_value === 'true'
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(setting.setting_value)
        } catch {
          value = setting.setting_value
        }
      }

      acc[setting.setting_key] = {
        value,
        type: setting.setting_type,
        description: setting.description,
        updated_at: setting.updated_at,
      }
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      success: true,
      data: {
        settings: settingsMap,
        raw: settings,
      },
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT to update a setting
export async function PUT(request: NextRequest) {
  try {
    const db = getDb()
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Setting key is required' },
        { status: 400 }
      )
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { success: false, error: 'Setting value is required' },
        { status: 400 }
      )
    }

    // Check if setting exists
    const existing = db
      .prepare('SELECT * FROM store_settings WHERE setting_key = ?')
      .get(key) as any

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Setting not found' },
        { status: 404 }
      )
    }

    // Update the setting
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)

    db.prepare('UPDATE store_settings SET setting_value = ? WHERE setting_key = ?')
      .run(stringValue, key)

    // Get updated setting
    const updated = db
      .prepare('SELECT * FROM store_settings WHERE setting_key = ?')
      .get(key) as any

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}

// POST to create a new setting (admin only)
export async function POST(request: NextRequest) {
  try {
    const db = getDb()
    const body = await request.json()
    const { key, value, type = 'string', description = '' } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Setting key and value are required' },
        { status: 400 }
      )
    }

    // Check if setting already exists
    const existing = db
      .prepare('SELECT * FROM store_settings WHERE setting_key = ?')
      .get(key)

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Setting already exists' },
        { status: 409 }
      )
    }

    // Create the setting
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)

    const result = db
      .prepare(
        'INSERT INTO store_settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)'
      )
      .run(key, stringValue, type, description)

    const newSetting = db
      .prepare('SELECT * FROM store_settings WHERE id = ?')
      .get(result.lastInsertRowid) as any

    return NextResponse.json({
      success: true,
      message: 'Setting created successfully',
      data: newSetting,
    })
  } catch (error) {
    console.error('Error creating setting:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create setting' },
      { status: 500 }
    )
  }
}
