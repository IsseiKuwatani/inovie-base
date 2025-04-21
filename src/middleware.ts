// src/middleware.ts を一時的に修正
import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// 一時的にすべてのリクエストを許可する単純なミドルウェア
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpe?g|gif|webp)$).*)',
  ],
}
