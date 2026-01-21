import { NextResponse } from 'next/server'
import { ensureSchema, query } from '@/lib/db'
import { fetchAllSources } from '@/lib/trend_fetchers'
import { getCountryCodes } from '@/lib/countries'

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
    failed[countryCode] = failedSources

    if (trends.length === 0) {
      inserted[countryCode] = 0
      continue
    }

    const values = trends.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')
    const params = trends.flatMap((trend) => [
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

    inserted[countryCode] = trends.length
  }

  return NextResponse.json({ ok: true, inserted, failed })
}

