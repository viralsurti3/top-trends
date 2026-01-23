'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { countries, getCountryName } from '@/lib/countries'

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

type Trend = {
  name: string
  url: string
  source: string
  volume?: string
  timestamp: string
}

type TrendsResponse = {
  trends: Trend[]
  failedSources: string[]
}

type PlatformCard = {
  id: string
  label: string
  accent: string
}

const platformCards: PlatformCard[] = [
  { id: 'x', label: 'Trending on X', accent: 'from-[#111827] to-[#1f2937]' },
  { id: 'reddit', label: 'Trending on Reddit', accent: 'from-[#ea580c] to-[#f97316]' },
  { id: 'youtube', label: 'Trending on YouTube', accent: 'from-[#dc2626] to-[#ef4444]' },
  { id: 'instagram', label: 'Trending on Instagram', accent: 'from-[#ec4899] to-[#f59e0b]' },
]

const platformIcons: Record<string, string> = {
  x: 'X',
  reddit: 'r/',
  youtube: '▶',
  instagram: '◎',
}

function getRangeMinutes(range: '24h' | '48h' | '7d') {
  if (range === '48h') return 48 * 60
  if (range === '7d') return 7 * 24 * 60
  return 24 * 60
}

function formatDisplayVolume(value?: string) {
  if (!value) return null
  const numeric = Number(value.replace(/[^\d.]/g, ''))
  if (Number.isNaN(numeric)) return value
  const hasSuffix = /[KMB]$/i.test(value.trim())
  const formatted = numeric % 1 === 0 ? numeric.toString() : numeric.toFixed(1)
  return hasSuffix ? `${formatted}K` : formatted
}

