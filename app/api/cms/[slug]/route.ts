import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getCmsPage, updateCmsPage } from '@/lib/cms'

export const dynamic = 'force-dynamic'

const allowedSlugs = new Set(['about', 'contact'])

function isAuthorized() {
  const expected = process.env.CMS_ADMIN_TOKEN ?? ''
  const token = cookies().get('cms_admin')?.value ?? ''
  return !!expected && token === expected
}

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  if (!allowedSlugs.has(params.slug)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const page = await getCmsPage(params.slug)
  return NextResponse.json(page)
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  if (!allowedSlugs.has(params.slug)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json().catch(() => null)) as {
    title?: string
    content?: { paragraphs?: string[]; email?: string }
  } | null

  const title = body?.title?.trim()
  const content = body?.content ?? {}

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  await updateCmsPage(params.slug, title, {
    paragraphs: Array.isArray(content.paragraphs)
      ? content.paragraphs.map((p) => String(p))
      : [],
    email: content.email ? String(content.email) : undefined,
  })

  return NextResponse.json({ ok: true })
}
