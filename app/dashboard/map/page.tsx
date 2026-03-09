'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const MapComponent = dynamic(() => import('@/components/map-component'), { ssr: false })

interface Report {
  id: string
  title: string
  location: string
  latitude?: number
  longitude?: number
  status: string
}

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setReports((data as Report[]) || [])
      } catch (error) {
        console.error('Error fetching reports:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()

    // Subscribe to real-time updates
    const supabase = createClient()
    const subscription = supabase
      .channel('reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          fetchReports()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Map View</h1>
        <p className="text-muted-foreground">Geographic visualization of reports in Douala</p>
      </div>

      <Card className="border border-border overflow-hidden">
        <CardHeader>
          <CardTitle>Report Locations</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${reports.length} report${reports.length !== 1 ? 's' : ''} displayed`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              Loading map and reports...
            </div>
          ) : (
            <MapComponent reports={reports} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
