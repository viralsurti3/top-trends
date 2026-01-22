import { NextResponse } from 'next/server'
import { ensureSchema, query } from '@/lib/db'
import { fetchAllSources } from '@/lib/trend_fetchers'
import { getCountryCodes } from '@/lib/countries'

function clamp(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value
}

function sanitizeTrend(trend: {
  name: string
  url: string
  source: string
  volume?: string
  timestamp: string
  country_code: string
}) {
  return {
    ...trend,
    name: clamp(trend.name, 255),
    url: clamp(trend.url, 2048),
    source: clamp(trend.source, 32),
    volume: trend.volume ? clamp(trend.volume, 32) : null,
    country_code: clamp(trend.country_code, 10),
  }
}

function parseCountries(value: string | null): string[] {
  if (!value) return ['GLOBAL']
  if (value.trim().toUpperCase() === 'ALL') {
    return getCountryCodes()
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function POST(request: Request) {
  await ensureSchema()
  const { searchParams } = new URL(request.url)
  const countries = parseCountries(searchParams.get('countries'))

  const inserted: Record<string, number> = {}
  const failed: Record<string, string[]> = {}

  for (const countryCode of countries) {
    const { trends, failedSources } = await fetchAllSources(countryCode)
    const safeTrends = trends.map(sanitizeTrend)
    failed[countryCode] = failedSources

    if (safeTrends.length === 0) {
      inserted[countryCode] = 0
      continue
    }

    const values = safeTrends
      .map((_, index) => {
        const base = index * 6
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
      })
      .join(', ')
    const params = safeTrends.flatMap((trend) => [
      trend.name,
      trend.url,
      trend.source,
      trend.volume || null,
      new Date(trend.timestamp),
      trend.country_code,
    ])

    await query(
      `
        INSERT INTO trends (name, url, source, volume, timestamp, country_code)
        VALUES ${values}
      `,
      params
    )

    inserted[countryCode] = safeTrends.length
  }

  return NextResponse.json({ ok: true, inserted, failed })
}

