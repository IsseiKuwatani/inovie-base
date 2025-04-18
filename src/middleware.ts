// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公開パスは常にアクセス許可
  if (
    pathname === '/login' ||
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.ico') ||
    pathname.includes('favicon')
  ) {
    return NextResponse.next()
  }

  try {
    // 効率的なミドルウェアクライアントの作成
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    
    // セッションの取得と検証
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // 認証されていない場合はログインページにリダイレクト
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    return res
  } catch (error) {
    console.error('認証ミドルウェアでエラーが発生しました:', error)
    // エラーが発生した場合はログインページへリダイレクト
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    '/((?!login|_next/static|_next/image|api|favicon.ico).*)',
  ],
}
