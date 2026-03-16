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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const supabase = createClient();
        let query = supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false });

        if (filter === "unread") {
          query = query.eq("read", false);
        }

        const { data, error } = await query;

        if (error) {
          // If table doesn't exist yet, show mock data
          setNotifications([
            {
              id: "1",
              title: "New Report Submitted",
              message: "Road damage reported on Avenue Cameroon",
              type: "info",
              read: false,
              created_at: new Date().toISOString(),
            },
          ]);
        } else {
          setNotifications((data as Notification[]) || []);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to real-time updates
    const supabase = createClient();
    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  const markAsRead = async (notificationId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (!error) {
        setNotifications(
          notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n,
          ),
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId));
  };

  const typeIcon = {
    info: Info,
    warning: AlertCircle,
    success: CheckCircle2,
  };

  const filteredNotifications = notifications.filter(
    (n) => filter === "all" || !n.read,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Notifications
        </h1>
        <p className="text-muted-foreground">
          Restez informé des dernières notifications
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {/* changer la variant du bouton pour une couleur jaune au lieu de defaut  */}

        <Button
          variant={filter === "all" ? "warning" : "outline"}
          onClick={() => setFilter("all")}
        >
          Toutes les notifications
        </Button>
        <Button
          variant={filter === "unread" ? "warning" : "outline"}
          onClick={() => setFilter("unread")}
        >
          Non lues
        </Button>
      </div>

      {/* Notifications Table */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Centre de notifications</CardTitle>
          <CardDescription>
            {loading
              ? "Chargement..."
              : `${filteredNotifications.length} notification${filteredNotifications.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const Icon = typeIcon[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      notification.read
                        ? "bg-background border-border"
                        : "bg-primary/5 border-primary/20"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
