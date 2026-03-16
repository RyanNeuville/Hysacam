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
import Image from 'next/image'

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  /** version francaise */
  const navItems = [
    {
      href: '/dashboard',
      label: 'Aperçu',
      icon: BarChart3,
    },
    {
      href: '/dashboard/reports',
      label: 'Rapports',
      icon: FileText,
    },
    {
      href: '/dashboard/map',
      label: 'Carte',
      icon: Map,
    },
    {
      href: '/dashboard/users',
      label: 'Utilisateurs',
      icon: Users,
    },
    {
      href: '/dashboard/statistics',
      label: 'Statistiques',
      icon: BarChart3,
    },
    {
      href: '/dashboard/notifications',
      label: 'Notifications',
      icon: Bell,
    },
    {
      href: '/dashboard/settings',
      label: 'Paramètres',
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
        className={`fixed lg:relative left-0 top-0 h-screen w-64 text-sidebar-foreground border-r  z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b  bg-yellow-400">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Image src="/apple-icon.png" alt="Hysacam" width={175} height={100} />
            </h1>
            {/* version francaise */}
            <p className="text-sm mt-1 text-white">Administrateur Hysacam</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 bg-yellow-400">
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
          <div className="p-4 border-sidebar-border bg-yellow-400">
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
