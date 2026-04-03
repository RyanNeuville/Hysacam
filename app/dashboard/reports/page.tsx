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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  User,
  MessageSquare,
  MoreVertical,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useRouter } from "next/navigation";

interface Report {
  id: string;
  title: string | null;
  description: string;
  typeInsalubrite: string;
  statut: "En attente" | "En cours" | "Résolu";
  created_at: string;
  user_id: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "En attente" | "En cours" | "Résolu"
  >("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const supabase = createClient();
        let query = supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false });

        if (filter !== "all") {
          query = query.eq("statut", filter);
        }

        const { data, error } = await query;

        if (error) throw error;
        setReports((data as Report[]) || []);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    // Subscribe to real-time updates
    const supabase = createClient();
    const subscription = supabase
      .channel("reports")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => {
          fetchReports();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  const filteredReports = reports.filter(
    (report) =>
      (report.title || report.typeInsalubrite).toLowerCase().includes(search.toLowerCase()) ||
      report.description.toLowerCase().includes(search.toLowerCase()),
  );

  const statusColor = {
    "En attente":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    "En cours":
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    "Résolu":
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("reports")
        .update({ statut: newStatus })
        .eq("id", reportId);

      if (error) throw error;

      // Update local state
      setReports(
        reports.map((r) =>
          r.id === reportId ? { ...r, statut: newStatus as any } : r,
        ),
      );
    } catch (error) {
      console.error("Error updating report:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Rapports</h1>
        <p className="text-muted-foreground">
          Gérer tous les rapports d'incidents et de problèmes
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Rechercher des rapports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les Status</SelectItem>
            <SelectItem value="En attente">En attente</SelectItem>
            <SelectItem value="En cours">En cours</SelectItem>
            <SelectItem value="Résolu">Résolu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Table */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Tous les rapports</CardTitle>
          <CardDescription>
            {loading
              ? "Loading..."
              : `${filteredReports.length} report${filteredReports.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des Rapports...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun rapport trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Titre / Type</TableHead>
                    <TableHead>Lieu</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id} className="border-border cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/reports/${report.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {report.imageUrl ? (
                            <img src={report.imageUrl} alt="report" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">
                              {(report.title || report.typeInsalubrite).toUpperCase()}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1 max-w-[250px]">
                              {report.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor[report.statut] || 'bg-gray-100 text-gray-800'}>
                          {report.statut.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={report.statut}
                          onValueChange={(value) =>
                            updateReportStatus(report.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="En attente">En attente</SelectItem>
                            <SelectItem value="En cours">En cours</SelectItem>
                            <SelectItem value="Résolu">Résolu</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
