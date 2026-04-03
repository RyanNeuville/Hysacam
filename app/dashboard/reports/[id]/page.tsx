"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Clock, MapPin, Send, User } from "lucide-react";

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

interface Comment {
  id: string;
  report_id: string;
  user_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
}

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReportAndComments = async () => {
      try {
        const supabase = createClient();
        
        // Fetch report
        const { data: reportData, error: reportError } = await supabase
          .from("reports")
          .select("*")
          .eq("id", reportId)
          .single();

        if (reportError) throw reportError;
        setReport(reportData);

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select("*")
          .eq("report_id", reportId)
          .order("created_at", { ascending: true });

        if (commentsError) throw commentsError;
        setComments(commentsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportAndComments();

    const supabase = createClient();
    
    // Subscribe to comments
    const commentsSubscription = supabase
      .channel(`comments_report_${reportId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `report_id=eq.${reportId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
             setComments(prev => [...prev, payload.new as Comment]);
          }
        }
      )
      .subscribe();
      
    // Subscribe to report status change
    const reportSubscription = supabase
      .channel(`report_${reportId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports", filter: `id=eq.${reportId}` },
        (payload) => {
          setReport(payload.new as Report);
        }
      )
      .subscribe();

    return () => {
      commentsSubscription.unsubscribe();
      reportSubscription.unsubscribe();
    };
  }, [reportId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const updateStatus = async (newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("reports")
        .update({ statut: newStatus })
        .eq("id", reportId);

      if (error) throw error;
      setReport(prev => prev ? { ...prev, statut: newStatus as any } : null);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const supabase = createClient();
      // On web admin, we send comments as admin. We would normally take admin ID from auth, 
      // but if there's no auth setup, we just use a generic or null user_id and force is_admin=true.
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("comments").insert({
        report_id: reportId,
        user_id: user?.id || "admin_system",
        content: newMessage.trim(),
        is_admin: true,
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const statusColor = {
    "En attente": "bg-yellow-100 text-yellow-800",
    "En cours": "bg-blue-100 text-blue-800",
    "Résolu": "bg-green-100 text-green-800",
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement des détails...</div>;
  }

  if (!report) {
    return <div className="p-8 text-center text-red-500">Signalement introuvable.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Détail du Signalement</h1>
          <p className="text-muted-foreground">ID: {report.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column : Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Informations
                <Badge className={statusColor[report.statut] || 'bg-gray-100'}>
                  {report.statut.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {report.imageUrl && (
                <div className="rounded-xl overflow-hidden shadow-sm">
                  <img src={report.imageUrl} alt="Preuve" className="w-full h-48 object-cover" />
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-lg text-foreground mt-4">
                  {(report.title || report.typeInsalubrite).toUpperCase()}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">{report.description}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  Lat: {report.latitude.toFixed(4)}, Lng: {report.longitude.toFixed(4)}
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  Signalé le {new Date(report.created_at).toLocaleString()}
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <label className="text-sm font-semibold text-foreground">Modifier le statut</label>
                <Select value={report.statut} onValueChange={updateStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En attente">En attente</SelectItem>
                    <SelectItem value="En cours">En cours</SelectItem>
                    <SelectItem value="Résolu">Résolu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column : Chat with Citizen */}
        <div className="lg:col-span-2">
          <Card className="border border-border flex flex-col h-[700px]">
            <CardHeader>
              <CardTitle>Conversation avec le citoyen</CardTitle>
              <CardDescription>
                Échangez en direct pour informer le citoyen de l'avancée du traitement.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto space-y-4 p-6 bg-slate-50/50 dark:bg-slate-900/50">
              {comments.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Aucun message pour le moment.</p>
                  </div>
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`flex flex-col max-w-[80%] ${
                      comment.is_admin ? "ml-auto" : "mr-auto"
                    }`}
                  >
                    <div
                      className={`p-4 rounded-2xl ${
                        comment.is_admin
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-white dark:bg-slate-800 text-foreground rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm"
                      }`}
                    >
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <span
                      className={`text-[10px] text-muted-foreground mt-1 font-medium px-2 ${
                        comment.is_admin ? "text-right" : "text-left"
                      }`}
                    >
                      {comment.is_admin ? "Vous (Admin HYSACAM)" : "Citoyen"} •{" "}
                      {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="p-4 bg-background border-t border-border">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrire un message au citoyen..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
