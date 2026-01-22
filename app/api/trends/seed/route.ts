import { NextResponse } from 'next/server'
import { ensureSchema, query } from '@/lib/db'

function clamp(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value
}

function sanitizeTrend(trend: {
  name: string
  url: string
  source: string
  volume?: string | null
  timestamp: Date
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

export async function POST() {
  await ensureSchema()

  const now = new Date()
  const rows = [
    {
      name: '#AIRevolution',
      url: 'https://x.com/search?q=%23AIRevolution',
      source: 'x',
      volume: '245K',
      timestamp: now,
      country_code: 'GLOBAL',
    },
    {
      name: 'Climate Action Summit',
      url: 'https://www.reddit.com/r/worldnews/',
      source: 'reddit',
      volume: '18K',
      timestamp: now,
      country_code: 'GLOBAL',
    },
    {
      name: 'TechCrunch: AI Hardware Wave',
      url: 'https://techcrunch.com/',
      source: 'techcrunch',
      volume: '12K',
      timestamp: now,
      country_code: 'US',
    },
    {
      name: 'Google Trends: Space Exploration',
      url: 'https://trends.google.com/trends/trendingsearches/daily?geo=US',
      source: 'google',
      volume: '500K',
      timestamp: now,
      country_code: 'US',
    },
    {
      name: '#TravelGoals',
      url: 'https://www.instagram.com/explore/tags/travelgoals/',
      source: 'instagram',
      volume: '310K',
      timestamp: now,
      country_code: 'GB',
    },
  ]

  const safeRows = rows.map(sanitizeTrend)
  const values = safeRows
    .map((_, index) => {
      const base = index * 6
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
    })
    .join(', ')
  const params = safeRows.flatMap((row) => [
    row.name,
    row.url,
    row.source,
    row.volume,
    new Date(row.timestamp),
    row.country_code,
  ])

  await query(
    `
      INSERT INTO trends (name, url, source, volume, timestamp, country_code)
      VALUES ${values}
    `,
    params
  )

  return NextResponse.json({ ok: true, inserted: rows.length })
}

