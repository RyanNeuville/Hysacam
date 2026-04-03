'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true)
  const [statusData, setStatusData] = useState([
    { name: 'En attente', value: 0, fill: '#FFA500' },
    { name: 'En cours', value: 0, fill: '#3B82F6' },
    { name: 'Résolu', value: 0, fill: '#10B981' },
  ])
  const [weeklyData, setWeeklyData] = useState([
    { day: 'Lun', reports: 0 },
    { day: 'Mar', reports: 0 },
    { day: 'Mer', reports: 0 },
    { day: 'Jeu', reports: 0 },
    { day: 'Ven', reports: 0 },
    { day: 'Sam', reports: 0 },
    { day: 'Dim', reports: 0 },
  ])

  useEffect(() => {
    const fetchAndCalculateStats = async () => {
      try {
        const supabase = createClient()
        const { data: reports, error } = await supabase
          .from('reports')
          .select('statut, created_at')
        
        if (error) throw error

        if (reports) {
          // Calculate Status Data
          const attente = reports.filter(r => r.statut === 'En attente').length
          const enCours = reports.filter(r => r.statut === 'En cours').length
          const resolus = reports.filter(r => r.statut === 'Résolu').length
          
          setStatusData([
            { name: 'En attente', value: attente, fill: '#FFA500' },
            { name: 'En cours', value: enCours, fill: '#3B82F6' },
            { name: 'Résolu', value: resolus, fill: '#10B981' },
          ])

          // Calculate Weekly Data (Current Week)
          const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
          const today = new Date()
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
          startOfWeek.setHours(0, 0, 0, 0)
          
          const weekMap: Record<string, number> = {
            'Lun': 0, 'Mar': 0, 'Mer': 0, 'Jeu': 0, 'Ven': 0, 'Sam': 0, 'Dim': 0
          }

          reports.forEach(report => {
            const rDate = new Date(report.created_at)
            // if (rDate >= startOfWeek) { // uncomment to limit strictly to this week
              const dayStr = weekDays[rDate.getDay()]
              if (weekMap[dayStr] !== undefined) {
                weekMap[dayStr]++
              }
            // }
          })

          setWeeklyData([
            { day: 'Lun', reports: weekMap['Lun'] },
            { day: 'Mar', reports: weekMap['Mar'] },
            { day: 'Mer', reports: weekMap['Mer'] },
            { day: 'Jeu', reports: weekMap['Jeu'] },
            { day: 'Ven', reports: weekMap['Ven'] },
            { day: 'Sam', reports: weekMap['Sam'] },
            { day: 'Dim', reports: weekMap['Dim'] },
          ])
        }
      } catch (err) {
        console.error("Error computing statistics", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAndCalculateStats()

    const supabase = createClient()
    const subscription = supabase
      .channel("statistics_reports")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => {
          fetchAndCalculateStats();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Statistiques</h1>
        <p className="text-muted-foreground">Statistiques détaillées et aperçus des signalements</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Status Distribution */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>Statistiques des signalements</CardTitle>
            <CardDescription>Distribution de tous les signalements</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Calculs en cours...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        {/* <Card className="border border-border">
          <CardHeader>
            <CardTitle>Reports by Category</CardTitle>
            <CardDescription>Breakdown by issue type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" stroke="var(--color-muted-foreground)" />
                <YAxis dataKey="category" type="category" stroke="var(--color-muted-foreground)" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                  }}
                />
                <Bar dataKey="count" fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card> */}
      </div>

      {/* Weekly Trend */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Tendance des signalements</CardTitle>
          <CardDescription>Signalements soumis cette semaine</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="h-[300px] flex items-center justify-center text-muted-foreground">Création de la tendance...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                  }}
                />
                <Bar dataKey="reports" fill="var(--color-secondary)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
