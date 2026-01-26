import { ensureSchema, query } from '@/lib/db'

export type CmsContent = {
  paragraphs?: string[]
  email?: string
}

export type CmsPage = {
  slug: string
  title: string
  content: CmsContent
  updated_at?: string
}

const defaultPages: Record<string, CmsPage> = {
  about: {
    slug: 'about',
    title: 'About Top Trends',
    content: {
      paragraphs: [
        'Top Trends is a clean, fast dashboard that aggregates trending topics across platforms and countries. It helps you spot what is rising now and compare trends by region, time range, and platform.',
        'The data is refreshed regularly and presented in simple cards to make it easy to scan and act on.',
      ],
    },
  },
  contact: {
    slug: 'contact',
    title: 'Contact Us',
    content: {
      paragraphs: [
        'Have feedback, a feature request, or a partnership idea? We would love to hear from you.',
      ],
      email: 'hello@buzzify.org',
    },
  },
}

export async function getCmsPage(slug: string): Promise<CmsPage> {
  await ensureSchema()
  const rows = await query<CmsPage[]>(
    'SELECT slug, title, content, updated_at FROM cms_pages WHERE slug = $1',
    [slug]
  )
  if (rows.length > 0) {
    return rows[0]
  }
  return defaultPages[slug] ?? {
    slug,
    title: slug,
    content: { paragraphs: [] },
  }
}

export async function updateCmsPage(
  slug: string,
  title: string,
  content: CmsContent
): Promise<void> {
  await ensureSchema()
  await query(
    `
    INSERT INTO cms_pages (slug, title, content)
    VALUES ($1, $2, $3)
    ON CONFLICT (slug)
    DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, updated_at = NOW()
  `,
    [slug, title, content]
  )
}
