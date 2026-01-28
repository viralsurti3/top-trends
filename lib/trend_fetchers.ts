type Trend = {
  name: string
  url: string
  source: string
  volume?: string
  timestamp: string
  country_code: string
}

import { countries } from '@/lib/countries'

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

function normalizeSubreddit(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getSubredditCandidates(countryCode: string): string[] {
  const code = countryCode.toUpperCase()
  if (code === 'GLOBAL') return ['worldnews']
  const country = countries.find((item) => item.code === code)
  const mapped = subredditByCountry[code]
  const normalized = country ? normalizeSubreddit(country.name) : null
  const candidates = [mapped, normalized, code.toLowerCase(), 'worldnews']
  return Array.from(new Set(candidates.filter(Boolean))) as string[]
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function stripCdata(value: string): string {
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim()
}

function extractTag(item: string, tag: string): string | undefined {
  const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
  return match?.[1] ? decodeHtml(stripCdata(match[1].trim())) : undefined
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

function formatFetchError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'top-trends-dashboard/1.0',
    },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`)
  }
  return res.text()
}

function jina(url: string): string {
  const clean = url.replace(/^https?:\/\//, '')
  return `https://r.jina.ai/http://${clean}`
}

export async function fetchRedditTrends(countryCode: string): Promise<Trend[]> {
  const limit = 50
  const candidates = getSubredditCandidates(countryCode)

  for (const subreddit of candidates) {
    const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=day&raw_json=1`
    try {
      const text = await fetchText(url)
      const data = JSON.parse(text) as {
        data?: {
          children?: Array<{
            data?: {
              title?: string
              score?: number
              permalink?: string
              created_utc?: number
            }
          }>
        }
      }
      const trends =
        data.data?.children?.map((child) => {
          const score = child.data?.score || 0
          const createdUtc = child.data?.created_utc
          return {
            name: child.data?.title || 'Untitled',
            url: child.data?.permalink
              ? `https://www.reddit.com${child.data.permalink}`
              : 'https://www.reddit.com',
            source: 'reddit',
            volume: score ? formatVolume(score) : undefined,
            timestamp: createdUtc
              ? new Date(createdUtc * 1000).toISOString()
              : new Date().toISOString(),
            country_code: countryCode,
          }
        }) || []
      if (trends.length > 0) {
        return trends
      }
    } catch (error) {
      const rssUrl = `https://www.reddit.com/r/${subreddit}/top/.rss?limit=${limit}&t=day`
      const trends = await fetchRssTrends(rssUrl, 'reddit', countryCode, limit)
      if (trends.length > 0) {
        return trends
      }
    }
  }

  throw new Error(`No Reddit trends for ${countryCode}`)
}

export async function fetchHackerNewsTrends(countryCode: string): Promise<Trend[]> {
  const url = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=10'
  const text = await fetchText(url)
  const data = JSON.parse(text) as {
    hits?: Array<{
      title?: string
      url?: string
      points?: number
      created_at?: string
      objectID?: string
    }>
  }
  return (
    data.hits?.map((item) => ({
      name: item.title || 'Untitled',
      url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
      source: 'hackernews',
      volume: item.points ? formatVolume(item.points) : undefined,
      timestamp: item.created_at
        ? new Date(item.created_at).toISOString()
        : new Date().toISOString(),
      country_code: countryCode,
    })) || []
  )
}

export async function fetchRssTrends(
  target: string,
  source: string,
  countryCode: string,
  limit = 10
): Promise<Trend[]> {
  const xml = await fetchText(target)
  const items = xml.split('<item>').slice(1).map((part) => {
    const end = part.indexOf('</item>')
    return end === -1 ? part : part.slice(0, end)
  })
  return items.slice(0, limit).map((item) => {
    const name = extractTag(item, 'title') || 'Untitled'
    const link = extractTag(item, 'link') || target
    const pubDate = extractTag(item, 'pubDate')
    return {
      name,
      url: link,
      source,
      timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      country_code: countryCode,
    }
  })
}

