'use client'

interface SidebarProps {
  selectedSource: string
  onSelectSource: (source: string) => void
}

export default function Sidebar({
  selectedSource,
  onSelectSource,
}: SidebarProps) {
  const platforms = [
    { id: 'all', label: 'All Platforms' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'reddit', label: 'Reddit' },
    { id: 'x', label: 'X / Twitter' },
  ]

  return (
    <div className="h-full bg-[#111111] border-r border-[#1f1f1f] flex flex-col">
      <div className="p-4 border-b border-[#1f1f1f]">
        <h2 className="text-lg font-semibold text-[#ededed]">Platforms</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => onSelectSource(platform.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg mb-1 transition-colors ${
                selectedSource === platform.id
                  ? 'bg-[#1f1f1f] text-[#ededed] font-medium'
                  : 'text-[#999] hover:bg-[#1a1a1a] hover:text-[#ededed]'
              }`}
            >
              {platform.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

