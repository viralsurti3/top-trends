import { NextResponse } from 'next/server'
import { ensureSchema, query } from '@/lib/db'

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

  const values = rows
    .map((_, index) => {
      const base = index * 6
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
    })
    .join(', ')
  const params = rows.flatMap((row) => [
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

