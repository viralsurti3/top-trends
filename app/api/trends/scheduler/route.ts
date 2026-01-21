import { NextResponse } from 'next/server'
import { getSchedulerState, startScheduler } from '@/lib/trend_scheduler'
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
  const { searchParams } = new URL(request.url)
  const enabled = searchParams.get('enabled') !== 'false'
  const intervalMinutes = Number(searchParams.get('intervalMinutes') || 30)
  const countries = parseCountries(searchParams.get('countries'))

  if (!enabled) {
    return NextResponse.json({ ok: false, message: 'Scheduler disabled' })
  }

  const state = await startScheduler(intervalMinutes, countries)
  return NextResponse.json({
    ok: true,
    started: state.started,
    intervalMinutes: state.intervalMs / 60000,
    countries: state.countries,
  })
}

export async function GET() {
  const state = getSchedulerState()
  return NextResponse.json({
    started: state.started,
    intervalMinutes: state.intervalMs / 60000,
    countries: state.countries,
  })
}

