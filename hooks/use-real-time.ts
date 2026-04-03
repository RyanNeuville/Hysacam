import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export function useRealTime<T = any>(
  table: string,
  options?: {
    event?: ChangeEvent
    onInsert?: (data: T) => void
    onUpdate?: (data: T) => void
    onDelete?: (data: T) => void
    filter?: string
  }
) {
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel | null = null

    const subscribe = async () => {
      channel = supabase
        .channel(`${table}_changes`)
        .on(
          'postgres_changes',
          {
            event: options?.event || '*',
            schema: 'public',
            table: table,
            filter: options?.filter,
          },
          (payload: any) => {
            if (payload.eventType === 'INSERT' && options?.onInsert) {
              options.onInsert(payload.new as T)
            } else if (payload.eventType === 'UPDATE' && options?.onUpdate) {
              options.onUpdate(payload.new as T)
            } else if (payload.eventType === 'DELETE' && options?.onDelete) {
              options.onDelete(payload.old as T)
            }
          }
        )
        .subscribe((status) => {
          setIsSubscribed(status === 'SUBSCRIBED')
        })
    }

    subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [table, options])

  return { isSubscribed }
}
