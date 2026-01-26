'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

type SiteHeaderProps = {
  searchQuery?: string
  onSearchChange?: (value: string) => void
  language?: 'EN' | 'IT'
  onLanguageChange?: (value: 'EN' | 'IT') => void
}

export default function SiteHeader({
  searchQuery,
  onSearchChange,
  language,
  onLanguageChange,
}: SiteHeaderProps) {
  const [localSearch, setLocalSearch] = useState('')
  const [localLanguage, setLocalLanguage] = useState<'EN' | 'IT'>('EN')
  const pathname = usePathname()

  const resolvedSearch = searchQuery ?? localSearch
  const resolvedLanguage = language ?? localLanguage

  const handleSearch = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value)
    } else {
      setLocalSearch(value)
    }
  }

  const handleLanguage = (value: 'EN' | 'IT') => {
    if (onLanguageChange) {
      onLanguageChange(value)
    } else {
      setLocalLanguage(value)
    }
  }

  const isActive = (path: string) => pathname === path

  const navClass = (path: string) =>
    `px-2 py-1 transition ${
      isActive(path)
        ? 'text-[#111827] font-semibold drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]'
        : 'text-[#6b7280]'
    } hover:text-[#111827] hover:font-semibold hover:drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]`

  const labels =
    resolvedLanguage === 'IT'
      ? {
          home: 'Home',
          youtube: 'Trend YouTube',
          contact: 'Contatti',
          about: 'Chi siamo',
          searchPlaceholder: 'Cerca trend...',
        }
      : {
          home: 'Home',
          youtube: 'YouTube Trends',
          contact: 'Contact',
          about: 'About',
          searchPlaceholder: 'Search trends...',
        }

  return (
    <header className="relative bg-white/80 backdrop-blur border-b border-[#e5e7eb]">
      <div className="max-w-[80%] mx-auto px-6 py-4 flex items-center gap-6">
        <div className="flex items-center gap-2 font-bold text-xl text-[#111827]">
          <span className="w-9 h-9 rounded-full bg-[#111827] text-white flex items-center justify-center">
            b
          </span>
          buzzify.org
        </div>
        <div className="flex-1 flex items-center gap-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={labels.searchPlaceholder}
              value={resolvedSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full border border-[#e5e7eb] rounded-full px-5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#c7d2fe]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-3 text-sm text-[#6b7280]">
            <a href="/" className={navClass('/')}>
              {labels.home}
            </a>
            <span className="h-4 w-px bg-[#e5e7eb]" />
            <a href="/youtube" className={navClass('/youtube')}>
              {labels.youtube}
            </a>
            <span className="h-4 w-px bg-[#e5e7eb]" />
            <a href="/contact" className={navClass('/contact')}>
              {labels.contact}
            </a>
            <span className="h-4 w-px bg-[#e5e7eb]" />
            <a href="/about" className={navClass('/about')}>
              {labels.about}
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#6b7280]">
          <div className="flex items-center gap-1 rounded-full border border-[#e5e7eb] bg-white p-1">
            <button
              type="button"
              onClick={() => handleLanguage('EN')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                resolvedLanguage === 'EN'
                  ? 'bg-[#111827] text-white'
                  : 'text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguage('IT')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                resolvedLanguage === 'IT'
                  ? 'bg-[#111827] text-white'
                  : 'text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              IT
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
