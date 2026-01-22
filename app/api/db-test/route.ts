import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query<Array<{ ok: number }>>('SELECT 1 AS ok')
    return NextResponse.json({ ok: rows[0]?.ok === 1 })
  } catch (error) {
    console.error('DB test failed:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}


