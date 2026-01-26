import { NextResponse } from 'next/server'
import { ensureSchema, query } from '@/lib/db'

type YoutubeTrendChannel = {
  rank: number
  name: string
  videoCount?: number
  stats?: string[]
  videos: Array<{
    title: string
    videoUrl?: string
    thumbnailUrl?: string
  }>
}

type YoutubeTrendItem = {
  rank: number
  title: string
  published?: string
  channel?: string
  metrics?: string[]
  videoUrl?: string
  thumbnailUrl?: string
  raw?: string
}

type YoutubeTrendCategory = {
  name: string
  items: YoutubeTrendItem[]
}

type YoutubeTrendPayload = {
  source: {
    url: string
    fetchedAt: string
  }
  channels: YoutubeTrendChannel[]
  keywords: string[]
  categories: YoutubeTrendCategory[]
}

type YoutubeVideo = {
  id: string
  snippet?: {
    title?: string
    channelTitle?: string
    channelId?: string
    publishedAt?: string
    tags?: string[]
    thumbnails?: {
      medium?: { url?: string }
      high?: { url?: string }
      standard?: { url?: string }
    }
    categoryId?: string
  }
  statistics?: {
    viewCount?: string
    likeCount?: string
  }
}

type YoutubeCategory = {
  id: string
  snippet?: {
    title?: string
  }
}

const SOURCE_URL = 'https://www.youtube.com/feed/trending'
const GLOBAL_REGIONS = ['US', 'GB', 'IN', 'BR', 'JP', 'DE', 'FR', 'KR', 'CA', 'AU']

