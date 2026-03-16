'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const statusData = [
  { name: 'En attente', value: 24, fill: '#8884d8' },
  { name: 'En cours', value: 35, fill: '#82ca9d' },
  { name: 'Résolu', value: 41, fill: '#ffc658' },
]

// const categoryData = [
//   { category: 'Roads', count: 45 },
//   { category: 'Water', count: 38 },
//   { category: 'Electricity', count: 52 },
//   { category: 'Waste', count: 29 },
//   { category: 'Traffic', count: 41 },
// ]

const weeklyData = [
  { day: 'Mon', reports: 12 },
  { day: 'Tue', reports: 19 },
  { day: 'Wed', reports: 8 },
  { day: 'Thu', reports: 22 },
  { day: 'Fri', reports: 28 },
  { day: 'Sat', reports: 15 },
  { day: 'Sun', reports: 10 },
]

export default function StatisticsPage() {
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
          <CardContent>
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis stroke="var(--color-muted-foreground)" />
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
        </CardContent>
      </Card>
    </div>
  )
}
