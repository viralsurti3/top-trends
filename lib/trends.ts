export type TrendSource = 'reddit' | 'google' | 'youtube'

export type TrendItem = {
  name: string
  url: string
  source: TrendSource
  volume?: string
  timestamp: string
}

type TrendItemInternal = TrendItem & {
  popularity: number
  raw?: unknown
}

const subredditByCountry: Record<string, string> = {
  US: 'news',
  GB: 'unitedkingdom',
  CA: 'canada',
  AU: 'australia',
  DE: 'de',
  FR: 'france',
  IT: 'italy',
  ES: 'spain',
  NL: 'thenetherlands',
  BE: 'belgium',
  CH: 'switzerland',
  AT: 'austria',
  SE: 'sweden',
  NO: 'norway',
  DK: 'denmark',
  FI: 'finland',
  PL: 'polska',
  PT: 'portugal',
  GR: 'greece',
  IE: 'ireland',
  IN: 'india',
  JP: 'japan',
  KR: 'korea',
  BR: 'brasil',
  MX: 'mexico',
  AR: 'argentina',
  CL: 'chile',
  ZA: 'southafrica',
  NZ: 'newzealand',
  SG: 'singapore',
  MY: 'malaysia',
  TH: 'thailand',
  PH: 'philippines',
  ID: 'indonesia',
  TR: 'turkey',
  SA: 'saudiarabia',
  AE: 'uae',
  EG: 'egypt',
}

function getSubreddit(countryCode: string): string {
  const code = countryCode.trim().toUpperCase()
  return subredditByCountry[code] || 'worldnews'
}

function formatVolume(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function parseVolumeToNumber(volume?: string): number {
  if (!volume) return 0
  const normalized = volume.replace(/,/g, '').toLowerCase()
  if (normalized.includes('m')) {
    const num = parseFloat(normalized.replace(/[^0-9.]/g, ''))
    return Number.isNaN(num) ? 0 : Math.round(num * 1000000)
  }
  if (normalized.includes('k')) {
    const num = parseFloat(normalized.replace(/[^0-9.]/g, ''))
    return Number.isNaN(num) ? 0 : Math.round(num * 1000)
  }
  const digits = normalized.replace(/[^0-9]/g, '')
  return digits ? Number(digits) : 0
}

function extractTag(item: string, tag: string): string | undefined {
  const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
  return match?.[1] ? decodeHtml(match[1].trim()) : undefined
}

async function fetchGoogleTrends(
  countryCode: string
): Promise<TrendItemInternal[]> {
  const url = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${countryCode}`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) {
      console.warn('Google Trends RSS error:', res.status, res.statusText)
      return []
    }

    const xml = await res.text()
    const items = xml.split('<item>').slice(1).map((part) => {
      const end = part.indexOf('</item>')
      return end === -1 ? part : part.slice(0, end)
    })

    return items.map((item) => {
      const name = extractTag(item, 'title') || 'Untitled'
      const link = extractTag(item, 'link') || 'https://trends.google.com'
      const volume = extractTag(item, 'ht:approx_traffic')
      const pubDate = extractTag(item, 'pubDate')
      const popularity = parseVolumeToNumber(volume)
      return {
        name,
        url: link,
        source: 'google',
        volume,
        timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        popularity,
        raw: item,
      }
    })
  } catch (error) {
    console.warn('Google Trends RSS fetch failed:', error)
    return []
  }
}

async function fetchRedditTrends(
  countryCode: string
): Promise<TrendItemInternal[]> {
  const subreddit = getSubreddit(countryCode)
  const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=10&t=day`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'top-trends-dashboard/1.0',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      console.warn('Reddit API error:', res.status, res.statusText)
      return []
    }

    const data = (await res.json()) as {
      data?: {
        children?: Array<{
          data?: {
            id?: string
            title?: string
            score?: number
            permalink?: string
            created_utc?: number
          }
        }>
      }
    }

    return (
      data.data?.children?.map((child) => {
        const popularity = child.data?.score || 0
        const createdUtc = child.data?.created_utc
        return {
          name: child.data?.title || 'Untitled',
          url: child.data?.permalink
            ? `https://www.reddit.com${child.data.permalink}`
            : 'https://www.reddit.com',
          source: 'reddit',
          volume: popularity ? formatVolume(popularity) : undefined,
          timestamp: createdUtc
            ? new Date(createdUtc * 1000).toISOString()
            : new Date().toISOString(),
          popularity,
          raw: child,
        }
      }) || []
    )
  } catch (error) {
    console.warn('Reddit API fetch failed:', error)
    return []
  }
}

export async function getTrendsByCountry(
  countryCode: string
): Promise<TrendItem[]> {
  const [reddit, google] = await Promise.all([
    fetchRedditTrends(countryCode),
    fetchGoogleTrends(countryCode),
  ])

  return [...reddit, ...google]
    .sort((a, b) => b.popularity - a.popularity)
    .map(({ popularity: _popularity, raw: _raw, ...rest }) => rest)
}

