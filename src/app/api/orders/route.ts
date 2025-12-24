import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { Order } from '@/types/order'
import { apiResponse, apiError, generateOrderNumber, calculateTax, calculateTotal } from '@/lib/utils'

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const db = getDb()
    let query = db
      .from('orders')
      .select('*')

    if (searchParams.get('status')) {
      query = query.eq('status', searchParams.get('status')!)
    }

    if (searchParams.get('customer_email')) {
      query = query.eq('customer_email', searchParams.get('customer_email')!)
    }

    query = query.order('created_at', { ascending: false })

    if (searchParams.get('limit')) {
      query = query.limit(parseInt(searchParams.get('limit')!))
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Get order items for each order
    const ordersWithItems = await Promise.all((orders || []).map(async (order: any) => {
      const { data: items } = await db
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)

      return { ...order, items: items || [] }
    }))

    return NextResponse.json(apiResponse(ordersWithItems))
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      apiError('Failed to fetch orders'),
      { status: 500 }
    )
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        apiError('Order must have at least one item'),
        { status: 400 }
      )
    }

    const db = getDb()

    // Calculate totals
    let subtotal = 0
    for (const item of body.items) {
      subtotal += item.unit_price * item.quantity
    }

    const tax = body.tax || calculateTax(subtotal)
    const shipping = body.shipping_cost || 0
    const discount = body.discount || 0
    const total = calculateTotal(subtotal, tax, shipping, discount)

    // Create order
    const orderNumber = generateOrderNumber()

    const { data: newOrder, error: orderError } = await db
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: body.customer_name || null,
        customer_email: body.customer_email || null,
        customer_phone: body.customer_phone || null,
        shipping_address: body.shipping_address || null,
        billing_address: body.billing_address || null,
        subtotal: subtotal,
        tax: tax,
        shipping_cost: shipping,
        discount: discount,
        total: total,
        status: 'pending',
        payment_method: body.payment_method || 'stripe',
        payment_status: 'pending',
        notes: body.notes || null
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order insert error:', orderError)
      throw orderError
    }

    // Add order items and update stock
    for (const item of body.items) {
      // Check stock first
      const { data: product } = await db
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single()

      if (!product || product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_name}`)
      }

      // Insert order item
      const { error: itemError } = await db
        .from('order_items')
        .insert({
          order_id: newOrder.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku || null,
          product_image: item.product_image || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.unit_price * item.quantity
        })

      if (itemError) {
        console.error('Order item insert error:', itemError)
        throw itemError
      }

      // Update stock
      const { error: stockError } = await db
        .from('products')
        .update({ stock_quantity: product.stock_quantity - item.quantity })
        .eq('id', item.product_id)

      if (stockError) {
        console.error('Stock update error:', stockError)
        throw stockError
      }
    }

    // Fetch created order with items
    const { data: items } = await db
      .from('order_items')
      .select('*')
      .eq('order_id', newOrder.id)

    return NextResponse.json(
      apiResponse({ ...newOrder, items: items || [] }),
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      apiError(error.message || 'Failed to create order'),
      { status: 500 }
    )
  }
}