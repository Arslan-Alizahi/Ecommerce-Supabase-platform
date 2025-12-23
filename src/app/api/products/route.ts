import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { Product, ProductFilter } from '@/types/product'
import { apiResponse, apiError, generateSKU, slugify } from '@/lib/utils'

// GET /api/products - Get all products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse filters
    const filters: ProductFilter = {
      category_id: searchParams.get('category_id') ? parseInt(searchParams.get('category_id')!) : undefined,
      min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
      max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
      is_featured: searchParams.get('is_featured') === 'true' ? true : searchParams.get('is_featured') === 'false' ? false : undefined,
      is_active: searchParams.get('is_active') === 'false' ? false : true,
      search: searchParams.get('search') || undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (searchParams.get('sort_order') as any) || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '12'),
    }

    const db = getDb()

    // Build query for products with category join
    let query = db
      .from('products')
      .select(`
        *,
        category:categories(name)
      `)

    // Apply filters
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active ? 1 : 0)
    }

    if (filters.category_id !== undefined) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price)
    }

    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price)
    }

    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured ? 1 : 0)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }

    // Get total count first (before pagination)
    const countQuery = query
    const { count: total } = await countQuery.select('*', { count: 'exact', head: true })

    // Add sorting
    const sortColumn = filters.sort_by === 'name' ? 'name' :
      filters.sort_by === 'price' ? 'price' :
        filters.sort_by === 'stock' ? 'stock_quantity' :
          'created_at'
    const ascending = filters.sort_order === 'asc'
    query = query.order(sortColumn, { ascending })

    // Add pagination
    const offset = (filters.page! - 1) * filters.limit!
    query = query.range(offset, offset + filters.limit! - 1)

    const { data: products, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Get images for each product
    const productsWithImages = await Promise.all((products || []).map(async (product: any) => {
      const { data: images } = await db
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('display_order')

      // Get primary image
      const primaryImage = images?.find((img: any) => img.is_primary === 1)?.image_url || null

      return {
        ...product,
        category_name: product.category?.name || null,
        image_count: images?.length || 0,
        primary_image: primaryImage,
        images: images || []
      }
    }))

    // Remove nested category object
    const formattedProducts = productsWithImages.map((p: any) => {
      const { category, ...rest } = p
      return rest
    })

    return NextResponse.json(
      apiResponse({
        products: formattedProducts,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: total || 0,
          totalPages: Math.ceil((total || 0) / filters.limit!)
        }
      })
    )
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      apiError('Failed to fetch products'),
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.price || !body.category_id) {
      return NextResponse.json(
        apiError('Missing required fields'),
        { status: 400 }
      )
    }

    // Generate slug and SKU if not provided
    const slug = body.slug || slugify(body.name)
    const sku = body.sku || generateSKU(body.name)

    const db = getDb()

    // Check if slug or SKU already exists
    const { data: existing } = await db
      .from('products')
      .select('id')
      .or(`slug.eq.${slug},sku.eq.${sku}`)
      .single()

    if (existing) {
      return NextResponse.json(
        apiError('Product with this slug or SKU already exists'),
        { status: 400 }
      )
    }

    // Insert product
    const { data: newProduct, error: insertError } = await db
      .from('products')
      .insert({
        name: body.name,
        slug: slug,
        description: body.description || null,
        long_description: body.long_description || null,
        sku: sku,
        category_id: body.category_id,
        price: body.price,
        compare_at_price: body.compare_at_price || null,
        cost_price: body.cost_price || null,
        stock_quantity: body.stock_quantity || 0,
        low_stock_threshold: body.low_stock_threshold || 5,
        is_featured: body.is_featured ? 1 : 0,
        is_active: body.is_active !== false ? 1 : 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    // Add images if provided
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      const imageInserts = body.images.map((image: any, index: number) => ({
        product_id: newProduct.id,
        image_url: image.image_url,
        alt_text: image.alt_text || body.name,
        display_order: image.display_order || index,
        is_primary: index === 0 ? 1 : 0
      }))

      const { error: imagesError } = await db
        .from('product_images')
        .insert(imageInserts)

      if (imagesError) {
        console.error('Images insert error:', imagesError)
        // Don't throw - product is already created
      }
    }

    // Fetch the created product with category name
    const { data: product } = await db
      .from('products')
      .select(`
        *,
        category:categories(name)
      `)
      .eq('id', newProduct.id)
      .single()

    const formattedProduct = {
      ...product,
      category_name: product?.category?.name || null
    }
    delete formattedProduct.category

    return NextResponse.json(
      apiResponse(formattedProduct),
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      apiError('Failed to create product'),
      { status: 500 }
    )
  }
}