'use client'

import { MessageSquare, Globe, Flame, Newspaper, Rss, Youtube, Instagram, TrendingUp } from 'lucide-react'

interface TrendItemProps {
  rank: number
  trend: {
    name: string
    url: string
    source: string
    volume?: string
    timestamp: string
  }
  isHovered?: boolean
  onHover?: () => void
  onLeave?: () => void
}

const sourceIcons: Record<string, React.ReactNode> = {
  reddit: <MessageSquare className="w-4 h-4" />,
  google: <Globe className="w-4 h-4" />,
  hackernews: <Flame className="w-4 h-4" />,
  bbc: <Newspaper className="w-4 h-4" />,
  techcrunch: <Rss className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  x: <div className="font-bold text-[10px] border border-current rounded px-0.5 leading-none">X</div>,
  instagram: <Instagram className="w-4 h-4" />,
}

const sourceColors: Record<string, string> = {
  reddit: 'text-[#ff4500]',
  google: 'text-[#34a853]',
  hackernews: 'text-[#ff6600]',
  bbc: 'text-[#bb1919]',
  techcrunch: 'text-[#00a562]',
  youtube: 'text-[#ff0000]',
  x: 'text-white',
  instagram: 'text-[#e4405f]',
}

const sourceLabels: Record<string, string> = {
  reddit: 'Reddit',
  google: 'Google Trends',
  hackernews: 'Hacker News',
  bbc: 'BBC News',
  techcrunch: 'TechCrunch',
  youtube: 'YouTube',
  x: 'X / Twitter',
  instagram: 'Instagram',
}

export default function TrendItem({
  trend,
  rank,
  isHovered,
  onHover,
  onLeave,
}: TrendItemProps) {
  const icon = sourceIcons[trend.source] || <TrendingUp className="w-4 h-4" />
  const iconColor = sourceColors[trend.source] || 'text-[#666]'
  const sourceLabel = sourceLabels[trend.source] || trend.source

  return (
    <a
      href={trend.url}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors group ${
        isHovered
          ? 'bg-[#1a2233] border border-[#2c3f5c]'
          : 'hover:bg-[#1a1a1a]'
      }`}
    >
      <span className="w-5 text-xs text-[#666]">{rank}</span>
      <div className={`flex-shrink-0 ${iconColor}`} title={sourceLabel}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[#ededed] truncate group-hover:text-white transition-colors">
          {trend.name}
        </div>
      </div>
      {trend.volume ? (
        <span className="text-xs text-[#8a8a8a] bg-[#0f0f0f] border border-[#2a2a2a] rounded-full px-2 py-0.5">
          {trend.volume}
        </span>
      ) : null}
    </a>
  )
}

