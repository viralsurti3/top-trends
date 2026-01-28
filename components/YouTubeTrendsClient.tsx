/* eslint-disable react/no-array-index-key */
'use client'

import { useEffect, useMemo, useState } from 'react'
import SiteHeader from '@/components/SiteHeader'
import { countries, getCountryName } from '@/lib/countries'

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

const languageCopy = {
  EN: {
    title: 'YouTube Trends',
    subtitle: 'Trending channels, keywords, and videos by category.',
    loading: 'Loading YouTube trends...',
    error: 'Failed to load YouTube trends.',
    load: 'Load trends',
    loadingButton: 'Loading...',
    channels: 'Trending Channels',
    keywords: 'Popular Keywords',
    categories: 'Trending Videos by Category',
    videos: 'videos',
    noResults: 'No results for this search.',
    noChannels: 'No channels available right now.',
    noCategories: 'No trending videos available right now.',
    region: 'Region',
    source: 'Source:',
    updated: 'Updated',
  },
  IT: {
    title: 'Trend YouTube',
    subtitle: 'Canali, keyword e video di tendenza per categoria.',
    loading: 'Caricamento trend YouTube...',
    error: 'Impossibile caricare i trend YouTube.',
    load: 'Carica trend',
    loadingButton: 'Caricamento...',
    channels: 'Canali in tendenza',
    keywords: 'Keyword popolari',
    categories: 'Video in tendenza per categoria',
    videos: 'video',
    noResults: 'Nessun risultato per questa ricerca.',
    noChannels: 'Nessun canale disponibile al momento.',
    noCategories: 'Nessun video in tendenza disponibile al momento.',
    region: 'Paese',
    source: 'Fonte:',
    updated: 'Aggiornato',
  },
} as const

function matchesQuery(value: string, query: string) {
  if (!query) return true
  return value.toLowerCase().includes(query)
}

function formatRelativeTime(value: number | null, language: 'EN' | 'IT') {
  if (!value || Number.isNaN(value)) {
    return language === 'IT' ? 'N/D' : 'N/A'
  }
  const diffMs = Date.now() - value
  const minutes = Math.max(Math.floor(diffMs / 60000), 0)
  if (minutes < 5) return language === 'IT' ? 'pochi minuti fa' : 'a few mins ago'
  if (minutes < 30) return language === 'IT' ? "mezz'ora fa" : 'half an hour ago'
  if (minutes < 60) return language === 'IT' ? '1 ora fa' : '1 hour ago'
  const hours = Math.floor(minutes / 60)
  if (hours < 24)
    return language === 'IT' ? `${hours} ore fa` : `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days < 7)
    return language === 'IT' ? `${days} giorni fa` : `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks <= 1) return language === 'IT' ? '1 settimana fa' : '1 week ago'
  return language === 'IT' ? `${weeks} settimane fa` : `${weeks} weeks ago`
}

