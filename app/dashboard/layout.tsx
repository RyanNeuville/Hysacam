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
  let { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, is_blocked')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    // Auto-create user profile if it doesn't exist (first login)
    // We give 'admin' to the first users to avoid being locked out during setup
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'Administrateur',
        role: 'admin',
        is_blocked: false
      })
      .select('role, is_blocked')
      .single()

    if (createError) {
       console.error("Error auto-creating user profile:", createError);
       redirect('/auth/login?error=profile_creation_failed')
    }
    userData = newUser
  }

  // Check if user is an admin or Authority
  const isAdmin = userData.role === 'admin' || userData.role === 'Autorité' || userData.role === 'Administrateur'
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
