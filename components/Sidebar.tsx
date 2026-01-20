'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { countries } from '@/lib/countries'

interface SidebarProps {
  selectedCountryCode: string
  onSelectCountryCode: (countryCode: string) => void
}

export default function Sidebar({
  selectedCountryCode,
  onSelectCountryCode,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full bg-[#111111] border-r border-[#1f1f1f] flex flex-col">
      <div className="p-4 border-b border-[#1f1f1f]">
        <h2 className="text-lg font-semibold mb-3 text-[#ededed]">Countries</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666] w-4 h-4" />
          <input
            type="text"
            placeholder="Search countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#ededed] placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#3a3a3a] focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666] hover:text-[#ededed]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {filteredCountries.map((country) => (
            <button
              key={country.code}
              onClick={() => onSelectCountryCode(country.code)}
              className={`w-full text-left px-4 py-2.5 rounded-lg mb-1 transition-colors ${
                selectedCountryCode === country.code
                  ? 'bg-[#1f1f1f] text-[#ededed] font-medium'
                  : 'text-[#999] hover:bg-[#1a1a1a] hover:text-[#ededed]'
              }`}
            >
              {country.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

