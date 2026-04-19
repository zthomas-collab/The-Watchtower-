'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Eye, LayoutDashboard, Map, BarChart3, GitCompare, Star, Bell, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore Map', icon: Map },
  { href: '/rankings', label: 'Rankings', icon: BarChart3 },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/watchlist', label: 'Watchlist', icon: Star },
  { href: '/alerts', label: 'Alerts', icon: Bell, badge: 'Phase 2' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 bg-wt-surface border-r border-wt-border flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-wt-border">
        <Link href="/" className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-wt-accent" />
          <span className="font-bold text-sm tracking-tight">THE WATCHTOWER</span>
        </Link>
        <div className="text-xs text-wt-muted mt-1">U.S. Real Estate Intelligence</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-wt-accent/10 text-wt-accent border-l-2 border-wt-accent'
                  : 'text-wt-muted hover:text-white hover:bg-wt-border/50 border-l-2 border-transparent'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-xs bg-wt-border text-wt-muted px-1.5 py-0.5 font-medium">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Data freshness indicator */}
      <div className="p-4 border-t border-wt-border">
        <div className="wt-label mb-1">Data Updated</div>
        <div className="text-xs text-white font-medium">Monthly</div>
        <div className="text-xs text-wt-muted mt-0.5">Census · BLS · Redfin · BEA</div>
      </div>
    </aside>
  )
}
