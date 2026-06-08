'use client'

import { useEffect, useState } from 'react'
import { Button, Skeleton } from 'antd'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import type { Notification } from '@/types'

const TYPE_CONFIG = {
  due_soon:  { emoji: '⏰', color: '#FFD166', bg: '#FFF9E6' },
  overdue:   { emoji: '🚨', color: '#FF6B6B', bg: '#FFF0F0' },
  info:      { emoji: '💜', color: '#9B59B6', bg: '#F5F0FF' },
  success:   { emoji: '✅', color: '#4CAF82', bg: '#E8F7EF' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data ?? [])
    setLoading(false)
  }

  async function markAllRead() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    load()
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unread = notifications.filter(n => !n.is_read)

  return (
    <div className="page-enter">
      <PageHeader
        title="Notificações"
        subtitle={unread.length > 0 ? `${unread.length} não lida${unread.length > 1 ? 's' : ''}` : 'Tudo em dia!'}
        rightAction={
          unread.length > 0 ? (
            <Button type="text" icon={<CheckCheck size={16} />} onClick={markAllRead} style={{ color: '#FF6B9D' }}>
              Marcar todas
            </Button>
          ) : undefined
        }
      />

      <div className="px-4 py-2 flex flex-col gap-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #FFE8F1' }}>
              <Skeleton active avatar paragraph={{ rows: 1 }} />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BellOff size={40} style={{ color: '#C4A0B0', marginBottom: 12 }} />
            <p className="font-semibold text-sm" style={{ color: '#3d1a2e' }}>Nenhuma notificação</p>
            <p className="text-xs mt-1" style={{ color: '#8B6B7A' }}>Você está em dia com tudo! 🎀</p>
          </div>
        ) : (
          notifications.map(notif => {
            const config = TYPE_CONFIG[notif.type]
            return (
              <button
                key={notif.id}
                onClick={() => markRead(notif.id)}
                className="rounded-2xl p-4 flex items-start gap-3 text-left w-full hk-card-hover"
                style={{
                  background: notif.is_read ? '#FFFFFF' : config.bg,
                  border: `1px solid ${notif.is_read ? '#FFE8F1' : config.color + '40'}`,
                  cursor: 'pointer',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: config.color + '20' }}
                >
                  {config.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm" style={{ color: '#3d1a2e' }}>{notif.title}</p>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#FF6B9D' }} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#8B6B7A' }}>{notif.message}</p>
                  <p className="text-xs mt-1" style={{ color: '#C4A0B0' }}>
                    {new Date(notif.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
