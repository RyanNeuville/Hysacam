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
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  MessageSquare, 
  User as UserIcon,
  ChevronRight 
} from "lucide-react";
import Link from "next/link";

interface RecentReport {
  id: string;
  title: string | null;
  typeInsalubrite: string;
  statut: string;
  created_at: string;
}

interface RecentComment {
  id: string;
  content: string;
  created_at: string;
  is_admin: boolean;
  users: { name: string | null } | null;
  reports: { title: string | null; id: string } | null;
}

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
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);

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

      // Compute per-month chart data
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

      // Fetch Recent Activities
      const { data: reportsData } = await supabase
        .from("reports")
        .select("id, title, typeInsalubrite, statut, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      
      setRecentReports((reportsData as RecentReport[]) || []);

      const { data: commentsData } = await supabase
        .from("comments")
        .select(`
          id, content, created_at, is_admin,
          users:user_id(name),
          reports:report_id(id, title)
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      
      setRecentComments((commentsData as any) || []);

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const supabase = createClient();
    const subscription = supabase
      .channel("dashboard_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => fetchStats())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments" }, () => fetchStats())
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

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
        <h1 className="text-3xl font-bold text-foreground mb-2">Tableau de Bord</h1>
        <p className="text-muted-foreground">
          Bienvenue sur l'interface d'administration CityReport pour Hysacam
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border border-border shadow-sm">
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
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle>Évolution des signalements</CardTitle>
            <CardDescription>
              Soumissions mensuelles cumulées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis stroke="var(--color-muted-foreground)" dataKey="month" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                />
                <Line type="monotone" dataKey="reports" stroke="#FFD700" name="Signalements" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="resolved" stroke="#10B981" name="Résolus" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle>Répartition par Statut</CardTitle>
            <CardDescription>
              Volume actuel de traitement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'En attente', count: stats.pendingReports, fill: '#EAB308' },
                { name: 'En cours', count: stats.inProgressReports, fill: '#3B82F6' },
                { name: 'Résolu', count: stats.resolvedReports, fill: '#10B981' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Derniers Signalements</CardTitle>
              <CardDescription>Les 5 rapports les plus récents</CardDescription>
            </div>
            <Link href="/dashboard/reports">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun signalement récent</p>
            ) : (
              recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <AlertCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{report.title || report.typeInsalubrite}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString('fr-FR')} à {new Date(report.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={report.statut === 'Résolu' ? 'secondary' : 'outline'} className="text-[10px]">
                    {report.statut.toUpperCase()}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Derniers Commentaires</CardTitle>
              <CardDescription>Flux de discussion en direct</CardDescription>
            </div>
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {recentComments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun commentaire récent</p>
            ) : (
              recentComments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                       <UserIcon className="w-3 h-3 text-primary" />
                       <span className="text-xs font-bold">
                         {comment.is_admin ? "HYSACAM (Admin)" : (comment.users?.name || "Citoyen")}
                       </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2 italic text-muted-foreground">"{comment.content}"</p>
                  <Link href={`/dashboard/reports/${comment.reports?.id}`} className="text-[10px] text-blue-500 mt-2 block hover:underline">
                    Sur: {comment.reports?.title || "Signalement sans titre"}
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
