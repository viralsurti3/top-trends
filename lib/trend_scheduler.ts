import { fetchAllSources } from '@/lib/trend_fetchers'
import { ensureSchema, query } from '@/lib/db'

type SchedulerState = {
  started: boolean
  intervalId?: NodeJS.Timeout
  intervalMs: number
  countries: string[]
}

const globalState = globalThis as typeof globalThis & {
  __trendScheduler?: SchedulerState
}

function getState(): SchedulerState {
  if (!globalState.__trendScheduler) {
    globalState.__trendScheduler = {
      started: false,
      intervalMs: 60 * 60 * 1000,
      countries: ['GLOBAL'],
    }
  }
  return globalState.__trendScheduler
}

async function insertTrends(countryCode: string) {
  const { trends } = await fetchAllSources(countryCode)
  if (trends.length === 0) return 0

  const values = trends
    .map((_, index) => {
      const base = index * 6
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
    })
    .join(', ')
  const params = trends.flatMap((trend) => [
    trend.name,
    trend.url,
    trend.source,
    trend.volume || null,
    trend.timestamp,
    trend.country_code,
  ])

  await query(
    `
      INSERT INTO trends (name, url, source, volume, timestamp, country_code)
      SELECT v.name, v.url, v.source, v.volume, v.timestamp, v.country_code
      FROM (VALUES ${values}) AS v(name, url, source, volume, timestamp, country_code)
      WHERE NOT EXISTS (
        SELECT 1
        FROM trends t
        WHERE t.name = v.name
          AND t.source = v.source
          AND t.country_code = v.country_code
          AND date_trunc('hour', t.timestamp) = date_trunc('hour', v.timestamp)
      )
    `,
    params
  )

  return trends.length
}

export async function startScheduler(intervalMinutes: number, countries: string[]) {
  const state = getState()
  if (state.started && state.intervalId) {
    clearInterval(state.intervalId)
    state.started = false
  }

  state.intervalMs = intervalMinutes * 60 * 1000
  state.countries = countries

  await ensureSchema()

  state.intervalId = setInterval(async () => {
    for (const countryCode of state.countries) {
      try {
        await insertTrends(countryCode)
      } catch (error) {
        console.warn('Trend fetch scheduler error:', error)
      }
    }
  }, state.intervalMs)

  state.started = true
  return state
}

export function getSchedulerState() {
  return getState()
}

