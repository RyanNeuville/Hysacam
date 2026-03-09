'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Bell, Lock, Shield, Database } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    dataRetention: '90',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simulate saving settings
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and system preferences</p>
      </div>

      {/* Notifications Settings */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Control how you receive notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Receive email alerts for new reports and updates
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
                <Label className="text-base font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive browser notifications for urgent alerts
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
              <CardTitle>Security</CardTitle>
              <CardDescription>Protect your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full">
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </Button>
          <Button variant="outline" className="w-full">
            Enable Two-Factor Authentication
          </Button>
        </CardContent>
      </Card>

      {/* Data Settings */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Control your data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="retention" className="text-base font-medium">
              Data Retention Period (days)
            </Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Automatically delete old records after this period
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
            Export My Data
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading} className="px-8">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
        {saved && <div className="text-green-600 flex items-center gap-2">✓ Saved</div>}
      </div>
    </div>
  )
}
