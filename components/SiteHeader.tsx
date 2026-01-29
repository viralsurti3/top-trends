'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()
  useEffect(() => {
    setIsMounted(true)
  }, [])


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
    <header className="relative z-40 bg-white/80 backdrop-blur border-b border-[#e5e7eb]">
      <div className="max-w-full lg:max-w-[80%] mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center justify-between gap-2 font-bold text-xl text-[#111827] w-full md:w-auto">
          <div className="flex items-center gap-3">
            <img
              src="/buzzify-logo.png"
              alt="Buzzify"
              className="h-20 w-auto object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="md:hidden inline-flex items-center justify-center rounded-full border border-[#e5e7eb] p-2 text-[#111827] bg-white"
            aria-label="Open navigation"
            aria-expanded={isMobileNavOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
        <div className="w-full flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <div className="relative w-full md:flex-1">
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
          <nav className="hidden md:flex md:flex-wrap md:items-center md:gap-3 text-sm text-[#6b7280]">
            <a
              href="/"
              className={`${navClass('/')} px-2 py-1`}
            >
              {labels.home}
            </a>
            <a
              href="/youtube"
              className={`${navClass('/youtube')} px-2 py-1`}
            >
              {labels.youtube}
            </a>
            <a
              href="/contact"
              className={`${navClass('/contact')} px-2 py-1`}
            >
              {labels.contact}
            </a>
            <a
              href="/about"
              className={`${navClass('/about')} px-2 py-1`}
            >
              {labels.about}
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#6b7280] w-full md:w-auto md:justify-end">
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
      {isMounted && isMobileNavOpen
        ? createPortal(
            <div className="fixed inset-0 z-[999] md:hidden">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
              <button
                type="button"
                className="absolute inset-0"
                aria-label="Close navigation"
                onClick={() => setIsMobileNavOpen(false)}
              />
              <div className="absolute right-0 top-0 z-[1000] h-full w-[82vw] max-w-[340px] bg-white shadow-2xl border-l border-[#e5e7eb] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
                  <div className="flex items-center gap-2 text-base font-semibold text-[#111827]">
                    <img
                      src="/buzzify-logo.png"
                      alt="Buzzify"
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    Menu
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-[#e5e7eb] p-2 text-[#111827] bg-white"
                    onClick={() => setIsMobileNavOpen(false)}
                    aria-label="Close navigation"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <nav className="flex-1 px-5 py-4 space-y-2 text-sm text-[#6b7280]">
                  <a
                    href="/"
                    className={`${navClass('/')} flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-left`}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <span>{labels.home}</span>
                    <span className="text-xs text-[#9ca3af]">Home</span>
                  </a>
                  <a
                    href="/youtube"
                    className={`${navClass('/youtube')} flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-left`}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <span>{labels.youtube}</span>
                    <span className="text-xs text-[#9ca3af]">Video</span>
                  </a>
                  <a
                    href="/contact"
                    className={`${navClass('/contact')} flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-left`}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <span>{labels.contact}</span>
                    <span className="text-xs text-[#9ca3af]">Email</span>
                  </a>
                  <a
                    href="/about"
                    className={`${navClass('/about')} flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-left`}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <span>{labels.about}</span>
                    <span className="text-xs text-[#9ca3af]">Info</span>
                  </a>
                </nav>
              </div>
            </div>,
            document.body
          )
        : null}
    </header>
  )
}
