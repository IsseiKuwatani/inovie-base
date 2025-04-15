'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { LogOut, User } from 'lucide-react'
import Link from 'next/link'

export default function SidebarFooter() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user)
    }
    getUser()
  }, [])

  if (!user) return null

  return (
    <div className="mt-auto pt-8 border-t border-gray-700 space-y-4">
      <Link
        href="/me"
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-yellow-400 transition-colors"
      >
        <User size={20} />
        <span className="text-sm font-medium">マイページ</span>
      </Link>

      <button
        onClick={async () => {
          await supabase.auth.signOut()
          router.push('/login')
        }}
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-yellow-400 transition-colors w-full text-left"
      >
        <LogOut size={20} />
        <span className="text-sm font-medium">ログアウト</span>
      </button>
    </div>
  )
}
