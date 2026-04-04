'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'citizen' | 'Autorité' | 'Citoyen' | string
  statut: 'actif' | 'bloqué' | string
  created_at: string
  nom?: string
  full_name?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'citizen'>('all')
  const [statutFilter, setStatutFilter] = useState<'all' | 'actif' | 'bloqué'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
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
      .channel('profiles_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [])

  const filteredUsers = users.filter((user) => {
    const userName = user.nom || user.full_name || '';
    const matchSearch =
      (user.email || '').toLowerCase().includes(search.toLowerCase()) ||
      userName.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || user.role === roleFilter
    const matchStatut = statutFilter === 'all' || user.statut === statutFilter
    return matchSearch && matchRole && matchStatut
  })

  const toggleUserStatut = async (userId: string, currentStatut: string) => {
    setActionLoading(userId)
    try {
      const supabase = createClient()
      const newStatut = currentStatut === 'actif' ? 'bloqué' : 'actif'
      const { error } = await supabase
        .from('profiles')
        .update({ statut: newStatut })
        .eq('id', userId)

      if (error) throw error
      setUsers(users.map((u) => u.id === userId ? { ...u, statut: newStatut } : u))
    } catch (error) {
      console.error('Error updating user statut:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const changeUserRole = async (userId: string, newRole: string) => {
    setActionLoading(userId + '_role')
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
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

  // Export CSV avec en-tête stylisée Hysacam
  const handleExportCSV = () => {
    const exportDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
    const exportTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    const csvRows = [
      // En-tête Hysacam
      [`HYSACAM - Rapport des Utilisateurs`],
      [`Généré le : ${exportDate} à ${exportTime}`],
      [`Plateforme : CityReport Admin Dashboard`],
      [`Nombre total d'utilisateurs exportés : ${filteredUsers.length}`],
      [],
      // En-têtes colonnes
      ['ID', 'Email', 'Nom Complet', 'Rôle', 'Statut', 'Date d\'inscription'],
      // Données
      ...filteredUsers.map((u) => [
        u.id,
        u.email || '-',
        u.nom || u.full_name || '-',
        u.role === 'admin' || u.role === 'Autorité' ? 'Administrateur' : u.role === 'citizen' || u.role === 'Citoyen' ? 'Citoyen' : u.role || '-',
        u.statut === 'actif' ? 'Actif' : u.statut === 'bloqué' ? 'Bloqué' : u.statut || '-',
        new Date(u.created_at).toLocaleDateString('fr-FR'),
      ]),
    ]

    const csvContent = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const bom = '\uFEFF' // UTF-8 BOM pour Excel
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hysacam_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Statistiques rapides
  const totalUsers = users.length
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'Autorité').length
  const citizenCount = users.filter((u) => u.role === 'citizen' || u.role === 'Citoyen').length
  const blockedCount = users.filter((u) => u.statut === 'bloqué').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Administrer les comptes admin et citoyens de la plateforme</p>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total utilisateurs', value: totalUsers, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Administrateurs', value: adminCount, icon: ShieldCheck, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { label: 'Citoyens', value: citizenCount, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Bloqués', value: blockedCount, icon: UserX, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((stat) => (
          <Card key={stat.label} className="border border-border">
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

      {/* Filtres */}
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
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Administrateur (Legacy)</SelectItem>
            <SelectItem value="Autorité">Autorité (HYSACAM)</SelectItem>
            <SelectItem value="citizen">Citoyen (Legacy)</SelectItem>
            <SelectItem value="Citoyen">Citoyen</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statutFilter} onValueChange={(v) => setStatutFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="actif">Actif</SelectItem>
            <SelectItem value="bloqué">Bloqué</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau utilisateurs */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Comptes utilisateurs</CardTitle>
          <CardDescription>
            {loading
              ? 'Chargement...'
              : `${filteredUsers.length} utilisateur${filteredUsers.length !== 1 ? 's' : ''} trouvé${filteredUsers.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableRow className="border-border">
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-sm">
                              {(user.nom || user.full_name || user.email || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            {(user.nom || user.full_name) && (
                              <p className="font-medium text-foreground text-sm">{user.nom || user.full_name}</p>
                            )}
                            <p className={`text-muted-foreground ${(user.nom || user.full_name) ? 'text-xs' : 'font-medium text-foreground text-sm'} flex items-center gap-1`}>
                              <Mail className="w-3 h-3" />
                              {user.email || 'Pas d\'email'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(v) => changeUserRole(user.id, v)}
                          disabled={actionLoading === user.id + '_role'}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-yellow-500" />
                                Administrateur
                              </div>
                            </SelectItem>
                            <SelectItem value="citizen">
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-3 h-3 text-green-500" />
                                Citoyen
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.statut === 'actif'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : user.statut === 'bloqué'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {user.statut === 'actif' ? '● Actif' : user.statut === 'bloqué' ? '● Bloqué' : user.statut || 'Inconnu'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={user.statut === 'actif' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => toggleUserStatut(user.id, user.statut)}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          {user.statut === 'actif' ? (
                            <>
                              <Ban className="w-3 h-3" />
                              Bloquer
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3 h-3" />
                              Débloquer
                            </>
                          )}
                        </Button>
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
  )
}
