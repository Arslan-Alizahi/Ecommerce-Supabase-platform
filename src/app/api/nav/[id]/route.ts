import { NextRequest, NextResponse } from 'next/server'
import { runQuery, runGet, runUpdate, runDelete } from '@/lib/db'

// GET /api/nav/[id] - Get single navigation item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await runGet('SELECT * FROM nav_items WHERE id = ?', [id]) as any

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Navigation item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: item,
    })
  } catch (error) {
    console.error('Error fetching nav item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch navigation item' },
      { status: 500 }
    )
  }
}

// PUT /api/nav/[id] - Update navigation item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params

    // Check if item exists
    const existing = await runGet('SELECT id FROM nav_items WHERE id = ?', [id])

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Navigation item not found' },
        { status: 404 }
      )
    }

    const sql = `
      UPDATE nav_items SET
        label = ?,
        href = ?,
        parent_id = ?,
        type = ?,
        target = ?,
        icon = ?,
        display_order = ?,
        is_active = ?,
        location = ?,
        meta = ?
      WHERE id = ?
    `

    await runUpdate(sql, [
      body.label,
      body.href,
      body.parent_id || null,
      body.type || 'link',
      body.target || '_self',
      body.icon || null,
      body.display_order || 0,
      body.is_active ? 1 : 0,
      body.location || 'header',
      body.meta ? JSON.stringify(body.meta) : null,
      id
    ])

    const updated = await runGet('SELECT * FROM nav_items WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Navigation item updated successfully',
    })
  } catch (error) {
    console.error('Error updating nav item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update navigation item' },
      { status: 500 }
    )
  }
}

// DELETE /api/nav/[id] - Delete navigation item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if item exists
    const existing = await runGet('SELECT id FROM nav_items WHERE id = ?', [id])

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Navigation item not found' },
        { status: 404 }
      )
    }

    await runDelete('DELETE FROM nav_items WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: 'Navigation item deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting nav item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete navigation item' },
      { status: 500 }
    )
  }
}