const languageCopy = {
  EN: {
    searchPlaceholder: 'Search trends...',
    selectCountry: 'Select Country',
    date: 'Date',
    timeRange: 'Time Range:',
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

  const handleSelectCountry = (countryCode: string) => {
    router.push(buildTrendsPath(countryCode, selectedDate), { scroll: false })
  }

  const handleDateChange = (value: string) => {
    const date = value || null
    router.push(buildTrendsPath(selectedCountryCode, date), { scroll: false })
  }

  const handleRefresh = async () => {
    if (selectedDate) return
    setIsRefreshing(true)
    setError(null)
    try {
      const countries =
        selectedCountryCode === 'GLOBAL'
          ? 'GLOBAL'
          : `${selectedCountryCode},GLOBAL`
      const params = new URLSearchParams({ countries })
      const res = await fetch(`/api/trends/fetch?${params.toString()}`, {
        method: 'POST',
      })
      if (!res.ok) {
        throw new Error('Failed to refresh trends')
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

  const platformTrends = useMemo(() => {
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

  const handleShowMore = (platformId: string) => {
    const totalItems = (platformTrends[platformId] || []).length
    setPlatformLimits((prev) => ({
      ...prev,
      [platformId]: Math.min((prev[platformId] || 5) + 5, totalItems),
    }))
  }

  const copy = languageCopy[language]

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-[#1f2937]">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#eef2ff] via-[#f8fafc] to-transparent pointer-events-none" />
      <header className="relative bg-white/80 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-[80%] mx-auto px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-[#111827]">
            <span className="w-9 h-9 rounded-full bg-[#111827] text-white flex items-center justify-center">b</span>
            buzzify.org
          </div>
          <div className="flex-1 flex items-center gap-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={copy.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-[#e5e7eb] rounded-full px-5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#c7d2fe]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-4 text-sm text-[#6b7280]">
              <a
                href="#"
                className="px-2 py-1 rounded-full hover:text-[#111827] hover:bg-[#f3f4f6] transition"
              >
                YouTube Trends
              </a>
              <span className="h-4 w-px bg-[#e5e7eb]" />
              <a
                href="#"
                className="px-2 py-1 rounded-full hover:text-[#111827] hover:bg-[#f3f4f6] transition"
              >
                Contact
              </a>
              <a
                href="#"
                className="px-2 py-1 rounded-full hover:text-[#111827] hover:bg-[#f3f4f6] transition"
              >
                About
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#6b7280]">
            <div className="flex items-center gap-1 rounded-full border border-[#e5e7eb] bg-white p-1">
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  language === 'EN'
                    ? 'bg-[#111827] text-white'
                    : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('IT')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  language === 'IT'
                    ? 'bg-[#111827] text-white'
                    : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                IT
              </button>
            </div>
            <span className="w-9 h-9 rounded-full bg-[#111827] text-white flex items-center justify-center">👤</span>
          </div>
        </div>
      </header>

      <main className="relative max-w-[80%] mx-auto px-6 py-6 space-y-6 overflow-x-hidden">
        <div className="flex flex-wrap items-center gap-4 bg-white/90 border border-[#e5e7eb] rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-[#6b7280]">{copy.timeRange}</span>
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
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || Boolean(selectedDate)}
              className="px-3 py-1.5 rounded-lg text-sm border transition border-[#e5e7eb] text-[#6b7280] hover:border-[#c7d2fe] hover:text-[#374151] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh now'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] rounded-lg px-4 py-2 text-sm">
            {copy.failedToLoad}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-semibold mb-3">
              {copy.hotTopicsGlobal} <span className="text-[#f97316]">🔥</span>
            </div>
            <div className="space-y-3 text-sm text-[#1f2937]">
              {isLoading ? (
                <div className="text-[#9ca3af]">{copy.loading}</div>
              ) : mixedHotGlobal.length === 0 ? (
                <div className="text-[#9ca3af]">{copy.noTrends}</div>
              ) : (
                mixedHotGlobal.map((trend) => (
                  <a
                    key={`${trend.source}-${trend.timestamp}-${trend.url}`}
                    href={trend.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[#f8fafc] transition"
                  >
                    <span className="font-medium">{trend.name}</span>
                    {false && trend.volume && (
                      <span className="text-[11px] font-semibold text-[#1f2937] bg-[#eef2ff] border border-[#c7d2fe] rounded-full px-2 py-0.5">
                        {formatDisplayVolume(trend.volume)}
                      </span>
                    )}
                  </a>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-semibold mb-3">
              {copy.hotTopicsIn} {hotCountryCode === 'GLOBAL' ? 'Italy' : getCountryName(hotCountryCode)}
              <span className="text-[#22c55e]">🏁</span>
            </div>
            <div className="space-y-3 text-sm text-[#1f2937]">
              {isLoading ? (
                <div className="text-[#9ca3af]">{copy.loading}</div>
              ) : hotLocal.length === 0 ? (
                <div className="text-[#9ca3af]">{copy.noTrends}</div>
              ) : (
                hotLocal.map((trend) => (
                  <a
                    key={`${trend.source}-${trend.timestamp}-${trend.url}`}
                    href={trend.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[#f8fafc] transition"
                  >
                    <span className="font-medium">{trend.name}</span>
                    {false && trend.volume && (
                      <span className="text-[11px] font-semibold text-[#1f2937] bg-[#eef2ff] border border-[#c7d2fe] rounded-full px-2 py-0.5">
                        {formatDisplayVolume(trend.volume)}
                      </span>
                    )}
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {platformCards.map((card) => {
            const limit = platformLimits[card.id] || 5
            const totalItems = (platformTrends[card.id] || []).length
            const items = (platformTrends[card.id] || []).slice(0, limit)
            return (
              <div key={card.id} className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className={`px-4 py-3 text-white font-semibold bg-gradient-to-r ${card.accent}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                      {platformIcons[card.id] || '•'}
                    </span>
                    <span>
                      {language === 'IT'
                        ? card.label.replace('Trending on', 'Trend su')
                        : card.label}
                    </span>
                  </div>
                </div>
                <div className="p-4 text-sm text-[#1f2937] max-h-80 overflow-y-auto space-y-3 pr-2 light-scrollbar flex-1">
                  {isLoading ? (
                    <div className="text-[#9ca3af]">{copy.loading}</div>
                  ) : items.length === 0 ? (
                    <div className="text-[#9ca3af]">{copy.noTrends}</div>
                  ) : (
                    items.map((trend) => (
                      <a
                        key={`${trend.source}-${trend.timestamp}-${trend.url}`}
                        href={trend.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-[#f8fafc] transition group"
                      >
                        <div className="min-w-0">
                          <div className="font-medium line-clamp-3 group-hover:text-[#111827]">{trend.name}</div>
                        </div>
                        {false && trend.volume && (
                          <span className="text-[11px] font-semibold text-[#1f2937] bg-[#eef2ff] border border-[#c7d2fe] rounded-full px-2 py-0.5">
                            {formatDisplayVolume(trend.volume)}
                          </span>
                        )}
                      </a>
                    ))
                  )}
                </div>
                {!isLoading && totalItems > limit && (
                  <div className="border-t border-[#eef2f7] px-4 py-3 bg-white">
                    <button
                      type="button"
                      onClick={() => handleShowMore(card.id)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-medium border border-[#e5e7eb] text-[#6b7280] hover:text-[#1f2937] hover:border-[#c7d2fe]"
                    >
                      Show more
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-center text-xs text-[#9ca3af] py-6 border-t border-[#e5e7eb]">
          Terms · Privacy · API Docs · About · Contact
        </div>
      </main>
    </div>
  )
}

