'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TrendColumns from '@/components/TrendColumns'
import TopNav from '@/components/TopNav'

type ClientHomeProps = {
  initialCountryCode?: string
  initialDate?: string | null
  initialSource?: string | null
}

function buildTrendsPath(countryCode: string, date?: string | null, source?: string | null) {
  if (date) {
    const base = `/${encodeURIComponent(countryCode)}/${encodeURIComponent(date)}`
    return source && source !== 'all' ? `${base}?source=${encodeURIComponent(source)}` : base
  }
  const base = `/${encodeURIComponent(countryCode)}`
  return source && source !== 'all' ? `${base}?source=${encodeURIComponent(source)}` : base
}

export default function ClientHome({ initialCountryCode, initialDate, initialSource }: ClientHomeProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCountryCode =
    initialCountryCode || searchParams.get('country') || 'US'
  const selectedDate = initialDate ?? searchParams.get('date')
  const selectedSource = initialSource ?? searchParams.get('source') ?? 'all'

  const handleSelectCountry = (countryCode: string) => {
    router.push(buildTrendsPath(countryCode, selectedDate, selectedSource), { scroll: false })
  }

  const handleSelectSource = (source: string) => {
    router.push(buildTrendsPath(selectedCountryCode, selectedDate, source), { scroll: false })
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-[#ededed] overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className={`hidden lg:block transition-all duration-300 ${
        isSidebarOpen ? 'w-64' : 'w-0'
      }`}>
        <Sidebar 
          selectedSource={selectedSource}
          onSelectSource={handleSelectSource}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Nav - Mobile & Desktop */}
        <TopNav 
          selectedCountryCode={selectedCountryCode}
          onSelectCountryCode={handleSelectCountry}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Trend Columns */}
        <div className="flex-1 overflow-x-auto">
          <TrendColumns
            countryCode={selectedCountryCode}
            date={selectedDate}
            source={selectedSource}
          />
        </div>
      </div>
    </div>
  )
}

