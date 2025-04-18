'use client'

import { useState } from 'react'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorLog, setErrorLog] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    
    setLoading(true)
    setErrorLog('')
    setMessage('')

    try {
      // ログイン処理
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })

      if (error) {
        console.error('ログインエラー:', error)
        if (error.message === 'Invalid login credentials') {
          setErrorLog('メールアドレスまたはパスワードが間違っています。')
        } else {
          setErrorLog(`ログインに失敗しました: ${error.message}`)
        }
        setLoading(false)
      } else {
        setMessage('ログイン成功！リダイレクトします...')
        
        // 直接プロジェクトページに移動
        window.location.href = '/projects'
      }
    } catch (err: any) {
      console.error('予期せぬエラー:', err)
      setErrorLog(`予期せぬエラーが発生しました: ${err.message || err}`)
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* 左側のイメージセクション */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-100 justify-center items-center relative">
        {/* グリッドオーバーレイ */}
        <div className="absolute inset-0 bg-indigo-500 opacity-10">
          <div className="w-full h-full" style={{ 
            backgroundImage: 'linear-gradient(rgba(79, 70, 229, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(79, 70, 229, 0.1) 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
          }}></div>
        </div>
        
        <div className="relative z-10 px-16 py-12 text-center max-w-2xl bg-white/30 backdrop-blur-sm rounded-xl shadow-xl">
          <h1 className="text-4xl font-bold mb-3 text-indigo-800">Inovie Base</h1>
          <p className="text-lg mb-8 text-indigo-700">仮説検証を効率的に管理するツール</p>
          
          <p className="text-indigo-700/90 mb-8">
            Inovie Baseは、ビジネスや製品の成功のために不可欠な「仮説検証サイクル」を管理・最適化するためのプラットフォームです。
          </p>
          
          <div className="grid grid-cols-2 gap-6 text-left">
            <div className="bg-white/50 p-5 rounded-xl shadow-sm border border-indigo-100 transition-all duration-300 hover:bg-white/80">
              <h3 className="font-semibold mb-2 text-indigo-800">仮説管理</h3>
              <p className="text-indigo-700/80">チームの仮説を一元管理し、優先順位付けを行います。</p>
            </div>
            <div className="bg-white/50 p-5 rounded-xl shadow-sm border border-indigo-100 transition-all duration-300 hover:bg-white/80">
              <h3 className="font-semibold mb-2 text-indigo-800">検証記録</h3>
              <p className="text-indigo-700/80">検証プロセスと結果を構造化して記録します。</p>
            </div>
            <div className="bg-white/50 p-5 rounded-xl shadow-sm border border-indigo-100 transition-all duration-300 hover:bg-white/80">
              <h3 className="font-semibold mb-2 text-indigo-800">履歴管理</h3>
              <p className="text-indigo-700/80">仮説の変遷と検証の軌跡を追跡します。</p>
            </div>
            <div className="bg-white/50 p-5 rounded-xl shadow-sm border border-indigo-100 transition-all duration-300 hover:bg-white/80">
              <h3 className="font-semibold mb-2 text-indigo-800">データ可視化</h3>
              <p className="text-indigo-700/80">学びを分析し、インサイトを引き出します。</p>
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
                  disabled={loading}
                  className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500"
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
                    disabled={loading}
                    className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 disabled:text-slate-300"
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
                className="w-full bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
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