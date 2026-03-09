import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Notification {
  type: 'new_report' | 'report_updated' | 'comment_added' | 'user_joined'
  title: string
  message: string
  data?: any
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to new reports
    const reportChannel = supabase
      .channel('reports_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
        },
        (payload) => {
          const notification: Notification = {
            type: 'new_report',
            title: 'New Report Submitted',
            message: `${payload.new.title} - ${payload.new.location}`,
            data: payload.new,
          }
          setNotifications((prev) => [notification, ...prev])
          toast.info('New Report', {
            description: `${payload.new.title} reported in ${payload.new.location}`,
          })
        }
      )
      .subscribe()

    // Subscribe to report updates
    const updateChannel = supabase
      .channel('reports_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reports',
        },
        (payload) => {
          const notification: Notification = {
            type: 'report_updated',
            title: 'Report Status Updated',
            message: `${payload.new.title} is now ${payload.new.status}`,
            data: payload.new,
          }
          setNotifications((prev) => [notification, ...prev])
          toast.success('Report Updated', {
            description: `${payload.new.title} is now ${payload.new.status}`,
          })
        }
      )
      .subscribe()

    // Subscribe to new comments
    const commentChannel = supabase
      .channel('comments_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          const notification: Notification = {
            type: 'comment_added',
            title: 'New Comment',
            message: 'A new comment has been added to a report',
            data: payload.new,
          }
          setNotifications((prev) => [notification, ...prev])
          toast.message('New Comment', {
            description: 'A comment has been added',
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(reportChannel)
      supabase.removeChannel(updateChannel)
      supabase.removeChannel(commentChannel)
    }
  }, [])

  return { notifications }
}
