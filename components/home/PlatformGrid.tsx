import type { Trend } from '@/components/home/types'

type PlatformGridProps = {
  platformTrends: Record<string, Trend[]>
  platformLimits: Record<string, number>
  onShowMore: (platformId: string) => void
  isLoading: boolean
  language: 'EN' | 'IT'
  labels: {
    loading: string
    noTrends: string
    showMore: string
  }
}

type PlatformCard = {
  id: string
  label: string
  accent: string
}

const platformCards: PlatformCard[] = [
  { id: 'x', label: 'X Pulse', accent: 'from-[#111827] to-[#1f2937]' },
  { id: 'reddit', label: 'Reddit Buzz', accent: 'from-[#ea580c] to-[#f97316]' },
  { id: 'youtube', label: 'YouTube Heat', accent: 'from-[#dc2626] to-[#ef4444]' },
  { id: 'instagram', label: 'Instagram Flow', accent: 'from-[#ec4899] to-[#f59e0b]' },
]

const platformIcons: Record<string, string> = {
  x: 'X',
  reddit: 'r/',
  youtube: '▶',
  instagram: '◎',
}

export default function PlatformGrid({
  platformTrends,
  platformLimits,
  onShowMore,
  isLoading,
  language,
  labels,
}: PlatformGridProps) {
  return (
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
                <span>{card.label}</span>
              </div>
            </div>
            <div className="p-4 text-sm text-[#1f2937] max-h-80 overflow-y-auto space-y-3 pr-2 light-scrollbar flex-1">
              {isLoading ? (
                <div className="text-[#9ca3af]">{labels.loading}</div>
              ) : items.length === 0 ? (
                <div className="text-[#9ca3af]">{labels.noTrends}</div>
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
                      <div className="font-medium line-clamp-3 group-hover:text-[#111827]">
                        {trend.name}
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
            {!isLoading && totalItems > limit && (
              <div className="border-t border-[#eef2f7] px-4 py-3 bg-white">
                <button
                  type="button"
                  onClick={() => onShowMore(card.id)}
                  className="w-full px-3 py-2 rounded-lg text-xs font-medium border border-[#e5e7eb] text-[#6b7280] hover:text-[#1f2937] hover:border-[#c7d2fe]"
                >
                  {labels.showMore}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
