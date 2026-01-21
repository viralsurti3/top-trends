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

function clampDays(value: string | null): number {
  const parsed = Number(value || 7)
  if (Number.isNaN(parsed)) return 7
  return Math.max(1, Math.min(parsed, 30))
}

export async function POST(request: Request) {
  await ensureSchema()
  const { searchParams } = new URL(request.url)
  const countries = parseCountries(searchParams.get('countries'))
  const days = clampDays(searchParams.get('days'))

  const inserted: Record<string, number> = {}
  const failed: Record<string, string[]> = {}

  for (const countryCode of countries) {
    const { trends, failedSources } = await fetchAllSources(countryCode)
    failed[countryCode] = failedSources

    if (trends.length === 0) {
      inserted[countryCode] = 0
      continue
    }

    const rows = []
    for (let day = 0; day < days; day += 1) {
      const shift = day * 24 * 60 * 60 * 1000
      for (const trend of trends) {
        const timestamp = new Date(Date.now() - shift).toISOString()
        rows.push({
          ...trend,
          timestamp,
        })
      }
    }

    const values = rows.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')
    const params = rows.flatMap((trend) => [
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

    inserted[countryCode] = rows.length
  }

  return NextResponse.json({ ok: true, inserted, failed, days })
}

