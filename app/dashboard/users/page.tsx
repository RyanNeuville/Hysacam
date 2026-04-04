'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Mail,
  ShieldCheck,
  Ban,
  Download,
  Users,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Trash2,
  Bell,
  Send,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'citizen' | 'Autorité' | 'Citoyen' | string
  is_blocked: boolean
  created_at: string
  name?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statutFilter, setStatutFilter] = useState<'all' | 'active' | 'blocked'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Notification state
  const [isNotifyOpen, setIsNotifyOpen] = useState(false)
  const [notifyUser, setNotifyUser] = useState<UserProfile | null>(null)
  const [notifyTitle, setNotifyTitle] = useState('')
  const [notifyMessage, setNotifyMessage] = useState('')
  const [notifyLoading, setNotifyLoading] = useState(false)

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers((data as UserProfile[]) || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsers()

    const supabase = createClient()
    const subscription = supabase
      .channel('users_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchUsers())
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [])

  const filteredUsers = users.filter((user) => {
    const userName = user.name || '';
    const matchSearch =
      (user.email || '').toLowerCase().includes(search.toLowerCase()) ||
      userName.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || user.role === roleFilter
    
    let matchStatut = true
    if (statutFilter === 'active') matchStatut = !user.is_blocked
    if (statutFilter === 'blocked') matchStatut = user.is_blocked
    
    return matchSearch && matchRole && matchStatut
  })

  const toggleUserBlock = async (userId: string, currentBlocked: boolean) => {
    setActionLoading(userId)
    try {
      const supabase = createClient()
      const newBlocked = !currentBlocked
      const { error } = await supabase
        .from('users')
        .update({ is_blocked: newBlocked })
        .eq('id', userId)

      if (error) throw error
      setUsers(users.map((u) => u.id === userId ? { ...u, is_blocked: newBlocked } : u))
    } catch (error) {
      console.error('Error updating user block status:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return
    setActionLoading(userId + '_delete')
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      setUsers(users.filter((u) => u.id !== userId))
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const changeUserRole = async (userId: string, newRole: string) => {
    setActionLoading(userId + '_role')
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      setUsers(users.map((u) => u.id === userId ? { ...u, role: newRole } : u))
    } catch (error) {
      console.error('Error updating user role:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendNotification = async () => {
    if (!notifyUser || !notifyTitle || !notifyMessage) return
    setNotifyLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notifyUser.id,
          title: notifyTitle,
          message: notifyMessage,
          type: 'info',
          read: false
        })

      if (error) throw error
      setIsNotifyOpen(false)
      setNotifyTitle('')
      setNotifyMessage('')
      alert('Notification envoyée avec succès !')
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Erreur lors de l’envoi.')
    } finally {
      setNotifyLoading(false)
    }
  }

  const handleExportCSV = () => {
    const exportDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
    const exportTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    const csvRows = [
      [`HYSACAM - Rapport des Utilisateurs`],
      [`Généré le : ${exportDate} à ${exportTime}`],
      [`Plateforme : CityReport Admin Dashboard`],
      [`Nombre total d'utilisateurs exportés : ${filteredUsers.length}`],
      [],
      ['ID', 'Email', 'Nom Complet', 'Rôle', 'Statut', 'Date d\'inscription'],
      ...filteredUsers.map((u) => [
        u.id,
        u.email || '-',
        u.name || '-',
        u.role || '-',
        u.is_blocked ? 'Bloqué' : 'Actif',
        new Date(u.created_at).toLocaleDateString('fr-FR'),
      ]),
    ]

    const csvContent = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hysacam_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalUsers = users.length
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'Autorité').length
  const citizenCount = users.filter((u) => u.role === 'citizen' || u.role === 'Citoyen').length
  const blockedCount = users.filter((u) => u.is_blocked).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Administrer les comptes réels de la plateforme</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="warning"
            size="sm"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total utilisateurs', value: totalUsers, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Administrateurs', value: adminCount, icon: ShieldCheck, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { label: 'Citoyens', value: citizenCount, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Bloqués', value: blockedCount, icon: UserX, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((stat) => (
          <Card key={stat.label} className="border border-border shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {loading ? '—' : stat.value}
                </p>
              </div>
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={`${stat.color} w-5 h-5`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email ou nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="citizen">Citoyen</SelectItem>
            <SelectItem value="Autorité">Autorité</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statutFilter} onValueChange={(v) => setStatutFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="blocked">Bloqué</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border overflow-hidden">
        <CardHeader>
          <CardTitle>Comptes utilisateurs</CardTitle>
          <CardDescription>
            {loading
              ? 'Chargement...'
              : `${filteredUsers.length} utilisateur${filteredUsers.length !== 1 ? 's' : ''} trouvé${filteredUsers.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Chargement des utilisateurs...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors border-b">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                            <span className="text-primary font-bold text-sm">
                              {(user.name || user.email || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{user.name || 'Anonyme'}</p>
                            <p className="text-muted-foreground text-xs">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(v) => changeUserRole(user.id, v)}
                          disabled={actionLoading === user.id + '_role'}
                        >
                          <SelectTrigger className="w-32 h-8 text-[11px] font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="Autorité">Autorité</SelectItem>
                            <SelectItem value="citizen">Citoyen</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_blocked ? "destructive" : "secondary"}
                          className="text-[10px] uppercase font-bold"
                        >
                          {user.is_blocked ? 'Bloqué' : 'Actif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                           <Button
                            variant="ghost"
                            size="sm"
                            title="Envoyer une notification"
                            onClick={() => {
                              setNotifyUser(user);
                              setIsNotifyOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                          >
                            <Bell className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={user.is_blocked ? 'outline' : 'destructive'}
                            size="sm"
                            onClick={() => toggleUserBlock(user.id, user.is_blocked)}
                            disabled={actionLoading === user.id}
                            className="h-8 px-3 text-[11px] font-medium"
                          >
                            {user.is_blocked ? (
                              <>
                                <UserCheck className="w-3 h-3 mr-1.5" />
                                Débloquer
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3 mr-1.5" />
                                Bloquer
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUser(user.id)}
                            disabled={actionLoading === user.id + '_delete'}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Notification Dialog */}
      <Dialog open={isNotifyOpen} onOpenChange={setIsNotifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Envoyer une Notification
            </DialogTitle>
            <DialogDescription>
              Le message sera envoyé directement au citoyen **{notifyUser?.name}**.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre</label>
              <Input 
                placeholder="Ex: Mise à jour de votre compte" 
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea 
                placeholder="Écrivez votre message ici..." 
                className="min-h-[100px]"
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotifyOpen(false)}>Annuler</Button>
            <Button 
              onClick={handleSendNotification} 
              disabled={notifyLoading || !notifyTitle || !notifyMessage}
              className="gap-2"
            >
              <Send className={`w-4 h-4 ${notifyLoading ? 'animate-spin' : ''}`} />
              Envoyer maintenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
