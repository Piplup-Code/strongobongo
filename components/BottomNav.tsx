'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, History, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Routines', icon: Home },
  { href: '/history', label: 'History', icon: History },
]

export function BottomNav() {
  const pathname = usePathname()

  // Hide nav during active workout
  if (pathname.startsWith('/workout/')) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-foreground/20">
      <div className="flex justify-around items-center h-20 max-w-5xl mx-auto bg-card border-x-2 border-foreground/20">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-2 transition-all relative group',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'absolute inset-0 border-2 transition-all',
                isActive 
                  ? 'border-primary/50' 
                  : 'border-transparent group-hover:border-foreground/20'
              )} />
              <Icon className="h-6 w-6 relative z-10" />
              <span className="text-xs font-semibold uppercase tracking-wider relative z-10">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
