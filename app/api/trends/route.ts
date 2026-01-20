import { NextResponse } from 'next/server'
import { getTrendsByCountry } from '@/lib/trends'

export const revalidate = 3600

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const countryCode = searchParams.get('countryCode') || 'US'

  try {
    const trends = await getTrendsByCountry(countryCode)
    return NextResponse.json({ trends })
  } catch (error) {
    console.warn('Trends API error:', error)
    return NextResponse.json(
      { trends: [], error: 'Failed to fetch trends' },
      { status: 500 }
    )
  }
}

