import { NextResponse } from 'next/server'
import { ensureSchema, query } from '@/lib/db'
import { getSchedulerState, startScheduler } from '@/lib/trend_scheduler'
import { getCountryCodes } from '@/lib/countries'
import { fetchAllSources, type Trend as SourceTrend } from '@/lib/trend_fetchers'

type Trend = {
  name: string
  url: string
  source: string
  volume?: string
  timestamp: string
  country_code: string
}

function normalizeSources(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function sameCountries(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

export async function GET(request: Request) {
  await ensureSchema()
  const { searchParams } = new URL(request.url)
  const countryCode = searchParams.get('countryCode') || 'GLOBAL'
  if (process.env.ENABLE_TREND_SCHEDULER !== '0') {
    const interval = Number(process.env.TREND_SCHEDULER_INTERVAL_MINUTES || 60)
    const raw = process.env.TREND_SCHEDULER_COUNTRIES || 'GLOBAL'
    const countries =
      raw.trim().toUpperCase() === 'ALL'
        ? getCountryCodes()
        : raw
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
    const requestCountry = (countryCode || 'GLOBAL').trim().toUpperCase()
    if (requestCountry && !countries.includes(requestCountry)) {
      countries.push(requestCountry)
    }
    const state = getSchedulerState()
    const sameConfig =
      state.started &&
      state.intervalMs === interval * 60 * 1000 &&
      sameCountries(state.countries, countries)
    if (!sameConfig) {
      await startScheduler(interval, countries)
    }
  }
  const date = searchParams.get('date')
  const sources = normalizeSources(searchParams.get('source'))
  const realtimeWindow = Number(process.env.REALTIME_WINDOW_MINUTES || 720)
  const refresh = searchParams.get('refresh') === '1'

  const where: string[] = []
  const params: Array<string | number> = []

  where.push('country_code = ?')
  params.push(countryCode)

  if (date) {
    where.push('DATE(timestamp) = ?')
    params.push(date)
  }

  if (sources.length > 0) {
    where.push(`source IN (${sources.map(() => '?').join(', ')})`)
    params.push(...sources)
  }

  if (!date && !Number.isNaN(realtimeWindow) && realtimeWindow > 0) {
    where.push('timestamp >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? MINUTE)')
    params.push(realtimeWindow)
  }

  let failedSources: string[] = []

  if (refresh) {
    const result = await fetchAllSources(countryCode)
    const trends = result.trends
    failedSources = result.failedSources
    if (trends.length > 0) {
      const values = trends
        .map(
          () =>
            'SELECT ? AS name, ? AS url, ? AS source, ? AS volume, ? AS timestamp, ? AS country_code'
        )
        .join(' UNION ALL ')
      const insertParams = trends.flatMap((trend) => [
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
          SELECT v.name, v.url, v.source, v.volume, v.timestamp, v.country_code
          FROM (${values}) v
          WHERE NOT EXISTS (
            SELECT 1
            FROM trends t
            WHERE t.name = v.name
              AND t.source = v.source
              AND t.country_code = v.country_code
              AND DATE_FORMAT(t.timestamp, '%Y-%m-%d %H:00:00') =
                  DATE_FORMAT(v.timestamp, '%Y-%m-%d %H:00:00')
          )
        `,
        insertParams
      )
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const sql = `
    WITH ranked AS (
      SELECT
        name,
        url,
        source,
        volume,
        timestamp,
        country_code,
        ROW_NUMBER() OVER (
          PARTITION BY
            name,
            source,
            country_code,
            DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
          ORDER BY timestamp DESC
        ) AS rn
      FROM trends
      ${whereSql}
    )
    SELECT name, url, source, volume, timestamp, country_code
    FROM ranked
    WHERE rn = 1
    ORDER BY timestamp DESC
    LIMIT 1000
  `

  const rows = await query<SourceTrend[]>(sql, params)
  return NextResponse.json({ trends: rows, failedSources })
}

