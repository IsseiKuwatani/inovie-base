'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user)
    }

    getSession()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="w-full bg-gray-900 text-white px-6 py-3 shadow-md flex justify-between items-center">
      <Link href="/" className="text-xl font-bold hover:text-yellow-400">
        Inovie
      </Link>
      <nav className="space-x-4 text-sm">
        {user ? (
          <>
            <Link href="/me" className="hover:text-yellow-400">マイページ</Link>
            <button onClick={handleLogout} className="hover:text-yellow-400">ログアウト</button>
          </>
        ) : (
          <Link href="/login" className="hover:text-yellow-400">ログイン</Link>
        )}
      </nav>
    </header>
  )
}
