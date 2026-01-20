'use client'

import { MessageSquare, Globe, Youtube, TrendingUp } from 'lucide-react'

interface TrendItemProps {
  trend: {
    name: string
    url: string
    source: 'reddit' | 'google' | 'youtube'
    volume?: string
    timestamp: string
  }
}

const sourceIcons: Record<string, React.ReactNode> = {
  reddit: <MessageSquare className="w-4 h-4" />,
  google: <Globe className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
}

const sourceColors: Record<string, string> = {
  reddit: 'text-[#ff4500]',
  google: 'text-[#34a853]',
  youtube: 'text-[#ff0000]',
}

const sourceLabels: Record<string, string> = {
  reddit: 'Reddit',
  google: 'Google Trends',
  youtube: 'YouTube',
}

export default function TrendItem({ trend }: TrendItemProps) {
  const icon = sourceIcons[trend.source] || <TrendingUp className="w-4 h-4" />
  const iconColor = sourceColors[trend.source] || 'text-[#666]'
  const sourceLabel = sourceLabels[trend.source] || trend.source

  return (
    <a
      href={trend.url}
      target="_blank"
      rel="noreferrer"
      className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 hover:bg-[#1f1f1f] hover:border-[#3a3a3a] transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex-shrink-0 ${iconColor}`}>
              {icon}
            </div>
            <span className="text-xs text-[#666] font-medium">{sourceLabel}</span>
          </div>
          <h4 className="text-sm font-semibold text-[#ededed] mb-1 group-hover:text-white transition-colors">
            {trend.name}
          </h4>
          {trend.volume ? (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#0f0f0f] border border-[#2a2a2a] px-2 py-0.5">
              <TrendingUp className="w-3 h-3 text-[#666]" />
              <span className="text-xs text-[#8a8a8a]">{trend.volume}</span>
            </div>
          ) : null}
        </div>
      </div>
    </a>
  )
}

