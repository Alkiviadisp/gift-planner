"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"

interface HomepageLayoutProps {
  children: React.ReactNode
}

export function HomepageLayout({ children }: HomepageLayoutProps) {
  const pathname = usePathname()
  const isHomepage = pathname === "/"

  if (isHomepage) {
    return <div className="w-full">{children}</div>
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1">{children}</main>
    </>
  )
} 