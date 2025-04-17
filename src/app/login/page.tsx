// src/app/login/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorLog, setErrorLog] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session?.user) {
          router.push('/projects') // ログイン済みの場合はプロジェクト一覧へ
        }
      } catch (err) {
        console.error('セッションチェックエラー:', err)
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorLog('')
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setErrorLog('メールアドレスまたはパスワードが間違っています。')
        } else {
          setErrorLog('ログインに失敗しました。もう一度お試しください。')
        }
        setLoading(false)
      } else {
        setMessage('ログイン成功！')
        // 0.5秒後にリダイレクト（成功メッセージを見せるため）
        setTimeout(() => {
          router.push('/projects')
        }, 500)
      }
    } catch (err) {
      console.error('ログインエラー:', err)
      setErrorLog('予期せぬエラーが発生しました。')
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* 左側のイメージセクション - トーンダウンした色合いに */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-500 to-indigo-700 justify-center items-center relative">
        <div className="absolute inset-0 opacity-10">
          {/* 抽象的な背景パターン */}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative z-10 px-16 text-white text-center max-w-2xl">
          <h1 className="text-5xl font-bold mb-4">Inovie Base</h1>
          <p className="text-xl mb-8 text-white/90">仮説検証を効率的に管理するツール</p>
          
          <p className="text-white/80 mb-8 text-lg">
            Inovie Baseは、ビジネスや製品の成功のために不可欠な「仮説検証サイクル」を管理・最適化するためのプラットフォームです。
          </p>
          
          <div className="grid grid-cols-2 gap-6 text-left">
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl shadow-lg transition-all duration-300 hover:bg-white/15">
              <h3 className="font-semibold mb-2 text-xl">仮説管理</h3>
              <p className="text-white/80">チームの仮説を一元管理し、優先順位付けを行います。</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl shadow-lg transition-all duration-300 hover:bg-white/15">
              <h3 className="font-semibold mb-2 text-xl">検証記録</h3>
              <p className="text-white/80">検証プロセスと結果を構造化して記録します。</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl shadow-lg transition-all duration-300 hover:bg-white/15">
              <h3 className="font-semibold mb-2 text-xl">履歴管理</h3>
              <p className="text-white/80">仮説の変遷と検証の軌跡を追跡します。</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl shadow-lg transition-all duration-300 hover:bg-white/15">
              <h3 className="font-semibold mb-2 text-xl">データ可視化</h3>
              <p className="text-white/80">学びを分析し、インサイトを引き出します。</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 右側のログインフォーム */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 md:px-16 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 lg:hidden">
            <h1 className="text-4xl font-bold mb-2 text-indigo-600">Inovie Base</h1>
            <p className="text-slate-600">仮説検証管理ツール</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">ログイン</h2>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="パスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {errorLog && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded">
                  <div className="flex">
                    <AlertCircle className="text-rose-500 mr-2" size={20} />
                    <p className="text-sm text-rose-600">{errorLog}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>ログイン中...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>ログイン</span>
                  </>
                )}
              </button>
            </form>
            
            {message && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {message}
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center text-slate-500 text-sm">
            <p>© 2025 Inovie Base. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
