'use client'

import { useEffect, useState } from 'react'
import SiteHeader from '@/components/SiteHeader'

type CmsContent = {
  paragraphs?: string[]
  email?: string
}

type CmsPage = {
  slug: string
  title: string
  content: CmsContent
}

const slugs = ['about', 'contact'] as const

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeSlug, setActiveSlug] = useState<(typeof slugs)[number]>('about')
  const [title, setTitle] = useState('')
  const [paragraphs, setParagraphs] = useState<string[]>(['', ''])
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const loadPage = async (slug: string) => {
    setStatus(null)
    const res = await fetch(`/api/cms/${slug}`, { cache: 'no-store' })
    const data = (await res.json()) as CmsPage
    setTitle(data.title ?? '')
    const incoming = data.content?.paragraphs ?? []
    setParagraphs([incoming[0] ?? '', incoming[1] ?? ''])
    setEmail(data.content?.email ?? '')
  }

  const checkSession = async () => {
    const res = await fetch('/api/admin/session')
    setAuthenticated(res.ok)
    if (res.ok) {
      await loadPage(activeSlug)
    }
  }

  useEffect(() => {
    checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (authenticated) {
      loadPage(activeSlug)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug, authenticated])

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus(null)
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      setStatus('Invalid password')
      setAuthenticated(false)
      return
    }
    setPassword('')
    setAuthenticated(true)
    await loadPage(activeSlug)
  }

  const handleSave = async () => {
    setStatus(null)
    const content: CmsContent = {
      paragraphs: paragraphs.filter((p) => p.trim().length > 0),
    }
    if (activeSlug === 'contact') {
      content.email = email.trim()
    }
    const res = await fetch(`/api/cms/${activeSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
    if (!res.ok) {
      setStatus('Failed to save. Please login again.')
      return
    }
    setStatus('Saved successfully.')
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] text-[#1f2937] relative">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#ffffff] via-[#f8fafc] to-transparent pointer-events-none -z-10" />
      <SiteHeader />
      <div className="max-w-[80%] mx-auto px-6 py-16">
        <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-[#111827]">CMS Admin</h1>
          {!authenticated ? (
            <form onSubmit={handleLogin} className="mt-6 space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-[#111827]">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#111827] text-white text-sm"
              >
                Login
              </button>
              {status && <p className="text-sm text-[#ef4444]">{status}</p>}
            </form>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                {slugs.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setActiveSlug(slug)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      activeSlug === slug
                        ? 'border-[#6366f1] text-[#111827]'
                        : 'border-[#e5e7eb] text-[#6b7280]'
                    }`}
                  >
                    {slug === 'about' ? 'About' : 'Contact'}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827]">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 w-full border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827]">
                  Paragraph 1
                </label>
                <textarea
                  value={paragraphs[0] ?? ''}
                  onChange={(e) =>
                    setParagraphs([e.target.value, paragraphs[1] ?? ''])
                  }
                  rows={3}
                  className="mt-2 w-full border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827]">
                  Paragraph 2
                </label>
                <textarea
                  value={paragraphs[1] ?? ''}
                  onChange={(e) =>
                    setParagraphs([paragraphs[0] ?? '', e.target.value])
                  }
                  rows={3}
                  className="mt-2 w-full border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                />
              </div>
              {activeSlug === 'contact' && (
                <div>
                  <label className="block text-sm font-medium text-[#111827]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-[#111827] text-white text-sm"
                >
                  Save Changes
                </button>
                {status && (
                  <span className="text-sm text-[#10b981]">{status}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
