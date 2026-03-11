import type { Metadata } from 'next'
import './globals.css'
import { PROFILE } from '../constants/profile'
import NavBar from '../components/NavBar'
import CommandBar from '../components/CommandBar'

export const metadata: Metadata = {
  title: PROFILE.siteTitle,
  description: PROFILE.tagline,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <NavBar />
        {/* pb-36 gives room for: bottom-nav (~60px) + command bar (~52px) + gap */}
        <main className="max-w-4xl mx-auto px-4 pb-36 pt-6 md:pb-28">{children}</main>
        <CommandBar />
      </body>
    </html>
  )
}
