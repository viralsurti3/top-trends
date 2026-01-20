'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TrendColumns from '@/components/TrendColumns'
import TopNav from '@/components/TopNav'

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCountryCode = searchParams.get('country') || 'US'

  const handleSelectCountry = (countryCode: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('country', countryCode)
    router.push(`/?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-[#ededed] overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className={`hidden lg:block transition-all duration-300 ${
        isSidebarOpen ? 'w-64' : 'w-0'
      }`}>
        <Sidebar 
          selectedCountryCode={selectedCountryCode}
          onSelectCountryCode={handleSelectCountry}
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
          <TrendColumns countryCode={selectedCountryCode} />
        </div>
      </div>
    </div>
  )
}

