import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { ReactNode } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
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
