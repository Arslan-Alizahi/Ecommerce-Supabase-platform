import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/nav - Get all navigation items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') || 'header'
    const activeOnly = searchParams.get('active_only') === 'true'

    const db = getDb()
    let query = db
      .from('nav_items')
      .select('*')
      .eq('location', location)

    if (activeOnly) {
      query = query.eq('is_active', 1)
    }

    query = query.order('display_order', { ascending: true }).order('id', { ascending: true })

    const { data: items, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: items || [],
    })
  } catch (error) {
    console.error('Error fetching nav items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch navigation items' },
      { status: 500 }
    )
  }
}

// POST /api/nav - Create new navigation item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.label || !body.href) {
      return NextResponse.json(
        { success: false, error: 'Label and href are required' },
        { status: 400 }
      )
    }

    const db = getDb()
    const { data: newItem, error } = await db
      .from('nav_items')
      .insert({
        label: body.label,
        href: body.href,
        parent_id: body.parent_id || null,
        type: body.type || 'link',
        target: body.target || '_self',
        icon: body.icon || null,
        display_order: body.display_order || 0,
        is_active: body.is_active !== false ? 1 : 0,
        location: body.location || 'header',
        meta: body.meta ? JSON.stringify(body.meta) : null
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: newItem,
      message: 'Navigation item created successfully',
    })
  } catch (error) {
    console.error('Error creating nav item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create navigation item' },
      { status: 500 }
    )
  }
}

