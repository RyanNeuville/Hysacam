'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Leaf, 
  Trash2, 
  Star, 
  MapPin, 
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface UserProfileModalProps {
  userId: string
  userName: string
  userEmail: string
  isOpen: boolean
  onClose: () => void
}

interface UserStats {
  totalReports: number
  resolvedReports: number
  ecoPoints: number
  totalWasteKg: number
}

interface UserReport {
  id: string
  title: string | null
  typeInsalubrite: string
  statut: string
  created_at: string
}

export function UserProfileModal({
  userId,
  userName,
  userEmail,
  isOpen,
  onClose,
}: UserProfileModalProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentReports, setRecentReports] = useState<UserReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !userId) return

    const fetchUserData = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        
        // Fetch All Reports for this user
        const { data: reports, error } = await supabase
          .from('reports')
          .select('id, title, typeInsalubrite, statut, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (!error && reports) {
          const total = reports.length
          const resolved = reports.filter(r => r.statut === 'Résolu').length
          
          // Logic aligned with Flutter: Points = Total * 50, CO2 = Resolved * 2
          setStats({
            totalReports: total,
            resolvedReports: resolved,
            ecoPoints: total * 50,
            totalWasteKg: resolved * 2,
          })
          
          setRecentReports(reports.slice(0, 5))
        }
      } catch (err) {
        console.error('Error fetching user profile stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [isOpen, userId])

  const getRank = (points: number) => {
    if (points >= 1000) return { label: 'Ambassadeur Hysacam', color: 'bg-purple-500' }
    if (points >= 500) return { label: 'Champion Écologique', color: 'bg-blue-500' }
    if (points >= 200) return { label: 'Citoyen Actif', color: 'bg-green-600' }
    return { label: 'Gardien Novice', color: 'bg-yellow-500' }
  }

  const rank = stats ? getRank(stats.ecoPoints) : { label: 'Calcul...', color: 'bg-gray-400' }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        {/* Simple Header with Solid Background */}
        <div className="bg-yellow-400 p-8 text-slate-900">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center border-2 border-slate-900/10 shadow-sm">
               <span className="text-3xl font-black text-yellow-600">{userName[0]?.toUpperCase()}</span>
            </div>
            <div>
              <DialogTitle className="text-2xl font-black">{userName}</DialogTitle>
              <DialogDescription className="text-slate-700 font-medium">{userEmail}</DialogDescription>
              <Badge className={`mt-2 ${rank.color} border-none text-white font-bold`}>
                {rank.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6 bg-background space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none bg-green-50 dark:bg-green-950/20 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-2">
                  <Star className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-black text-green-700 dark:text-green-400">
                  {loading ? '...' : stats?.ecoPoints}
                </p>
                <p className="text-[10px] font-bold text-green-600/70 uppercase">Éco-Points</p>
              </CardContent>
            </Card>

            <Card className="border-none bg-blue-50 dark:bg-blue-950/20 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2">
                  <Leaf className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
                   ~{loading ? '...' : stats?.totalWasteKg}<span className="text-sm">kg</span>
                </p>
                <p className="text-[10px] font-bold text-blue-600/70 uppercase">Impact CO2</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Info */}
          <div className="flex justify-around py-4 border-y border-border">
            <div className="text-center">
              <p className="text-xl font-bold">{loading ? '-' : stats?.totalReports}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter text-center">Signalements</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">{loading ? '-' : stats?.resolvedReports}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter text-center">Résolus</p>
            </div>
          </div>

          {/* Recent Reports List */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-primary" />
              Dernières Contributions
            </h4>
            
            <ScrollArea className="h-[180px] pr-4">
              {loading ? (
                 <p className="text-center py-8 text-sm text-muted-foreground italic">Chargement des données...</p>
              ) : recentReports.length === 0 ? (
                 <p className="text-center py-8 text-sm text-muted-foreground italic">Aucun signalement effectué à ce jour.</p>
              ) : (
                <div className="space-y-2">
                  {recentReports.map((report) => (
                    <div key={report.id} className="p-3 rounded-xl border bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background border flex items-center justify-center">
                           {report.statut === 'Résolu' ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <AlertCircle className="w-3 h-3 text-yellow-500" />}
                        </div>
                        <div>
                           <p className="text-[11px] font-bold leading-none mb-1">{report.title || report.typeInsalubrite}</p>
                           <p className="text-[9px] text-muted-foreground">{new Date(report.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[8px] h-4">
                        {report.statut}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