function formatCompactNumber(value?: string) {
  const numeric = Number(value || 0)
  if (Number.isNaN(numeric) || numeric === 0) return undefined
  if (numeric >= 1000000000) return `${(numeric / 1000000000).toFixed(1)}B`
  if (numeric >= 1000000) return `${(numeric / 1000000).toFixed(1)}M`
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(1)}K`
  return `${numeric}`
}

function formatPublished(value?: string) {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function fetchJson<T>(url: string) {
  const res = await fetch(url, { next: { revalidate: 900 } })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

async function fetchVideosForRegion(apiKey: string, regionCode: string, maxResults: number) {
  const url =
    `https://www.googleapis.com/youtube/v3/videos?` +
    new URLSearchParams({
      part: 'snippet,statistics',
      chart: 'mostPopular',
      regionCode,
      maxResults: maxResults.toString(),
      key: apiKey,
    }).toString()
  return fetchJson<{ items?: YoutubeVideo[] }>(url)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing YOUTUBE_API_KEY' },
      { status: 500 }
    )
  }

  await ensureSchema()

  const region =
    searchParams.get('region') ||
    process.env.YOUTUBE_REGION ||
    process.env.NEXT_PUBLIC_YOUTUBE_REGION ||
    'US'
  const refresh = searchParams.get('refresh') === '1'
  const isGlobal = region === 'GLOBAL'
  const normalizedRegion = isGlobal ? 'US' : region
  const maxResults = Math.min(
    Number(searchParams.get('maxResults') || process.env.YOUTUBE_MAX_RESULTS || 50),
    50
  )

  if (!refresh) {
    const rows = await query<Array<{ payload: YoutubeTrendPayload }>>(
      `
        SELECT payload
        FROM youtube_trends_snapshots
        WHERE region_code = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [region]
    )
    if (rows[0]?.payload) {
      return NextResponse.json(rows[0].payload)
    }
    return NextResponse.json({
      source: {
        url: isGlobal ? `${SOURCE_URL}?gl=GLOBAL` : `${SOURCE_URL}?gl=${normalizedRegion}`,
        fetchedAt: null,
      },
      channels: [],
      keywords: [],
      categories: [],
    })
  }

  const categoriesUrl =
    `https://www.googleapis.com/youtube/v3/videoCategories?` +
    new URLSearchParams({
      part: 'snippet',
      regionCode: normalizedRegion,
      key: apiKey,
    }).toString()

  const [videosData, categoriesData] = await Promise.all([
    isGlobal
      ? Promise.all(
          GLOBAL_REGIONS.map((code) => fetchVideosForRegion(apiKey, code, Math.min(maxResults, 20)))
        )
      : fetchVideosForRegion(apiKey, normalizedRegion, maxResults),
    fetchJson<{ items?: YoutubeCategory[] }>(categoriesUrl),
  ])

  const categoryLookup = new Map<string, string>()
  categoriesData.items?.forEach((category) => {
    if (category.id && category.snippet?.title) {
      categoryLookup.set(category.id, category.snippet.title)
    }
  })

  const videos = Array.isArray(videosData)
    ? Array.from(
        new Map(
          videosData.flatMap((batch) => batch.items || []).map((video) => [video.id, video])
        ).values()
      )
    : videosData.items || []
  const keywordsMap = new Map<string, number>()
  const channelsMap = new Map<
    string,
    {
      name: string
      channelId?: string
      videos: Array<{ title: string; videoUrl?: string; thumbnailUrl?: string }>
      views: number
    }
  >()
  const categoriesMap = new Map<string, YoutubeTrendCategory>()

  videos.forEach((video, index) => {
    const title = video.snippet?.title || 'Untitled'
    const channel = video.snippet?.channelTitle
    const channelId = video.snippet?.channelId
    const published = formatPublished(video.snippet?.publishedAt)
    const viewCount = formatCompactNumber(video.statistics?.viewCount)
    const likeCount = formatCompactNumber(video.statistics?.likeCount)
    const metrics = [viewCount ? `${viewCount} views` : null, likeCount ? `${likeCount} likes` : null]
      .filter(Boolean) as string[]
    const thumbnailUrl =
      video.snippet?.thumbnails?.high?.url ||
      video.snippet?.thumbnails?.standard?.url ||
      video.snippet?.thumbnails?.medium?.url
    const videoUrl = video.id ? `https://www.youtube.com/watch?v=${video.id}` : undefined

    if (video.snippet?.tags) {
      video.snippet.tags.forEach((tag) => {
        const normalized = tag.trim().toLowerCase()
        if (!normalized) return
        keywordsMap.set(normalized, (keywordsMap.get(normalized) || 0) + 1)
      })
    }

    if (channel) {
      const existing = channelsMap.get(channel) || {
        name: channel,
        channelId,
        videos: [],
        views: 0,
      }
      existing.videos.push({
        title,
        videoUrl,
        thumbnailUrl,
      })
      existing.views += Number(video.statistics?.viewCount || 0)
      channelsMap.set(channel, existing)
    }

    const categoryId = video.snippet?.categoryId || '0'
    const categoryName = categoryLookup.get(categoryId) || 'Other'
    const category = categoriesMap.get(categoryName) || { name: categoryName, items: [] }
    category.items.push({
      rank: index + 1,
      title,
      published,
      channel,
      metrics: metrics.length > 0 ? metrics : undefined,
      videoUrl,
      thumbnailUrl,
      raw: title,
    })
    categoriesMap.set(categoryName, category)
  })

  const keywords = Array.from(keywordsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([keyword]) => keyword)

  const channels = Array.from(channelsMap.values())
    .sort((a, b) => b.videos.length - a.videos.length || b.views - a.views)
    .slice(0, 10)
    .map((channel, index) => ({
      rank: index + 1,
      name: channel.name,
      videoCount: channel.videos.length,
      stats: channel.views ? [`${formatCompactNumber(channel.views.toString())} views`] : undefined,
      videos: channel.videos.slice(0, 3),
    }))

  const categories = Array.from(categoriesMap.values())
    .map((category) => ({
      ...category,
      items: category.items.slice(0, 20),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const payload: YoutubeTrendPayload = {
    source: {
      url: isGlobal
        ? `${SOURCE_URL}?gl=GLOBAL`
        : `${SOURCE_URL}?gl=${normalizedRegion}`,
      fetchedAt: new Date().toISOString(),
    },
    channels,
    keywords,
    categories,
  }

  await query(
    `
      INSERT INTO youtube_trends_snapshots (region_code, payload)
      VALUES ($1, $2)
    `,
    [region, payload]
  )

  return NextResponse.json(payload)
}
