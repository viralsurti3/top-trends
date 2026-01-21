'use client'

import { useEffect, useMemo, useState } from 'react'
import TrendItem from './TrendItem'

interface TrendColumnsProps {
  countryCode: string
  date?: string | null
  source?: string | null
}

type Trend = {
  name: string
  url: string
  source: string
  volume?: string
  timestamp: string
}

const timeColumns = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  label: i === 0 ? '1 hour ago' : `${i + 1} hours ago`,
}))

function groupTrendsByHour(trends: Trend[], columns: number): Trend[][] {
  const buckets: Trend[][] = Array.from({ length: columns }, () => [])
  if (trends.length === 0) return buckets

  const now = Date.now()
  for (const trend of trends) {
    const ts = Date.parse(trend.timestamp)
    if (Number.isNaN(ts)) continue
    const diffMinutes = Math.max(0, Math.floor((now - ts) / 60000))
    const bucketIndex = Math.floor(diffMinutes / 60)
    if (bucketIndex >= 0 && bucketIndex < columns) {
      buckets[bucketIndex].push(trend)
    }
  }

  return buckets.map((bucket) =>
    bucket.sort(
      (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)
    )
  )
}

function getTrendKey(trend: Trend): string {
  return `${trend.source}:${trend.name.trim().toLowerCase()}`
}

export default function TrendColumns({ countryCode, date, source }: TrendColumnsProps) {
  const [trends, setTrends] = useState<Trend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [failedSources, setFailedSources] = useState<string[]>([])
  const [expandedColumns, setExpandedColumns] = useState<Record<number, boolean>>({})
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true
    let intervalId: NodeJS.Timeout | null = null
    setIsLoading(true)
    setError(null)
    setFailedSources([])

    const refreshSeconds = Number(
      process.env.NEXT_PUBLIC_REALTIME_REFRESH_SECONDS || 60
    )

    const load = () => {
      const params = new URLSearchParams()
      params.set('countryCode', countryCode)
      if (date) {
        params.set('date', date)
      } else {
        params.set('refresh', '1')
      }
      if (source && source !== 'all') {
        params.set('source', source)
      }
      return fetch(`/api/trends?${params.toString()}`)
        .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to load trends')
        }
        return res.json() as Promise<{
          trends: Trend[]
          failedSources: string[]
        }>
      })
      .then((data) => {
        if (!isActive) return
        setTrends(data.trends || [])
        setFailedSources(data.failedSources || [])
        setError(null)
      })
      .catch((err) => {
        if (!isActive) return
        console.warn('Trend fetch failed:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setTrends([])
        setFailedSources([])
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })
    }

    load()

    if (!date && !Number.isNaN(refreshSeconds) && refreshSeconds > 10) {
      intervalId = setInterval(load, refreshSeconds * 1000)
    }

    return () => {
      isActive = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [countryCode, date, source])

  const columns = useMemo(
    () => groupTrendsByHour(trends, timeColumns.length),
    [trends]
  )
  return (
    <div className="flex gap-4 p-4 h-full overflow-x-auto">
      {timeColumns.map((column, index) => {
        const columnTrends = columns[index] || []
        const isExpanded = expandedColumns[column.id] || false
        const maxVisible = Math.min(columnTrends.length, isExpanded ? 50 : 15)
        const visibleTrends = columnTrends.slice(0, maxVisible)
        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-72 bg-[#111111] border border-[#1f1f1f] rounded-lg overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-[#1f1f1f] bg-[#0f0f0f]">
              <h3 className="text-sm font-semibold text-[#ededed]">{column.label}</h3>
              <p className="text-xs text-[#666] mt-1">
                {isLoading ? 'Loading...' : `${columnTrends.length} trends`}
              </p>
              {failedSources.length > 0 && (
                <p className="text-xs text-[#a66] mt-1">
                  Sources unavailable: {failedSources.join(', ')}
                </p>
              )}
              {error && (
                <p className="text-xs text-[#ff8a8a] mt-1">Failed to load data</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {!isLoading && columnTrends.length === 0 && !error && (
                <div className="text-xs text-[#666]">No trends available</div>
              )}
              <ol className="space-y-1">
                {visibleTrends.map((trend, trendIndex) => (
                  <li key={`${trend.source}-${trend.timestamp}-${trend.url}`}>
                    <TrendItem
                      rank={trendIndex + 1}
                      trend={trend}
                      isHovered={hoveredKey === getTrendKey(trend)}
                      onHover={() => setHoveredKey(getTrendKey(trend))}
                      onLeave={() => setHoveredKey(null)}
                    />
                  </li>
                ))}
              </ol>
              {!isLoading && columnTrends.length > 15 && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedColumns((prev) => ({
                      ...prev,
                      [column.id]: !isExpanded,
                    }))
                  }
                  className="mt-3 w-full text-xs text-[#999] hover:text-[#ededed] border border-[#2a2a2a] rounded-md py-2 transition-colors"
                >
                  {isExpanded
                    ? 'Show less'
                    : `Show more (${Math.min(columnTrends.length, 50) - 15} more)`}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

