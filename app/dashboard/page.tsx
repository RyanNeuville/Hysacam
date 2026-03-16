"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient();

        // Fetch reports count
        const { count: totalReports } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true });

        const { count: pendingReports } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        const { count: resolvedReports } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("status", "resolved");

        // Fetch active users
        const { count: activeUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");

        setStats({
          totalReports: totalReports || 0,
          pendingReports: pendingReports || 0,
          resolvedReports: resolvedReports || 0,
          activeUsers: activeUsers || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const chartData = [
    { month: "Jan", reports: 65, resolved: 45 },
    { month: "Feb", reports: 78, resolved: 52 },
    { month: "Mar", reports: 92, resolved: 68 },
    { month: "Apr", reports: 88, resolved: 71 },
    { month: "May", reports: 105, resolved: 85 },
    { month: "Jun", reports: 120, resolved: 98 },
  ];

  /** version francaise */
  const statCards = [
    {
      title: "Total des signalements",
      value: stats.totalReports,
      icon: AlertCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "En attente",
      value: stats.pendingReports,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Résolus",
      value: stats.resolvedReports,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Utilisateurs actifs",
      value: stats.activeUsers,
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        {/* version francaise */}
        <p className="text-muted-foreground">
          Bienvenue sur le tableau de bord administratif d'Hysacam
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} p-2 rounded-lg`}>
                  <Icon className={`${card.color} w-4 h-4`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "-" : card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border">
          <CardHeader>
            {/* version francaise */}
            <CardTitle>Evolution des signalements</CardTitle>
            <CardDescription>
              {/* version francaise */}
              Soumissions mensuelles des rapports vs résolutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                />
                <XAxis stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="reports"
                  stroke="#FFD700"
                  name="Total Reports"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#00FF00"
                  name="Resolved"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader>
            {/* version francaise */}
            <CardTitle>Répartition des signalements</CardTitle>
            <CardDescription>
              {/* version francaise */}
              Distribution des signalements par statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                />
                <XAxis stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Bar
                  dataKey="reports"
                  fill="#FFD700"
                  name="Reports"
                />
                <Bar
                  dataKey="resolved"
                  fill="#00FF00"
                  name="Resolved"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
