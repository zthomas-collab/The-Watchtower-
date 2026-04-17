import { Eye } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-wt-bg flex flex-col">
      {/* Minimal nav */}
      <nav className="px-6 py-4 border-b border-wt-border">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Eye className="w-4 h-4 text-wt-accent" />
          <span className="font-bold text-sm tracking-tight">THE WATCHTOWER</span>
        </Link>
      </nav>

      {/* Auth content centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>

      <footer className="px-6 py-4 border-t border-wt-border text-center">
        <p className="text-xs text-wt-muted">
          © The Watchtower · For informational purposes only · Not investment advice
        </p>
      </footer>
    </div>
  )
}
