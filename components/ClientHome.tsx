'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ReadonlyURLSearchParams } from 'next/navigation'
import { countries, getCountryName } from '@/lib/countries'
import SiteHeader from '@/components/SiteHeader'
import {
  HomeVariantFour,
  HomeVariantOne,
  HomeVariantThree,
  HomeVariantTwo,
} from '@/components/home/HomeVariants'
import type { SourceStat, Trend } from '@/components/home/types'

type ClientHomeProps = {
  initialCountryCode?: string
  initialDate?: string | null
  initialSource?: string | null
}

function buildTrendsPath(countryCode: string, date?: string | null) {
  if (date) {
    return `/${encodeURIComponent(countryCode)}/${encodeURIComponent(date)}`
  }
  return `/${encodeURIComponent(countryCode)}`
}

function buildTrendsUrl(
  countryCode: string,
  date: string | null | undefined,
  variant: number,
  searchParams: ReadonlyURLSearchParams
) {
  const path = buildTrendsPath(countryCode, date)
  const params = new URLSearchParams(searchParams.toString())
  params.set('variant', variant.toString())
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

type TrendsResponse = {
  trends: Trend[]
  failedSources: string[]
}

type YoutubeTrendsPayload = {
  categories?: Array<{
    name: string
    items: Array<{
      title: string
      videoUrl?: string
    }>
  }>
  channels?: Array<{
    name: string
    videos: Array<{
      title: string
      videoUrl?: string
    }>
  }>
  keywords?: string[]
}

const sourceLabels: Record<string, string> = {
  x: 'X',
  reddit: 'Reddit',
  youtube: 'YouTube',
  instagram: 'Instagram',
}

function getRangeMinutes(range: '24h' | '48h' | '7d') {
  if (range === '48h') return 48 * 60
  if (range === '7d') return 7 * 24 * 60
  return 24 * 60
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

const languageCopy = {
  EN: {
    searchPlaceholder: 'Search trends...',
    selectCountry: 'Select Country',
    date: 'Date',
    timeRange: 'Time Range:',
    design: 'Design:',
    updated: 'Updated',
    refreshNow: 'Refresh now',
    refreshing: 'Refreshing...',
    failedToLoad: 'Failed to load trends.',
    sourcesUnavailable: 'Sources unavailable:',
    hotTopicsGlobal: 'Hot Topics Global',
    hotTopicsIn: 'Hot Topics in',
    loading: 'Loading...',
    noTrends: 'No trends available',
  },
  IT: {
    searchPlaceholder: 'Cerca trend...',
    selectCountry: 'Seleziona paese',
    date: 'Data',
    timeRange: 'Intervallo:',
    design: 'Design:',
    updated: 'Aggiornato',
    refreshNow: 'Aggiorna ora',
    refreshing: 'Aggiornamento...',
    failedToLoad: 'Impossibile caricare i trend.',
    sourcesUnavailable: 'Fonti non disponibili:',
    hotTopicsGlobal: 'Argomenti caldi globali',
    hotTopicsIn: 'Argomenti caldi in',
    loading: 'Caricamento...',
    noTrends: 'Nessun trend disponibile',
  },
} as const

export default function ClientHome({ initialCountryCode, initialDate }: ClientHomeProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCountryCode =
    initialCountryCode || searchParams.get('country') || 'GLOBAL'
  const selectedDate = initialDate ?? searchParams.get('date')
  const rawVariant = Number(searchParams.get('variant'))
  const activeVariant = [1, 2, 3, 4].includes(rawVariant) ? rawVariant : 1
  const selectedCountryName = getCountryName(selectedCountryCode)
  const [searchQuery, setSearchQuery] = useState('')
  const [language, setLanguage] = useState<'EN' | 'IT'>('EN')
  const [timeRange, setTimeRange] = useState<'24h' | '48h' | '7d'>('24h')
  const [trends, setTrends] = useState<Trend[]>([])
  const [globalTrends, setGlobalTrends] = useState<Trend[]>([])
  const [hotCountryTrends, setHotCountryTrends] = useState<Trend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [failedSources, setFailedSources] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [platformLimits, setPlatformLimits] = useState<Record<string, number>>({
    x: 5,
    reddit: 5,
    youtube: 5,
    instagram: 5,
  })
  const [youtubeFallbackTrends, setYoutubeFallbackTrends] = useState<Trend[]>([])

  const handleSelectCountry = (countryCode: string) => {
    router.push(buildTrendsUrl(countryCode, selectedDate, activeVariant, searchParams), {
      scroll: false,
    })
  }

  const handleDateChange = (value: string) => {
    const date = value || null
    router.push(buildTrendsUrl(selectedCountryCode, date, activeVariant, searchParams), {
      scroll: false,
    })
  }

  const handleVariantChange = (variant: number) => {
    router.push(buildTrendsUrl(selectedCountryCode, selectedDate, variant, searchParams), {
      scroll: false,
    })
  }

  const handleRefresh = async () => {
    if (selectedDate) return
    setIsRefreshing(true)
    setError(null)
    try {
      if (selectedCountryCode === 'GLOBAL') {
        const globalParams = new URLSearchParams({ countries: 'GLOBAL' })
        const res = await fetch(`/api/trends/fetch?${globalParams.toString()}`, {
          method: 'POST',
        })
        if (!res.ok) {
          throw new Error('Failed to refresh trends')
        }
        const backgroundParams = new URLSearchParams({ countries: 'ALL' })
        void fetch(`/api/trends/fetch?${backgroundParams.toString()}`, {
          method: 'POST',
        })
      } else {
        const params = new URLSearchParams({ countries: selectedCountryCode })
        const res = await fetch(`/api/trends/fetch?${params.toString()}`, {
          method: 'POST',
        })
        if (!res.ok) {
          throw new Error('Failed to refresh trends')
        }
      }
      setRefreshNonce((n) => n + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRefreshing(false)
    }
  }

  const hotCountryCode = selectedCountryCode === 'GLOBAL' ? 'IT' : selectedCountryCode

  useEffect(() => {
    let isActive = true
    setIsLoading(true)
    setError(null)
    setFailedSources([])
    const windowMinutes = getRangeMinutes(timeRange)

    const params = new URLSearchParams()
    params.set('countryCode', selectedCountryCode)
    if (selectedDate) {
      params.set('date', selectedDate)
    } else {
      params.set('windowMinutes', windowMinutes.toString())
    }

    const globalParams = new URLSearchParams()
    globalParams.set('countryCode', 'GLOBAL')
    if (selectedDate) {
      globalParams.set('date', selectedDate)
    } else {
      globalParams.set('windowMinutes', windowMinutes.toString())
    }

    const requests = [
      fetch(`/api/trends?${params.toString()}`),
      fetch(`/api/trends?${globalParams.toString()}`),
    ]
    if (hotCountryCode !== selectedCountryCode) {
      const hotParams = new URLSearchParams()
      hotParams.set('countryCode', hotCountryCode)
      if (selectedDate) {
        hotParams.set('date', selectedDate)
      } else {
        hotParams.set('windowMinutes', windowMinutes.toString())
      }
      requests.push(fetch(`/api/trends?${hotParams.toString()}`))
    }

    Promise.all(requests)
      .then(async (responses) => {
        const [countryRes, globalRes, hotRes] = responses
        if (!countryRes.ok || !globalRes.ok || (hotRes && !hotRes.ok)) {
          throw new Error('Failed to load trends')
        }
        const countryData = (await countryRes.json()) as TrendsResponse
        const globalData = (await globalRes.json()) as TrendsResponse
        const hotData = hotRes ? ((await hotRes.json()) as TrendsResponse) : null
        if (!isActive) return
        setTrends(countryData.trends || [])
        setGlobalTrends(globalData.trends || [])
        setHotCountryTrends(hotData ? hotData.trends || [] : countryData.trends || [])
        setFailedSources(countryData.failedSources || [])
      })
      .catch((err) => {
        if (!isActive) return
        setError(err instanceof Error ? err.message : 'Unknown error')
        setTrends([])
        setGlobalTrends([])
        setHotCountryTrends([])
        setFailedSources([])
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [selectedCountryCode, selectedDate, refreshNonce, timeRange, hotCountryCode])

  const rangeMinutes = useMemo(() => getRangeMinutes(timeRange), [timeRange])

  const filteredTrends = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const now = Date.now()
    return trends.filter((trend) => {
      const ts = Date.parse(trend.timestamp)
      const withinRange = Number.isNaN(ts) || now - ts <= rangeMinutes * 60000
      const matchesQuery = !query || trend.name.toLowerCase().includes(query)
      return withinRange && matchesQuery
    })
  }, [trends, searchQuery, rangeMinutes])

  const filteredGlobalTrends = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const now = Date.now()
    return globalTrends.filter((trend) => {
      const ts = Date.parse(trend.timestamp)
      const withinRange = Number.isNaN(ts) || now - ts <= rangeMinutes * 60000
      const matchesQuery = !query || trend.name.toLowerCase().includes(query)
      return withinRange && matchesQuery
    })
  }, [globalTrends, searchQuery, rangeMinutes])

  const hotGlobal = filteredGlobalTrends.slice(0, 3)
  const hotLocal = hotCountryTrends.slice(0, 3)

  const mixedHotGlobal = useMemo(() => {
    const sourceOrder = ['reddit', 'instagram', 'x', 'youtube']
    const buckets = new Map<string, Trend[]>()
    sourceOrder.forEach((source) => {
      buckets.set(
        source,
        filteredGlobalTrends.filter((trend) => trend.source === source)
      )
    })
    const mixed: Trend[] = []
    let round = 0
    while (mixed.length < 3 && round < 10) {
      sourceOrder.forEach((source) => {
        if (mixed.length >= 3) return
        const list = buckets.get(source)
        if (list && list.length > round) {
          mixed.push(list[round])
        }
      })
      round += 1
    }
    return mixed.length > 0 ? mixed : hotGlobal
  }, [filteredGlobalTrends, hotGlobal])

  const basePlatformTrends = useMemo(() => {
    const bySource: Record<string, Trend[]> = {}
    filteredTrends.forEach((trend) => {
      const key = trend.source
      if (!bySource[key]) {
        bySource[key] = []
      }
      bySource[key].push(trend)
    })
    return bySource
  }, [filteredTrends])

  const hasYoutubeData = (basePlatformTrends.youtube || []).length > 0

  const displayPlatformTrends = useMemo(() => {
    if (hasYoutubeData || youtubeFallbackTrends.length === 0) {
      return basePlatformTrends
    }
    return {
      ...basePlatformTrends,
      youtube: youtubeFallbackTrends,
    }
  }, [basePlatformTrends, hasYoutubeData, youtubeFallbackTrends])

  const handleShowMore = (platformId: string) => {
    const totalItems = (displayPlatformTrends[platformId] || []).length
    setPlatformLimits((prev) => ({
      ...prev,
      [platformId]: Math.min((prev[platformId] || 5) + 5, totalItems),
    }))
  }

  const copy = languageCopy[language]

  const sourceBreakdown = useMemo<SourceStat[]>(() => {
    const entries = Object.entries(displayPlatformTrends).map(([source, items]) => ({
      id: source,
      label: sourceLabels[source] ?? source,
      count: items.length,
    }))
    return entries.sort((a, b) => b.count - a.count)
  }, [displayPlatformTrends])

  const lastUpdatedLabel = useMemo(() => {
    const timestamps = [...filteredTrends, ...filteredGlobalTrends]
      .map((trend) => Date.parse(trend.timestamp))
      .filter((value) => Number.isFinite(value))
    if (timestamps.length === 0) {
      return language === 'IT' ? 'N/D' : 'N/A'
    }
    const latest = Math.max(...timestamps)
    const formatter = new Intl.DateTimeFormat(language === 'IT' ? 'it-IT' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    return formatter.format(new Date(latest))
  }, [filteredTrends, filteredGlobalTrends, language])

  const lastUpdatedRelative = useMemo(() => {
    const timestamps = [...filteredTrends, ...filteredGlobalTrends]
      .map((trend) => Date.parse(trend.timestamp))
      .filter((value) => Number.isFinite(value))
    if (timestamps.length === 0) {
      return formatRelativeTime(null, language)
    }
    return formatRelativeTime(Math.max(...timestamps), language)
  }, [filteredTrends, filteredGlobalTrends, language])

  const watchlist = useMemo(() => {
    const base = filteredTrends.length > 0 ? filteredTrends : filteredGlobalTrends
    return base.slice(0, 6)
  }, [filteredTrends, filteredGlobalTrends])

  useEffect(() => {
    if (isLoading || hasYoutubeData) {
      setYoutubeFallbackTrends([])
      return
    }
    let isActive = true

    const load = async () => {
      try {
        const fetchRegion = async (region: string) => {
          const params = new URLSearchParams({
            region,
            maxResults: '20',
          })
          const res = await fetch(`/api/youtube-trends?${params.toString()}`)
          if (!res.ok) {
            throw new Error('Failed to load YouTube trends')
          }
          return (await res.json()) as YoutubeTrendsPayload
        }

        const buildTrends = (payload: YoutubeTrendsPayload) => {
          const categoryItems =
            payload.categories?.flatMap((category) => category.items || []) || []
          const channelItems =
            payload.channels?.flatMap((channel) => channel.videos || []) || []
          const keywordItems = payload.keywords || []
          const picks =
            categoryItems.length > 0
              ? categoryItems
              : channelItems.length > 0
                ? channelItems
                : keywordItems.map((keyword) => ({
                    title: keyword,
                    videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`,
                  }))
          return picks.slice(0, 10).map((item) => ({
            name: item.title,
            url: item.videoUrl || 'https://www.youtube.com',
            source: 'youtube',
            timestamp: new Date().toISOString(),
          }))
        }

        const payload = await fetchRegion(selectedCountryCode)
        if (!isActive) return
        let trends = buildTrends(payload)

        if (trends.length === 0 && selectedCountryCode !== 'GLOBAL') {
          const globalPayload = await fetchRegion('GLOBAL')
          if (!isActive) return
          trends = buildTrends(globalPayload)
        }

        setYoutubeFallbackTrends(trends)
      } catch {
        if (!isActive) return
        setYoutubeFallbackTrends([])
      } finally {
        if (!isActive) return
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [selectedCountryCode, selectedDate, isLoading, hasYoutubeData])

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-[#1f2937]">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#eef2ff] via-[#f8fafc] to-transparent pointer-events-none" />
      <SiteHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        language={language}
        onLanguageChange={setLanguage}
      />

      <main className="relative max-w-[80%] mx-auto px-6 py-6 space-y-6 overflow-x-hidden">
        <div className="flex flex-wrap items-start gap-4 bg-white/90 border border-[#e5e7eb] rounded-2xl px-4 py-3 shadow-sm">
          <div className="relative flex items-center gap-2 pb-5">
            <span className="text-sm text-[#6b7280]">{copy.selectCountry}</span>
            <select
              value={selectedCountryCode}
              onChange={(e) => handleSelectCountry(e.target.value)}
              className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            <span className="absolute left-0 bottom-0 text-xs text-[#9ca3af] whitespace-nowrap">
              {copy.updated} {lastUpdatedRelative}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6b7280]">{copy.date}</span>
            <input
              type="date"
              value={selectedDate ?? ''}
              onChange={(e) => handleDateChange(e.target.value)}
              className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
            <span className="text-sm text-[#6b7280]">{copy.design}</span>
            <div className="flex items-center gap-1 rounded-full border border-[#e5e7eb] bg-[#f8fafc] p-1">
              {[1, 2, 3, 4].map((variant) => (
                <button
                  key={variant}
                  type="button"
                  onClick={() => handleVariantChange(variant)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    activeVariant === variant
                      ? 'bg-[#111827] text-white'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                >
                  {variant}
                </button>
              ))}
            </div>
            <span className="text-sm text-[#6b7280] ml-2">{copy.timeRange}</span>
            {(['24h', '48h', '7d'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  timeRange === range
                    ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-sm'
                    : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#c7d2fe] hover:text-[#374151]'
                }`}
              >
                {range}
              </button>
            ))}
            <div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || Boolean(selectedDate)}
                className="px-3 py-1.5 rounded-lg text-sm border transition border-[#e5e7eb] text-[#6b7280] hover:border-[#c7d2fe] hover:text-[#374151] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? copy.refreshing : copy.refreshNow}
              </button>
            </div>
          </div>
        </div>


        {error && (
          <div className="bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] rounded-lg px-4 py-2 text-sm">
            {copy.failedToLoad}
          </div>
        )}

        {failedSources.length > 0 && (
          <div className="bg-[#fef3c7] border border-[#fde68a] text-[#92400e] rounded-lg px-4 py-2 text-sm">
            {copy.sourcesUnavailable} {failedSources.join(', ')}
          </div>
        )}

        {activeVariant === 1 && (
          <HomeVariantOne
            copy={copy}
            language={language}
            selectedCountryName={selectedCountryName}
            hotCountryName={hotCountryCode === 'GLOBAL' ? 'Italy' : getCountryName(hotCountryCode)}
            isLoading={isLoading}
            mixedHotGlobal={mixedHotGlobal}
            hotLocal={hotLocal}
            platformTrends={displayPlatformTrends}
            platformLimits={platformLimits}
            onShowMore={handleShowMore}
            sourceBreakdown={sourceBreakdown}
            watchlist={watchlist}
            lastUpdatedLabel={lastUpdatedLabel}
          />
        )}

        {activeVariant === 2 && (
          <HomeVariantTwo
            copy={copy}
            language={language}
            selectedCountryName={selectedCountryName}
            hotCountryName={hotCountryCode === 'GLOBAL' ? 'Italy' : getCountryName(hotCountryCode)}
            isLoading={isLoading}
            mixedHotGlobal={mixedHotGlobal}
            hotLocal={hotLocal}
            platformTrends={displayPlatformTrends}
            platformLimits={platformLimits}
            onShowMore={handleShowMore}
            sourceBreakdown={sourceBreakdown}
            watchlist={watchlist}
            lastUpdatedLabel={lastUpdatedLabel}
          />
        )}

        {activeVariant === 3 && (
          <HomeVariantThree
            copy={copy}
            language={language}
            selectedCountryName={selectedCountryName}
            hotCountryName={hotCountryCode === 'GLOBAL' ? 'Italy' : getCountryName(hotCountryCode)}
            isLoading={isLoading}
            mixedHotGlobal={mixedHotGlobal}
            hotLocal={hotLocal}
            platformTrends={displayPlatformTrends}
            platformLimits={platformLimits}
            onShowMore={handleShowMore}
            sourceBreakdown={sourceBreakdown}
            watchlist={watchlist}
            lastUpdatedLabel={lastUpdatedLabel}
          />
        )}

        {activeVariant === 4 && (
          <HomeVariantFour
            copy={copy}
            language={language}
            selectedCountryName={selectedCountryName}
            hotCountryName={hotCountryCode === 'GLOBAL' ? 'Italy' : getCountryName(hotCountryCode)}
            isLoading={isLoading}
            mixedHotGlobal={mixedHotGlobal}
            hotLocal={hotLocal}
            platformTrends={displayPlatformTrends}
            platformLimits={platformLimits}
            onShowMore={handleShowMore}
            sourceBreakdown={sourceBreakdown}
            watchlist={watchlist}
            lastUpdatedLabel={lastUpdatedLabel}
          />
        )}

        <div className="text-center text-xs text-[#9ca3af] py-6 border-t border-[#e5e7eb]">
          Terms · Privacy · API Docs · About · Contact
        </div>
      </main>
    </div>
  )
}

