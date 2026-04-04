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
  User,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{ name: string | null; email: string | null } | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', user.id)
          .single()
        
        setUserProfile(data || { name: 'Admin', email: user.email || null })
      }
    }
    fetchProfile()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Aperçu', icon: BarChart3 },
    { href: '/dashboard/reports', label: 'Rapports', icon: FileText },
    { href: '/dashboard/map', label: 'Carte', icon: Map },
    { href: '/dashboard/users', label: 'Utilisateurs', icon: Users },
    { href: '/dashboard/statistics', label: 'Statistiques', icon: BarChart3 },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
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
        className={`fixed lg:relative left-0 top-0 h-screen w-64 text-sidebar-foreground border-r z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full bg-yellow-400">
          {/* Logo */}
          <div className="p-6 border-b border-yellow-500/20">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Image src="/apple-icon.png" alt="Hysacam" width={175} height={100} priority />
            </h1>
            <p className="text-sm mt-1 text-white/80 font-medium">Administrateur Hysacam</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-white text-yellow-600 shadow-sm font-bold'
                      : 'text-white hover:bg-white/10 hover:translate-x-1'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-yellow-600' : 'text-white'}`} />
                  <span className="text-sm">{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-yellow-500/20 space-y-4">
            {userProfile && (
              <div className="flex items-center gap-3 px-2 py-2 bg-white/10 rounded-xl">
                <Avatar className="h-9 w-9 border border-white/20">
                  <AvatarFallback className="bg-white text-yellow-600 text-xs font-bold">
                    {userProfile.name?.substring(0, 2).toUpperCase() || 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{userProfile.name || 'Admin'}</p>
                  <p className="text-[10px] text-white/70 truncate">{userProfile.email}</p>
                </div>
              </div>
            )}
            
            <Button
              variant="destructive"
              className="w-full flex items-center gap-2 justify-center rounded-xl bg-red-500 hover:bg-red-600 border-none shadow-md"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold">Déconnexion</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
