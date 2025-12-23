import { NextRequest, NextResponse } from 'next/server'
import { runQuery, runGet } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'month' // day, week, month, year
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type') // 'order' or 'all'

    // Build date filter
    let dateFilter = ''
    if (startDate && endDate) {
      dateFilter = `WHERE transaction_date::date BETWEEN '${startDate}' AND '${endDate}'`
    } else {
      // Default date ranges based on period
      switch (period) {
        case 'day':
          dateFilter = `WHERE transaction_date::date >= CURRENT_DATE - INTERVAL '30 days'`
          break
        case 'week':
          dateFilter = `WHERE transaction_date::date >= CURRENT_DATE - INTERVAL '12 weeks'`
          break
        case 'month':
          dateFilter = `WHERE transaction_date::date >= CURRENT_DATE - INTERVAL '12 months'`
          break
        case 'year':
          dateFilter = `WHERE transaction_date::date >= CURRENT_DATE - INTERVAL '5 years'`
          break
        default:
          dateFilter = `WHERE transaction_date::date >= CURRENT_DATE - INTERVAL '12 months'`
      }
    }

    // Add type filter if specified
    if (type && type !== 'all') {
      dateFilter += dateFilter.toLowerCase().includes('where') ? ' AND' : ' WHERE'
      // Use parameter for type to avoid injection, though type is limited by enum in logic usually.
      // For simplicity here integrating string, but verifying content is safe or use params.
      // safer to use parameter if we can. 
      dateFilter += ` transaction_type = '${type.replace(/'/g, "''")}'`
    }

    // Get revenue over time based on period
    let groupByFormat = ''
    switch (period) {
      case 'day':
        groupByFormat = 'YYYY-MM-DD'
        break
      case 'week':
        groupByFormat = 'IYYY-"W"IW' // ISO Week
        break
      case 'month':
        groupByFormat = 'YYYY-MM'
        break
      case 'year':
        groupByFormat = 'YYYY'
        break
      default:
        groupByFormat = 'YYYY-MM'
    }

    const revenueOverTime = await runQuery<any>(
      `
        SELECT
          to_char(transaction_date, '${groupByFormat}') as period,
          COALESCE(SUM(total), 0) as revenue,
          COALESCE(SUM(subtotal), 0) as subtotal,
          COALESCE(SUM(tax), 0) as tax,
          COALESCE(SUM(discount), 0) as discount,
          COUNT(*) as transactions
        FROM revenue_transactions
        ${dateFilter}
        GROUP BY period
        ORDER BY period ASC
      `
    )

    // Get revenue by source over time
    const revenueBySource = await runQuery<any>(
      `
        SELECT
          to_char(transaction_date, '${groupByFormat}') as period,
          transaction_type,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(*) as transactions
        FROM revenue_transactions
        ${dateFilter}
        GROUP BY period, transaction_type
        ORDER BY period ASC, transaction_type
      `
    )

    // Get top performing days
    const topDays = await runQuery<any>(
      `
        SELECT
          transaction_date::date as date,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(*) as transactions
        FROM revenue_transactions
        ${dateFilter}
        GROUP BY date
        ORDER BY revenue DESC
        LIMIT 10
      `
    )

    // Get revenue by payment method over period
    const paymentMethodTrends = await runQuery<any>(
      `
        SELECT
          payment_method,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(*) as transactions
        FROM revenue_transactions
        ${dateFilter}
        GROUP BY payment_method
        ORDER BY revenue DESC
      `
    )

    // Get daily averages
    const avgDaily = await runGet(
      `
        SELECT
          AVG(daily_revenue) as avg_revenue,
          AVG(daily_transactions) as avg_transactions
        FROM (
          SELECT
            transaction_date::date as date,
            SUM(total) as daily_revenue,
            COUNT(*) as daily_transactions
          FROM revenue_transactions
          ${dateFilter}
          GROUP BY date
        ) sub
      `
    ) as any

    return NextResponse.json({
      success: true,
      data: {
        period,
        revenueOverTime,
        revenueBySource,
        topDays,
        paymentMethodTrends,
        averages: {
          dailyRevenue: avgDaily?.avg_revenue || 0,
          dailyTransactions: avgDaily?.avg_transactions || 0,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching revenue analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch revenue analytics',
      },
      { status: 500 }
    )
  }
}
