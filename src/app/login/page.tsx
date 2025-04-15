'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorLog, setErrorLog] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        setIsLoggedIn(true)
        router.push('/me') // ✅ リダイレクト先をわかりやすい「/me」へ変更
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorLog('')
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message === 'Invalid login credentials') {
        setErrorLog('メールアドレスまたはパスワードが間違っています。')
      } else {
        setErrorLog('ログインに失敗しました。もう一度お試しください。')
      }
    } else {
      setMessage('ログイン成功！')
      router.push('/me')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto p-8 mt-10 bg-white shadow-md rounded-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ログイン</h1>

      {!isLoggedIn && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">パスワード</label>
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md p-2 mt-1"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>

          {message && <p className="text-sm text-blue-700">{message}</p>}
          {errorLog && (
            <div className="text-sm text-red-600 border-l-4 border-red-500 pl-4">
              {errorLog}
            </div>
          )}
        </form>
      )}
    </div>
  )
}
