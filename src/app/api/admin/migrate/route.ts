import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Revenue migration is handled via Supabase migrations.',
  })
}
