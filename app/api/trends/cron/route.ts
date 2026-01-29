import { NextResponse } from 'next/server'
import { ensureSchema, query } from '@/lib/db'
import { fetchAllSources } from '@/lib/trend_fetchers'
import { getCountryCodes } from '@/lib/countries'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
  if (!value) return getCountryCodes()
  if (value.trim().toUpperCase() === 'ALL') {
    return getCountryCodes()
  }
  return value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
}

function parseNumber(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatError(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  handler: (item: T) => Promise<void>
) {
  const queue = [...items]
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift()
      if (!next) return
      await handler(next)
    }
  })
  await Promise.all(workers)
}

export async function GET(request: Request) {
  await ensureSchema()
  const { searchParams } = new URL(request.url)
  const countries = parseCountries(searchParams.get('countries'))
  const concurrency = clampNumber(parseNumber(searchParams.get('concurrency'), 4), 1, 8)
  const batchSize = clampNumber(
    parseNumber(searchParams.get('batchSize'), countries.length || 1),
    1,
    countries.length || 1
  )
  const totalBatches = Math.max(1, Math.ceil(countries.length / batchSize))
  const batchIndex = clampNumber(
    parseNumber(searchParams.get('batchIndex'), 0),
    0,
    totalBatches - 1
  )
  const start = batchIndex * batchSize
  const targetCountries = countries.slice(start, start + batchSize)

  const inserted: Record<string, number> = {}
  const failed: Record<string, string[]> = {}

  await runWithConcurrency(targetCountries, concurrency, async (countryCode) => {
    try {
      const { trends, failedSources } = await fetchAllSources(countryCode)
      failed[countryCode] = failedSources

      if (trends.length === 0) {
        inserted[countryCode] = 0
        return
      }

      const safeTrends = trends.map(sanitizeTrend)
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
    } catch (error) {
      inserted[countryCode] = 0
      failed[countryCode] = [...(failed[countryCode] || []), formatError(error)]
    }
  })

  return NextResponse.json({
    ok: true,
    inserted,
    failed,
    countries: targetCountries,
    batch: {
      batchIndex,
      batchSize,
      totalBatches,
      totalCountries: countries.length,
    },
    concurrency,
  })
}

export async function POST(request: Request) {
  return GET(request)
}

