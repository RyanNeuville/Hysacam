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
    inProgressReports: 0,
    resolvedReports: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ month: string; reports: number; resolved: number }[]>([]);

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
          .eq("statut", "En attente");

        const { count: resolvedReports } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("statut", "Résolu");

        // Fetch active users (Admin or Autorité) from 'users' table
        const { count: activeUsersAdmin } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");

        const { count: activeUsersAutorite } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "Autorité");
        
        const activeUsersCount = (activeUsersAdmin || 0) + (activeUsersAutorite || 0);

        const { count: inProgressReports } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("statut", "En cours");

        // Compute per-month chart data from real reports
        const { data: allReports } = await supabase
          .from("reports")
          .select("created_at, statut");

        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
        const monthMap: Record<string, { reports: number; resolved: number }> = {};
        (allReports || []).forEach((r: any) => {
          const d = new Date(r.created_at);
          const key = monthNames[d.getMonth()];
          if (!monthMap[key]) monthMap[key] = { reports: 0, resolved: 0 };
          monthMap[key].reports++;
          if (r.statut === "Résolu") monthMap[key].resolved++;
        });
        const dynamicChartData = Object.entries(monthMap).map(([month, v]) => ({ month, ...v }));
        setChartData(dynamicChartData);

        setStats({
          totalReports: totalReports || 0,
          pendingReports: pendingReports || 0,
          inProgressReports: inProgressReports || 0,
          resolvedReports: resolvedReports || 0,
          activeUsers: activeUsersCount,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const supabase = createClient();
    const subscription = supabase
      .channel("dashboard_reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => fetchStats())
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);


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
      title: "En cours",
      value: stats.inProgressReports,
      icon: TrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Résolus",
      value: stats.resolvedReports,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
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
