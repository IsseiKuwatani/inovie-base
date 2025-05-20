// app/documents/new/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewDocumentRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/documents/new-entry') 
  }, [router])

  return null
}
