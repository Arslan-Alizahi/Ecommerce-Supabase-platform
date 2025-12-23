import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'
import type { CreateSocialMediaLinkInput } from '@/types/social-media'

// GET /api/social-media - Get all social media links
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') === 'true'

    const db = getDb()
    let query = db
      .from('social_media_links')
      .select('*')

    if (activeOnly) {
      query = query.eq('is_active', 1)
    }

    query = query.order('display_order', { ascending: true })

    const { data: links, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json(
      apiResponse({
        links: links || [],
        total: (links || []).length,
      })
    )
  } catch (error) {
    console.error('Error fetching social media links:', error)
    return NextResponse.json(apiError('Failed to fetch social media links'), {
      status: 500,
    })
  }
}

// POST /api/social-media - Create new social media link
export async function POST(request: NextRequest) {
  try {
    const body: CreateSocialMediaLinkInput = await request.json()

    // Validation
    if (!body.platform || !body.url || !body.icon) {
      return NextResponse.json(
        apiError('Platform, URL, and icon are required'),
        { status: 400 }
      )
    }

    const db = getDb()
    const { data: newLink, error } = await db
      .from('social_media_links')
      .insert({
        platform: body.platform,
        url: body.url,
        icon: body.icon,
        display_order: body.display_order ?? 0,
        is_active: body.is_active ?? 1
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json(apiResponse(newLink, true, 'Social media link created successfully'), {
      status: 201,
    })
  } catch (error) {
    console.error('Error creating social media link:', error)
    return NextResponse.json(apiError('Failed to create social media link'), {
      status: 500,
    })
  }
}