export default function YouTubeTrendsClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [language, setLanguage] = useState<'EN' | 'IT'>('EN')
  const [region, setRegion] = useState('GLOBAL')
  const [expandedChannels, setExpandedChannels] = useState<Record<string, boolean>>({})
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [data, setData] = useState<YoutubeTrendPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setExpandedChannels({})
    setExpandedCategories({})
  }, [region])

  useEffect(() => {
    let isActive = true
    const params = new URLSearchParams()
    if (region) {
      params.set('region', region)
    }
    setIsLoading(true)
    setError(null)
    fetch(`/api/youtube-trends?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Request failed')
        }
        return res.json() as Promise<YoutubeTrendPayload>
      })
      .then((payload) => {
        if (!isActive) return
        setData(payload)
      })
      .catch((err) => {
        if (!isActive) return
        setError(err instanceof Error ? err.message : 'Unknown error')
        setData(null)
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [region])

  const query = searchQuery.trim().toLowerCase()
  const copy = languageCopy[language]
  const updatedRelative = useMemo(() => {
    const timestamp = data?.source?.fetchedAt ? Date.parse(data.source.fetchedAt) : null
    return formatRelativeTime(timestamp, language)
  }, [data?.source?.fetchedAt, language])

  const filteredKeywords = useMemo(() => {
    if (!data) return []
    return data.keywords.filter((keyword) => matchesQuery(keyword, query))
  }, [data, query])

  const filteredChannels = useMemo(() => {
    if (!data) return []
    return data.channels.filter((channel) => {
      if (matchesQuery(channel.name, query)) return true
      return channel.videos.some((video) => matchesQuery(video.title, query))
    })
  }, [data, query])

  const filteredCategories = useMemo(() => {
    if (!data) return []
    return data.categories
      .map((category) => {
        if (!query) return category
        const items = category.items.filter((item) => {
          if (matchesQuery(item.title, query)) return true
          if (item.channel && matchesQuery(item.channel, query)) return true
          if (item.raw && matchesQuery(item.raw, query)) return true
          return false
        })
        return { ...category, items }
      })
      .filter((category) => (query ? category.items.length > 0 : true))
  }, [data, query])

  const showNoResults =
    !isLoading &&
    !error &&
    data &&
    query &&
    filteredChannels.length === 0 &&
    filteredKeywords.length === 0 &&
    filteredCategories.every((category) => category.items.length === 0)

  const handleLoadTrends = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchRefresh = async (regionCode: string) => {
        const params = new URLSearchParams()
        if (regionCode) {
          params.set('region', regionCode)
        }
        params.set('refresh', '1')
        const res = await fetch(`/api/youtube-trends?${params.toString()}`)
        if (!res.ok) {
          throw new Error('Request failed')
        }
        return (await res.json()) as YoutubeTrendPayload
      }

      const payload = await fetchRefresh(region)
      setData(payload)

      if (region === 'GLOBAL') {
        void (async () => {
          for (const country of countries) {
            if (country.code === 'GLOBAL') continue
            try {
              await fetchRefresh(country.code)
            } catch {
              // best-effort background refresh
            }
          }
        })()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] text-[#1f2937] relative">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#eef2ff] via-[#f8fafc] to-transparent pointer-events-none -z-10" />
      <SiteHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        language={language}
        onLanguageChange={setLanguage}
      />
      <div className="relative max-w-[80%] mx-auto px-6 py-10 space-y-8">
        <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-semibold text-[#111827]">{copy.title}</h1>
          <p className="mt-3 text-base text-[#4b5563]">{copy.subtitle}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#6b7280]">
            <span>{copy.region}</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm bg-white shadow-sm text-[#111827]"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-[#9ca3af]">
              {region === 'GLOBAL' ? 'Global' : getCountryName(region)}
            </span>
            <button
              type="button"
              onClick={handleLoadTrends}
              disabled={isLoading}
              className="ml-auto px-4 py-2 rounded-lg text-sm font-medium border border-[#e5e7eb] text-[#1f2937] hover:border-[#c7d2fe] hover:text-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? copy.loadingButton : copy.load}
            </button>
            <span className="text-xs text-[#9ca3af] w-full">
              {copy.updated} {updatedRelative}
            </span>
          </div>
        </div>

        {isLoading && (
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 text-sm text-[#6b7280]">
            {copy.loading}
          </div>
        )}

        {error && (
          <div className="bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] rounded-2xl px-6 py-4 text-sm">
            {copy.error}
          </div>
        )}

        {showNoResults && (
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 text-sm text-[#6b7280]">
            {copy.noResults}
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#111827] mb-4">
                  {copy.channels}
                </h2>
                <div className="space-y-4">
                  {filteredChannels.length === 0 ? (
                    <div className="text-sm text-[#9ca3af]">{copy.noChannels}</div>
                  ) : (
                    filteredChannels.map((channel) => (
                      <div
                        key={`${channel.rank}-${channel.name}`}
                        className="border border-[#eef2f7] rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-[#111827]">
                            {channel.rank}. {channel.name}
                          </div>
                          {channel.videoCount ? (
                            <div className="text-xs text-[#6b7280]">
                              {channel.videoCount} {copy.videos}
                            </div>
                          ) : null}
                        </div>
                        {channel.stats?.length ? (
                          <div className="mt-2 text-xs text-[#9ca3af]">
                            {channel.stats.join(' · ')}
                          </div>
                        ) : null}
                        {channel.videos.length > 0 && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedChannels((prev) => ({
                                  ...prev,
                                  [channel.name]: !prev[channel.name],
                                }))
                              }
                              className="text-xs font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                            >
                              {expandedChannels[channel.name] ? 'Hide videos' : 'Show videos'}
                            </button>
                            {expandedChannels[channel.name] && (
                              <ul className="mt-3 space-y-2 text-sm text-[#374151]">
                                {channel.videos.map((video, index) => (
                                  <li key={`${channel.name}-${index}`}>
                                    <div className="flex items-center gap-3">
                                      {video.thumbnailUrl ? (
                                        <a
                                          href={video.videoUrl || '#'}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="shrink-0 w-16 h-12 rounded-md overflow-hidden border border-[#e5e7eb] bg-[#f3f4f6]"
                                        >
                                          <img
                                            src={video.thumbnailUrl}
                                            alt={video.title}
                                            className="w-full h-full object-cover"
                                          />
                                        </a>
                                      ) : null}
                                      <a
                                        href={video.videoUrl || '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="hover:text-[#1d4ed8] transition-colors"
                                      >
                                        {video.title}
                                      </a>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#111827] mb-4">
                  {copy.keywords}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {filteredKeywords.map((keyword, index) => (
                    <span
                      key={`${keyword}-${index}`}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-[#eef2ff] text-[#3730a3] border border-[#c7d2fe]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#111827] mb-6">
                {copy.categories}
              </h2>
              {filteredCategories.length === 0 ? (
                <div className="text-sm text-[#9ca3af]">{copy.noCategories}</div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.name}
                      className="border border-[#eef2f7] rounded-xl p-4"
                    >
                      <h3 className="font-semibold text-[#111827] mb-3">
                        {category.name}
                      </h3>
                      <ol className="space-y-3 text-sm text-[#374151]">
                        {(expandedCategories[category.name]
                          ? category.items
                          : category.items.slice(0, 5)
                        ).map((item) => (
                          <li key={`${category.name}-${item.rank}-${item.title}`}>
                            <div className="flex gap-3">
                              {item.thumbnailUrl ? (
                                <a
                                  href={item.videoUrl || '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="shrink-0 w-16 h-12 rounded-md overflow-hidden border border-[#e5e7eb] bg-[#f3f4f6]"
                                >
                                  <img
                                    src={item.thumbnailUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              ) : null}
                              <div className="min-w-0">
                                <a
                                  href={item.videoUrl || '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium hover:text-[#1d4ed8] transition-colors"
                                >
                                  {item.rank}. {item.title}
                                </a>
                                {(item.channel || item.published || item.metrics?.length) && (
                                  <div className="text-xs text-[#9ca3af]">
                                    {[item.channel, item.published, item.metrics?.join(' · ')]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                      {category.items.length > 5 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCategories((prev) => ({
                              ...prev,
                              [category.name]: !prev[category.name],
                            }))
                          }
                          className="mt-3 text-xs font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                        >
                          {expandedCategories[category.name] ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
