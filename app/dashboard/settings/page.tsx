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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Lock, Shield, Database } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    dataRetention: "90",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate saving settings
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Parametres</h1>
        <p className="text-muted-foreground">
          Gérer votre compte et les préférences du système
        </p>
      </div>

      {/* Notifications Settings */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Gérer comment vous recevez les notifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                Notifications par email
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Recevez des alertes par email pour les nouveaux rapports et
                mises à jour
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">
                  Notifications Push
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Recevez des notifications push pour les alertes urgentes
                </p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, pushNotifications: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Sécurité</CardTitle>
              <CardDescription>Protéger votre compte</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full">
            <Lock className="w-4 h-4 mr-2" />
            Changer le mot de passe
          </Button>
          <Button variant="outline" className="w-full">
            Activer l'authentification à deux facteurs
          </Button>
        </CardContent>
      </Card>

      {/* Data Settings */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Gestion des données</CardTitle>
              <CardDescription>Gérer vos données</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="retention" className="text-base font-medium">
              Période de rétention des données (jours)
            </Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Supprimer automatiquement les anciens enregistrements après cette
              période
            </p>
            <Input
              id="retention"
              type="number"
              value={settings.dataRetention}
              onChange={(e) =>
                setSettings({ ...settings, dataRetention: e.target.value })
              }
              className="max-w-xs"
            />
          </div>
          <Button variant="outline" className="w-full">
            Exporter mes données
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="px-8 bg-green-600"
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        {saved && (
          <div className="text-green-600 flex items-center gap-2">✓ Saved</div>
        )}
      </div>
    </div>
  );
}