export async function fetchYoutubeTrends(countryCode: string): Promise<Trend[]> {
  const gl = countryCode.toUpperCase() === 'GLOBAL' ? 'US' : countryCode.toUpperCase()
  const url = jina(`https://www.youtube.com/feed/trending?gl=${gl}`)
  const md = await fetchText(url)
  const trends: Trend[] = []
  const lines = md.split('\n')
  for (const line of lines) {
    const match = line.match(/\[([^\]]+)\]\((https:\/\/www\.youtube\.com\/watch\?v=[^)]+)\)/)
    if (match && trends.length < 50) {
      const name = match[1].trim()
      if (name && !trends.find((t) => t.name === name)) {
        trends.push({
          name,
          url: match[2],
          source: 'youtube',
          timestamp: new Date().toISOString(),
          country_code: countryCode,
        })
      }
    }
  }
  return trends
}

export async function fetchXTrends(countryCode: string): Promise<Trend[]> {
  const slugMap: Record<string, string> = {
    US: 'united-states',
    GB: 'united-kingdom',
    IN: 'india',
    CA: 'canada',
    AU: 'australia',
    DE: 'germany',
    FR: 'france',
    BR: 'brazil',
    JP: 'japan',
  }
  const code = countryCode.toUpperCase()
  const geo = code === 'GLOBAL' ? 'world' : (slugMap[code] || 'world')
  const url = jina(`https://getdaytrends.com/${geo}/`)
  const md = await fetchText(url)
  const trends: Trend[] = []
  const lines = md.split('\n')
  for (const line of lines) {
    const match = line.match(/\[([^\]]+)\]\((https:\/\/getdaytrends\.com\/trend\/[^)]+)\)/)
    if (match && trends.length < 50) {
      const name = match[1].trim()
      if (name && !trends.find((t) => t.name === name)) {
        trends.push({
          name,
          url: `https://x.com/search?q=${encodeURIComponent(name)}`,
          source: 'x',
          timestamp: new Date().toISOString(),
          country_code: countryCode,
        })
      }
    }
  }
  return trends
}

export async function fetchInstagramTrends(countryCode: string): Promise<Trend[]> {
  const targets = [
    'https://top-hashtags.com/instagram/',
    'https://top-hashtags.com/instagram/hashtags/',
  ]
  const texts = await Promise.all(targets.map((target) => fetchText(jina(target))))
  const md = texts.join('\n')
  const hashtags = new Set<string>()
  const lines = md.split('\n')

  for (const line of lines) {
    const linkMatch = line.match(/\[\s*(#[^\]\s]+)\s*\]\(([^)]+)\)/)
    if (linkMatch?.[1]) {
      hashtags.add(linkMatch[1].trim())
    }
    const pathMatch = line.match(/\/hashtags\/([^/]+)\//i)
    if (pathMatch?.[1]) {
      hashtags.add(`#${pathMatch[1].trim()}`)
    }
    const inlineMatches = line.match(/#[A-Za-z0-9_]{2,}/g)
    if (inlineMatches) {
      inlineMatches.forEach((tag) => hashtags.add(tag.trim()))
    }
    if (hashtags.size >= 120) break
  }

  const names = Array.from(hashtags).slice(0, 100)
  if (names.length === 0) {
    throw new Error('No Instagram hashtags parsed')
  }

  return names.map((name) => ({
    name,
    url: `https://www.instagram.com/explore/tags/${name.replace('#', '')}/`,
    source: 'instagram',
    timestamp: new Date().toISOString(),
    country_code: countryCode,
  }))
}

export async function fetchAllSources(countryCode: string) {
  const sources = [
    { label: 'Reddit', promise: fetchRedditTrends(countryCode) },
    { label: 'X / Twitter', promise: fetchXTrends(countryCode) },
    { label: 'Instagram', promise: fetchInstagramTrends(countryCode) },
    { label: 'YouTube', promise: fetchYoutubeTrends(countryCode) },
  ]

  const results = await Promise.allSettled(sources.map((source) => source.promise))
  const trends: Trend[] = []
  const failedSources: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      trends.push(...result.value)
    } else {
      const reason = formatFetchError(result.reason)
      failedSources.push(
        reason ? `${sources[index].label} (${reason})` : sources[index].label
      )
    }
  })

  return { trends, failedSources }
}

export type { Trend }

