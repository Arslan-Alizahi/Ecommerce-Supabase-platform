import { NextRequest, NextResponse } from 'next/server'
import { runQuery, runInsert, runGet, getDb } from '@/lib/db'
import { Category } from '@/types/category'
import { apiResponse, apiError, slugify, buildCategoryTree } from '@/lib/utils'

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tree = searchParams.get('tree') === 'true'
    const parent_id = searchParams.get('parent_id')
    const is_active = searchParams.get('is_active')

    const db = getDb()

    // Build query
    let query = db
      .from('categories')
      .select(`
        *,
        parent:categories!parent_id(name)
      `)

    // Apply filters
    if (parent_id !== null) {
      if (parent_id === 'null') {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', parseInt(parent_id))
      }
    }

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true')
    }

    // Order by
    query = query.order('display_order').order('name')

    const { data: categories, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category: any) => {
        const { count } = await db
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)

        return {
          ...category,
          parent_name: category.parent?.name || null,
          product_count: count || 0
        }
      })
    )

    // Remove the nested parent object
    const formattedCategories = categoriesWithCounts.map((cat: any) => {
      const { parent, ...rest } = cat
      return rest
    })

    if (tree) {
      const categoryTree = buildCategoryTree(formattedCategories)
      return NextResponse.json(apiResponse(categoryTree))
    }

    return NextResponse.json(apiResponse(formattedCategories))
  } catch (error) {
    console.error('Error fetching categories:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      apiError(`Failed to fetch categories: ${errorMessage}`),
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        apiError('Category name is required'),
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const slug = body.slug || slugify(body.name)

    // Get Supabase client
    const db = getDb()

    // Check if slug already exists
    const { data: existing } = await db
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        apiError('Category with this slug already exists'),
        { status: 400 }
      )
    }

    // Insert category
    const { data: newCategory, error: insertError } = await db
      .from('categories')
      .insert({
        name: body.name,
        slug: slug,
        description: body.description || null,
        parent_id: body.parent_id || null,
        image_url: body.image_url || null,
        display_order: body.display_order || 0,
        is_active: body.is_active !== false ? 1 : 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    // Fetch the created category with parent name
    const { data: category, error: fetchError } = await db
      .from('categories')
      .select(`
        *,
        parent:categories!parent_id(name)
      `)
      .eq('id', newCategory.id)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      throw fetchError
    }

    // Format the response to match expected structure
    const formattedCategory = {
      ...category,
      parent_name: category.parent?.name || null
    }
    delete formattedCategory.parent

    return NextResponse.json(
      apiResponse(formattedCategory),
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      apiError('Failed to create category'),
      { status: 500 }
    )
  }
}