export const metadata = {
  title: 'Contact | Top Trends',
  description:
    'Contact the Top Trends team for feedback, support, or partnership inquiries.',
}

import SiteHeader from '@/components/SiteHeader'
import { getCmsPage } from '@/lib/cms'

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const page = await getCmsPage('contact')
  const paragraphs = page.content?.paragraphs ?? []
  const email = page.content?.email ?? 'hello@buzzify.org'
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
        <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
          <p className="text-sm text-[#6b7280]">Email</p>
          <a
            href={`mailto:${email}`}
            className="mt-2 inline-block text-base font-medium text-[#111827] hover:text-[#2563eb]"
          >
            {email}
          </a>
        </div>
      </div>
    </main>
  )
}
