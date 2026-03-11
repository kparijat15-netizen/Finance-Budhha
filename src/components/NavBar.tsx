'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, Target, Bot } from 'lucide-react'
import { PROFILE } from '../constants/profile'

const NAV_ITEMS = [
  { href: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { href: '/finance',  label: 'Finance',   icon: Wallet },
  { href: '/goals',    label: 'Goals',     icon: Target },
  { href: '/ai-buddy', label: 'AI Buddy',  icon: Bot },
]

export default function NavBar() {
  const pathname = usePathname()
  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <span className="text-xl">🪷</span>
        <span className="font-bold text-slate-800 text-base tracking-tight">{PROFILE.siteTitle}</span>
      </header>

      {/* Bottom nav (mobile-first) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 flex justify-around py-2 md:hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 text-xs px-3 py-1 rounded-xl transition-colors ${active ? 'text-brand-600 font-semibold' : 'text-slate-400'}`}>
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex fixed left-0 top-14 bottom-0 w-52 flex-col gap-1 p-3 bg-white border-r border-slate-100 z-20">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </aside>
    </>
  )
}
