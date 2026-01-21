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
    initialCountryCode || searchParams.get('country') || 'US'
  const selectedDate = initialDate ?? searchParams.get('date')
  const selectedCountryName = getCountryName(selectedCountryCode)
  const [searchQuery, setSearchQuery] = useState('')
  const [language, setLanguage] = useState<'EN' | 'IT'>('EN')
  const [timeRange, setTimeRange] = useState<'24h' | '48h' | '7d'>('24h')
  const [trends, setTrends] = useState<Trend[]>([])
  const [globalTrends, setGlobalTrends] = useState<Trend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [failedSources, setFailedSources] = useState<string[]>([])

  const handleSelectCountry = (countryCode: string) => {
    router.push(buildTrendsPath(countryCode, selectedDate), { scroll: false })
  }

  const handleDateChange = (value: string) => {
    const date = value || null
    router.push(buildTrendsPath(selectedCountryCode, date), { scroll: false })
  }

  useEffect(() => {
    let isActive = true
    setIsLoading(true)
    setError(null)
    setFailedSources([])

    const params = new URLSearchParams()
    params.set('countryCode', selectedCountryCode)
    if (selectedDate) {
      params.set('date', selectedDate)
    } else {
      params.set('refresh', '1')
    }

    const globalParams = new URLSearchParams()
    globalParams.set('countryCode', 'GLOBAL')
    if (selectedDate) {
      globalParams.set('date', selectedDate)
    } else {
      globalParams.set('refresh', '1')
    }

    Promise.all([
      fetch(`/api/trends?${params.toString()}`),
      fetch(`/api/trends?${globalParams.toString()}`),
    ])
      .then(async ([countryRes, globalRes]) => {
        if (!countryRes.ok || !globalRes.ok) {
          throw new Error('Failed to load trends')
        }
        const countryData = (await countryRes.json()) as TrendsResponse
        const globalData = (await globalRes.json()) as TrendsResponse
        if (!isActive) return
        setTrends(countryData.trends || [])
        setGlobalTrends(globalData.trends || [])
        setFailedSources(countryData.failedSources || [])
      })
      .catch((err) => {
        if (!isActive) return
        setError(err instanceof Error ? err.message : 'Unknown error')
        setTrends([])
        setGlobalTrends([])
        setFailedSources([])
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [selectedCountryCode, selectedDate])

  const rangeMinutes = useMemo(() => {
    if (timeRange === '48h') return 48 * 60
    if (timeRange === '7d') return 7 * 24 * 60
    return 24 * 60
  }, [timeRange])

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
  const hotLocal = filteredTrends.slice(0, 3)

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

  const copy = languageCopy[language]

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-[#1f2937]">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#eef2ff] via-[#f8fafc] to-transparent pointer-events-none" />
      <header className="relative bg-white/80 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-[#111827]">
            <span className="w-9 h-9 rounded-full bg-[#111827] text-white flex items-center justify-center">b</span>
            buzzify.org
          </div>
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder={copy.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-[#e5e7eb] rounded-full px-5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#c7d2fe]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                🔍
              </span>
            </div>
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

      <main className="relative max-w-6xl mx-auto px-6 py-6 space-y-6">
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
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white border border-[#e5e7eb] rounded-2xl px-5 py-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-[#9ca3af]">Total trends</div>
            <div className="text-2xl font-semibold mt-1">{filteredTrends.length}</div>
            <div className="text-xs text-[#9ca3af] mt-2">Filtered by search & range</div>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-2xl px-5 py-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-[#9ca3af]">Active platforms</div>
            <div className="text-2xl font-semibold mt-1">
              {Object.keys(platformTrends).length}
            </div>
            <div className="text-xs text-[#9ca3af] mt-2">X, Reddit, YouTube, Instagram</div>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-2xl px-5 py-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-[#9ca3af]">Country</div>
            <div className="text-2xl font-semibold mt-1">{selectedCountryName}</div>
            <div className="text-xs text-[#9ca3af] mt-2">{timeRange.toUpperCase()} window</div>
          </div>
        </div>

        {error && (
          <div className="bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] rounded-lg px-4 py-2 text-sm">
            {copy.failedToLoad}
          </div>
        )}
        {failedSources.length > 0 && (
          <div className="bg-[#fff7ed] border border-[#fed7aa] text-[#9a3412] rounded-lg px-4 py-2 text-sm">
            {copy.sourcesUnavailable} {failedSources.join(', ')}
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
              ) : hotGlobal.length === 0 ? (
                <div className="text-[#9ca3af]">{copy.noTrends}</div>
              ) : (
                hotGlobal.map((trend) => (
                  <div
                    key={`${trend.source}-${trend.timestamp}-${trend.url}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[#f8fafc] transition"
                  >
                    <span className="font-medium">{trend.name}</span>
                    {trend.volume && <span className="text-[#9ca3af]">{trend.volume}</span>}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-semibold mb-3">
              {copy.hotTopicsIn} {selectedCountryName}
              <span className="text-[#22c55e]">🏁</span>
            </div>
            <div className="space-y-3 text-sm text-[#1f2937]">
              {isLoading ? (
                <div className="text-[#9ca3af]">{copy.loading}</div>
              ) : hotLocal.length === 0 ? (
                <div className="text-[#9ca3af]">{copy.noTrends}</div>
              ) : (
                hotLocal.map((trend) => (
                  <div
                    key={`${trend.source}-${trend.timestamp}-${trend.url}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[#f8fafc] transition"
                  >
                    <span className="font-medium">{trend.name}</span>
                    {trend.volume && <span className="text-[#9ca3af]">{trend.volume}</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {platformCards.map((card) => {
            const items = (platformTrends[card.id] || []).slice(0, 3)
            return (
              <div key={card.id} className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm">
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
                <div className="p-4 space-y-3 text-sm text-[#1f2937]">
                  {isLoading ? (
                    <div className="text-[#9ca3af]">{copy.loading}</div>
                  ) : items.length === 0 ? (
                    <div className="text-[#9ca3af]">{copy.noTrends}</div>
                  ) : (
                    items.map((trend) => (
                      <div
                        key={`${trend.source}-${trend.timestamp}-${trend.url}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[#f8fafc] transition"
                      >
                        <span className="font-medium">{trend.name}</span>
                        {trend.volume && <span className="text-[#9ca3af]">{trend.volume}</span>}
                      </div>
                    ))
                  )}
                </div>
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

