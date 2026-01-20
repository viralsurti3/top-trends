'use client'

import { Menu, Search, X } from 'lucide-react'
import { useState } from 'react'
import { countries, getCountryName } from '@/lib/countries'

interface TopNavProps {
  selectedCountryCode: string
  onSelectCountryCode: (countryCode: string) => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function TopNav({ 
  selectedCountryCode, 
  onSelectCountryCode, 
  isSidebarOpen,
  onToggleSidebar 
}: TopNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const selectedCountryName = getCountryName(selectedCountryCode)

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-[#111111] border-b border-[#1f1f1f]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-[#ededed]" />
          </button>
          <h1 className="text-xl font-bold text-[#ededed]">Top Trends</h1>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-[#ededed]" />
            ) : (
              <span className="text-[#ededed] text-sm font-medium">
                {selectedCountryName}
              </span>
            )}
          </button>

          {/* Mobile Dropdown */}
          {isMobileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#111111] border border-[#1f1f1f] rounded-lg shadow-xl z-50 max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-3 border-b border-[#1f1f1f]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666] w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#ededed] placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#3a3a3a] focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-[60vh] p-2">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      onSelectCountryCode(country.code)
                      setIsMobileMenuOpen(false)
                      setSearchQuery('')
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-lg mb-1 transition-colors text-sm ${
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
          )}
        </div>

        {/* Desktop Country Selector */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-[#666] text-sm">Country:</span>
          <select
            value={selectedCountryCode}
            onChange={(e) => onSelectCountryCode(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-[#ededed] text-sm focus:outline-none focus:ring-2 focus:ring-[#3a3a3a] focus:border-transparent cursor-pointer"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

