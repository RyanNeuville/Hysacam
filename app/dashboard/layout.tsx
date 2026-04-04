import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (!user || authError) {
    redirect('/auth/login')
  }

  // Fetch real-time role and status from the 'users' table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, is_blocked')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    // If user record doesn't exist in 'users' table, they shouldn't be here
    redirect('/auth/login')
  }

  // Check if user is an admin or Authority
  const isAdmin = userData.role === 'admin' || userData.role === 'Autorité'
  const isBlocked = userData.is_blocked

  if (!isAdmin || isBlocked) {
    // If not admin/authorized or if blocked, redirect out
    redirect('/auth/login?error=unauthorized')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
