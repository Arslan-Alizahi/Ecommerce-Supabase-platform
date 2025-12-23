import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const db = getDb()

    // Get product with category and parent category
    // Supabase nested joins for parent category
    const { data: product, error: productError } = await db
      .from('products')
      .select(`
        *,
        category:categories!category_id(
          name,
          slug,
          parent_id,
          parent:categories!parent_id(
            name,
            slug
          )
        )
      `)
      .eq('slug', slug)
      .eq('is_active', 1)
      .single()

    if (productError || !product) {
      console.error('Fetch error or not found:', productError)
      return NextResponse.json(
        apiError('Product not found'),
        { status: 404 }
      )
    }

    // Format the product to match the expected structure
    const formattedProduct = {
      ...product,
      category_name: product.category?.name || null,
      category_slug: product.category?.slug || null,
      parent_category_id: product.category?.parent_id || null,
      parent_category_name: product.category?.parent?.name || null,
      parent_category_slug: product.category?.parent?.slug || null
    }
    delete formattedProduct.category

    // Get product images
    const { data: images, error: imagesError } = await db
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('display_order', { ascending: true })
      .order('is_primary', { ascending: false })

    if (imagesError) {
      console.error('Images fetch error:', imagesError)
    }

    // Get related products (same category, excluding current product)
    const { data: relatedProducts, error: relatedError } = await db
      .from('products')
      .select(`
        *,
        category:categories(name),
        images:product_images(image_url)
      `)
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .eq('is_active', 1)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(4)

    if (relatedError) {
      console.error('Related products fetch error:', relatedError)
    }

    // Format related products to include primary_image
    const formattedRelated = (relatedProducts || []).map((p: any) => {
      const primaryImage = p.images?.find((img: any) => img.is_primary === 1)?.image_url ||
        (p.images && p.images.length > 0 ? p.images[0].image_url : null)

      const { category, images, ...rest } = p
      return {
        ...rest,
        category_name: category?.name || null,
        primary_image: primaryImage
      }
    })

    return NextResponse.json({
      ...formattedProduct,
      images: images || [],
      relatedProducts: formattedRelated,
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

