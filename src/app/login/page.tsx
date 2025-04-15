'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorLog, setErrorLog] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setErrorLog('')

    const { data, error } = await supabase.auth.signInWithOtp({ email })

    setLoading(false)

    if (error) {
      setMessage(`エラーが発生しました`)
      setErrorLog(error.message)
      console.error('❌ Supabase auth error:', error)
    } else {
      setMessage('ログインリンクを送信しました。メールを確認してください。')
      console.log('🔄 Supabase auth response:', data)
    }
  }

  // ✅ ログイン済みか確認 → プロフィールがなければ作成
  useEffect(() => {
    const createProfileIfNeeded = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData?.session?.user
      if (!user) return

      // 既に user_profiles にレコードがあるか確認
      const { data: existingProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // その他のエラーはログに出す
        console.error('プロフィール確認エラー:', error)
        return
      }

      if (!existingProfile) {
        // なければ作成
        const { error: insertError } = await supabase.from('user_profiles').insert([
          {
            id: user.id,
            name: '仮ユーザー',
            organization_id: null,
          },
        ])
        if (insertError) {
          console.error('プロフィール作成失敗:', insertError)
        } else {
          console.log('✅ user_profiles にプロフィール作成完了')
        }
      }
    }

    createProfileIfNeeded()
  }, [])

  return (
    <div className="max-w-md mx-auto p-8 mt-10 bg-white shadow-md rounded-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ログイン</h1>

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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition"
        >
          {loading ? '送信中...' : 'ログインリンクを送信'}
        </button>
      </form>

      {message && <p className="text-sm text-blue-700">{message}</p>}
      {errorLog && (
        <div className="text-sm text-red-600 border-l-4 border-red-500 pl-4">
          エラー詳細: {errorLog}
        </div>
      )}
    </div>
  )
}
