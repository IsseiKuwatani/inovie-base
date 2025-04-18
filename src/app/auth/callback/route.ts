// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/ssr'

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(req.cookies) })
  const { error } = await supabase.auth.exchangeCodeForSession() // 引数不要になった

  if (error) return NextResponse.redirect(new URL('/login?error=callback', req.url))
  return NextResponse.redirect(new URL('/', req.url))
}
