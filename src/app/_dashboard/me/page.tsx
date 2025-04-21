'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function MyPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session?.user) {
        router.push('/login')
      } else {
        setUser(data.session.user)
      }
    }

    fetchUser()
  }, [router])

  return (
    <div className="max-w-xl mx-auto p-8 mt-10 bg-white shadow-md rounded-xl">
      <h1 className="text-2xl font-bold mb-6">マイページ</h1>
      {user ? (
        <div className="space-y-4">
          <p><strong>メールアドレス：</strong> {user.email}</p>
          <p><strong>ユーザーID：</strong> {user.id}</p>
          <form action="/logout" method="post">
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
            >
              ログアウト
            </button>
          </form>
        </div>
      ) : (
        <p>読み込み中...</p>
      )}
    </div>
  )
}
