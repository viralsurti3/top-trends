import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const expected = process.env.CMS_ADMIN_TOKEN ?? ''
  const cookieStore = cookies()
  const token = cookieStore.get('cms_admin')?.value ?? ''

  if (!expected || token !== expected) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true })
}
