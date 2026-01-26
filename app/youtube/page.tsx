export const metadata = {
  title: 'YouTube Trends | Top Trends',
  description:
    'Explore trending YouTube topics and videos by country and time range.',
}

import SiteHeader from '@/components/SiteHeader'

export default function YouTubePage() {
  return (
    <main className="min-h-screen bg-[#f4f6fb] text-[#1f2937] relative">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#eef2ff] via-[#f8fafc] to-transparent pointer-events-none -z-10" />
      <SiteHeader />
      <div className="relative max-w-[80%] mx-auto px-6 py-16">
        <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-semibold text-[#111827]">YouTube Trends</h1>
          <p className="mt-4 text-base text-[#374151]">
            This page is a placeholder for YouTube-focused trends. Use the main
            dashboard filters to explore YouTube trends by country and time range.
          </p>
        </div>
      </div>
    </main>
  )
}
