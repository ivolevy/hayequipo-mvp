import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

// Helper function to show native OS/mobile notifications using Service Workers or Fallbacks
export const showSystemNotification = (title: string, options?: NotificationOptions) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const defaultOptions: NotificationOptions = {
    icon: '/logopwa.png',
    badge: '/logopwa.png',
    vibrate: [200, 100, 200],
  };

  const finalOptions = { ...defaultOptions, ...options };

  // Try to use Service Worker registration (required for background / lock screen on mobile)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.showNotification(title, finalOptions);
      })
      .catch(() => {
        // Fallback to standard Notification constructor (for desktop if SW is not ready)
        try {
          new Notification(title, finalOptions);
        } catch (e) {
          console.error('Failed to show standard notification fallback:', e);
        }
      });
  } else {
    try {
      new Notification(title, finalOptions);
    } catch (e) {
      console.error('Failed to show standard notification:', e);
    }
  }
};

// VAPID Public Key generated for PWA Push notifications
const PUBLIC_VAPID_KEY = 'BK3l5bBpfj25jrmqizzbbf6zRl51Q5PuYeJR2buxQFOlJDlTVhzbAY3dmW_mjde_FnYvEHKXVeTVVXfUIuSTeH0';

// Helper to convert VAPID public key base64 to Uint8Array
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const subscribeUserToPush = async (supabaseUserId: string) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported in this browser');
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe user
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
    });

    const subJson = subscription.toJSON();
    if (subJson.endpoint && subJson.keys?.auth && subJson.keys?.p256dh) {
      // Save/sync device token in Supabase
      const { error } = await supabase
        .from('hayequipo_push_subscriptions')
        .upsert({
          profile_id: supabaseUserId,
          endpoint: subJson.endpoint,
          auth: subJson.keys.auth,
          p256dh: subJson.keys.p256dh,
          user_agent: navigator.userAgent
        }, { onConflict: 'endpoint' });

      if (error) throw error;
      console.log('Successfully synced PWA push subscription with Supabase');
    }
  } catch (err) {
    console.error('Failed to subscribe user to PWA push notifications:', err);
  }
};

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        showSystemNotification('¡Notificaciones Activas! ⚽', {
          body: 'Ya podés recibir alertas de partidos y avisos en tu pantalla.',
        });
        if (user?.supabaseId) {
          subscribeUserToPush(user.supabaseId);
        }
      }
      return result;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }, [user]);

  useEffect(() => {
    if (!user?.activeTeamId || permission !== 'granted') return;

    if (user?.supabaseId) {
      subscribeUserToPush(user.supabaseId);
    }

    // 1. Subscribe to new matches on the active team
    const matchChannel = supabase
      .channel(`realtime-matches-${user.activeTeamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hayequipo_matches',
          filter: `team_id=eq.${user.activeTeamId}`,
        },
        (payload) => {
          const newMatch = payload.new;
          showSystemNotification('¡Nuevo Partido Programado! 📋', {
            body: `Jugamos contra ${newMatch.rival || 'rival desconocido'} el ${newMatch.date ? new Date(newMatch.date).toLocaleDateString() : 'fecha a confirmar'} en ${newMatch.venue || 'sede a confirmar'}.`,
            tag: `match-${newMatch.id}`,
          });
        }
      )
      .subscribe();

    // 2. Subscribe to new notices/announcements on the active team
    const noticeChannel = supabase
      .channel(`realtime-notices-${user.activeTeamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hayequipo_announcements',
          filter: `team_id=eq.${user.activeTeamId}`,
        },
        (payload) => {
          const newNotice = payload.new;
          showSystemNotification('¡Nuevo Anuncio del Club! 📢', {
            body: `${newNotice.title || 'Aviso importante'}: ${newNotice.content || 'Revisá la app para ver más detalles.'}`,
            tag: `notice-${newNotice.id}`,
          });
        }
      )
      .subscribe();

    // 3. Subscribe to squad/membership changes for the logged-in user
    const membershipChannel = supabase
      .channel(`realtime-memberships-${user.supabaseId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'hayequipo_memberships',
          filter: `profile_id=eq.${user.supabaseId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            showSystemNotification('Perfil Actualizado ⚽', {
              body: `Tus datos en el club fueron modificados (Rol: ${updated.role === 'jugador' ? 'Jugador' : 'Cuerpo Técnico'}).`,
              tag: `membership-${updated.team_id}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(noticeChannel);
      supabase.removeChannel(membershipChannel);
    };
  }, [user?.activeTeamId, user?.supabaseId, permission]);

  return {
    permission,
    needsPermission: permission === 'default',
    requestPermission,
  };
};
