'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, ShieldCheck, Ban } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface User {
  id: string
  email: string
  role: 'admin' | 'citizen'
  status: 'active' | 'blocked'
  created_at: string
  is_admin?: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setUsers((data as User[]) || [])
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()

    // Subscribe to real-time updates
    const supabase = createClient()
    const subscription = supabase
      .channel('profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchUsers()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const filteredUsers = users.filter(
    (user) => user.email.toLowerCase().includes(search.toLowerCase())
  )

  const toggleUserBlock = async (userId: string, currentStatus: string) => {
    try {
      const supabase = createClient()
      const newStatus = currentStatus === 'active' ? 'blocked' : 'active'
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId)

      if (error) throw error
      
      setUsers(users.map((u) => u.id === userId ? { ...u, status: newStatus as any } : u))
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Utilisateurs</h1>
        {/* version francaise */}
        <p className="text-muted-foreground">Gérer les comptes admin et citoyen</p>
      </div>

      {/* Search */}
      <Input
        placeholder="Rechercher par email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Users Table */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Comptes utilisateurs</CardTitle>
          <CardDescription>
            {loading ? 'Chargement...' : `${filteredUsers.length} utilisateur${filteredUsers.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement des utilisateurs...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className="flex w-fit gap-1"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }
                        >
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={user.status === 'active' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => toggleUserBlock(user.id, user.status)}
                          className="flex items-center gap-2"
                        >
                          {user.status === 'active' ? (
                            <>
                              <Ban className="w-4 h-4" />
                              <span>Block</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Unblock</span>
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
