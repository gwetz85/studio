
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function IssuesRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/")
  }, [router])

  return (
    <div className="flex h-96 items-center justify-center text-slate-400">
      Memuat...
    </div>
  )
}
