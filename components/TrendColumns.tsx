'use client'

import { useEffect, useMemo, useState } from 'react'
import TrendItem from './TrendItem'

interface TrendColumnsProps {
  countryCode: string
}

type Trend = {
  name: string
  url: string
  source: 'reddit' | 'google' | 'youtube'
  volume?: string
  timestamp: string
}

const timeColumns = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  label: i === 0 ? '1 hour ago' : `${i + 1} hours ago`,
}))

function chunkTrends(trends: Trend[], columns: number): Trend[][] {
  if (trends.length === 0) {
    return Array.from({ length: columns }, () => [])
  }
  const chunkSize = Math.ceil(trends.length / columns)
  const chunks: Trend[][] = []
  for (let i = 0; i < columns; i += 1) {
    const start = i * chunkSize
    const end = start + chunkSize
    chunks.push(trends.slice(start, end))
  }
  return chunks
}

export default function TrendColumns({ countryCode }: TrendColumnsProps) {
  const [trends, setTrends] = useState<Trend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true
    setIsLoading(true)
    setError(null)

    fetch(`/api/trends?countryCode=${encodeURIComponent(countryCode)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch trends')
        }
        return res.json()
      })
      .then((data: { trends: Trend[] }) => {
        if (!isActive) return
        setTrends(data.trends || [])
      })
      .catch((err) => {
        if (!isActive) return
        setError(err instanceof Error ? err.message : 'Unknown error')
        setTrends([])
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [countryCode])

  const columns = useMemo(() => chunkTrends(trends, timeColumns.length), [trends])

  return (
    <div className="flex gap-4 p-4 h-full overflow-x-auto">
      {timeColumns.map((column, index) => {
        const columnTrends = columns[index] || []
        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-[#111111] border border-[#1f1f1f] rounded-lg overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-[#1f1f1f] bg-[#0f0f0f]">
              <h3 className="text-sm font-semibold text-[#ededed]">{column.label}</h3>
              <p className="text-xs text-[#666] mt-1">
                {isLoading ? 'Loading...' : `${columnTrends.length} trends`}
              </p>
              {error && (
                <p className="text-xs text-[#ff8a8a] mt-1">Failed to load data</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {!isLoading && columnTrends.length === 0 && !error && (
                <div className="text-xs text-[#666]">No trends available</div>
              )}
              {columnTrends.map((trend) => (
                <TrendItem key={trend.id} trend={trend} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

