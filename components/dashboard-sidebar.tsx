'use client'

import { createClient } from '@/lib/supabase/client'
import {
  BarChart3,
  FileText,
  LogOut,
  MessageSquare,
  Settings,
  Users,
  Map,
  Bell,
  Menu,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navItems = [
    {
      href: '/dashboard',
      label: 'Overview',
      icon: BarChart3,
    },
    {
      href: '/dashboard/reports',
      label: 'Reports',
      icon: FileText,
    },
    {
      href: '/dashboard/map',
      label: 'Map View',
      icon: Map,
    },
    {
      href: '/dashboard/users',
      label: 'Users',
      icon: Users,
    },
    {
      href: '/dashboard/statistics',
      label: 'Statistics',
      icon: BarChart3,
    },
    {
      href: '/dashboard/notifications',
      label: 'Notifications',
      icon: Bell,
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: Settings,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-card border border-border"
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center text-sidebar-primary-foreground font-bold">
                C
              </div>
              CityReport
            </h1>
            <p className="text-xs text-sidebar-accent mt-1">Hysacam Admin</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="destructive"
              className="w-full flex items-center gap-2 justify-center"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
