import { NextResponse } from 'next/server'
import { runQuery, runGet } from '@/lib/db'

export async function GET() {
  try {
    // Get total revenue (all time)
    const totalRevenue = await runGet(
      `
        SELECT
          COALESCE(SUM(total), 0) as total,
          COALESCE(SUM(subtotal), 0) as subtotal,
          COALESCE(SUM(tax), 0) as tax,
          COALESCE(SUM(discount), 0) as discount,
          COUNT(*) as transaction_count
        FROM revenue_transactions
      `
    ) as any || { total: 0, subtotal: 0, tax: 0, discount: 0, transaction_count: 0 }

    // Get revenue by source
    const revenueBySource = await runQuery<any>(
      `
        SELECT
          transaction_type,
          COALESCE(SUM(total), 0) as total,
          COUNT(*) as transaction_count
        FROM revenue_transactions
        GROUP BY transaction_type
      `
    )

    // Get today's revenue
    const todayRevenue = await runGet(
      `
        SELECT
          COALESCE(SUM(total), 0) as total,
          COUNT(*) as transaction_count
        FROM revenue_transactions
        WHERE transaction_date::date = CURRENT_DATE
      `
    ) as any || { total: 0, transaction_count: 0 }

    // Get month's revenue
    const monthRevenue = await runGet(
      `
        SELECT
          COALESCE(SUM(total), 0) as total,
          COUNT(*) as transaction_count
        FROM revenue_transactions
        WHERE to_char(transaction_date, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')
      `
    ) as any || { total: 0, transaction_count: 0 }

    // Get this year's revenue
    const yearRevenue = await runGet(
      `
        SELECT
          COALESCE(SUM(total), 0) as total,
          COUNT(*) as transaction_count
        FROM revenue_transactions
        WHERE to_char(transaction_date, 'YYYY') = to_char(CURRENT_DATE, 'YYYY')
      `
    ) as any || { total: 0, transaction_count: 0 }

    // Get yesterday's revenue for comparison
    const yesterdayRevenue = await runGet(
      `
        SELECT
          COALESCE(SUM(total), 0) as total
        FROM revenue_transactions
        WHERE transaction_date::date = CURRENT_DATE - INTERVAL '1 day'
      `
    ) as any || { total: 0 }

    // Get last month's revenue for comparison
    const lastMonthRevenue = await runGet(
      `
        SELECT
          COALESCE(SUM(total), 0) as total
        FROM revenue_transactions
        WHERE to_char(transaction_date, 'YYYY-MM') = to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')
      `
    ) as any || { total: 0 }

    // Calculate growth percentages
    const todayGrowth = Number(yesterdayRevenue.total) > 0
      ? ((Number(todayRevenue.total) - Number(yesterdayRevenue.total)) / Number(yesterdayRevenue.total)) * 100
      : 0

    const monthGrowth = Number(lastMonthRevenue.total) > 0
      ? ((Number(monthRevenue.total) - Number(lastMonthRevenue.total)) / Number(lastMonthRevenue.total)) * 100
      : 0

    // Get average transaction value
    const avgTransactionValue = Number(totalRevenue.transaction_count) > 0
      ? Number(totalRevenue.total) / Number(totalRevenue.transaction_count)
      : 0

    // Get payment method breakdown
    const paymentMethods = await runQuery<any>(
      `
        SELECT
          payment_method,
          COALESCE(SUM(total), 0) as total,
          COUNT(*) as count
        FROM revenue_transactions
        GROUP BY payment_method
        ORDER BY total DESC
      `
    )

    // Get recent transactions (last 10)
    const recentTransactions = await runQuery<any>(
      `
        SELECT
          id,
          transaction_type,
          reference_number,
          customer_name,
          total,
          payment_method,
          transaction_date
        FROM revenue_transactions
        ORDER BY transaction_date DESC
        LIMIT 10
      `
    )

    return NextResponse.json({
      success: true,
      data: {
        total: {
          revenue: totalRevenue.total,
          subtotal: totalRevenue.subtotal,
          tax: totalRevenue.tax,
          discount: totalRevenue.discount,
          transactions: totalRevenue.transaction_count,
          averageValue: avgTransactionValue,
        },
        today: {
          revenue: todayRevenue.total,
          transactions: todayRevenue.transaction_count,
          growth: todayGrowth,
        },
        month: {
          revenue: monthRevenue.total,
          transactions: monthRevenue.transaction_count,
          growth: monthGrowth,
        },
        year: {
          revenue: yearRevenue.total,
          transactions: yearRevenue.transaction_count,
        },
        bySource: revenueBySource.reduce((acc, item) => {
          acc[item.transaction_type] = {
            total: item.total,
            count: item.transaction_count,
          }
          return acc
        }, {} as any),
        paymentMethods,
        recentTransactions,
      },
    })
  } catch (error) {
    console.error('Error fetching revenue overview:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch revenue overview',
      },
      { status: 500 }
    )
  }
}
