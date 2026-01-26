export const metadata = {
  title: 'About | Top Trends',
  description:
    'Learn about Top Trends, a dashboard for tracking real-time trending topics across platforms and countries.',
}

import SiteHeader from '@/components/SiteHeader'
import { getCmsPage } from '@/lib/cms'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const page = await getCmsPage('about')
  const paragraphs = page.content?.paragraphs ?? []
  return (
    <main className="min-h-screen bg-[#f4f6fb] text-[#1f2937] relative">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#ffffff] via-[#f8fafc] to-transparent pointer-events-none -z-10" />
      <SiteHeader />
      <div className="max-w-[80%] mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold text-[#111827]">{page.title}</h1>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className={index === 0 ? 'mt-4 text-base text-[#1f2937]' : 'mt-3 text-base text-[#1f2937]'}>
            {paragraph}
          </p>
        ))}
      </div>
    </main>
  )
}
