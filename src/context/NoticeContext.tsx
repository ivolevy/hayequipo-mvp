import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Notice {
  id: string;
  title: string;
  message: string;
  date: string;
  authorRole: string;
  type?: 'standard' | 'convocatoria';
}

interface NoticeContextType {
  notices: Notice[];
  loading: boolean;
  addNotice: (title: string, message: string, authorRole: string, type?: 'standard' | 'convocatoria') => Promise<void>;
  editNotice: (id: string, title: string, message: string) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;
  refreshNotices: () => Promise<void>;
}

const NoticeContext = createContext<NoticeContextType | null>(null);

const initialNotices: Notice[] = [
  {
    id: 'notice-1',
    title: 'Cambio de cancha',
    message: 'Chicos, el partido del sábado se juega en la cancha 3 de césped sintético. Lleven el calzado adecuado.',
    date: new Date().toISOString(),
    authorRole: 'dt',
    type: 'standard',
  }
];

export const NoticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('hayequipo_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedNotices: Notice[] = (data || []).map(n => ({
        id: n.id,
        title: n.title,
        message: n.content,
        date: n.created_at,
        authorRole: n.target_role || 'staff',
        type: (n.type as 'standard' | 'convocatoria') || 'standard',
      }));

      setNotices([...mappedNotices, ...initialNotices]);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();

    const channel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hayequipo_announcements' },
        () => {
          fetchNotices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotices]);

  const addNotice = useCallback(async (title: string, message: string, authorRole: string, type: 'standard' | 'convocatoria' = 'standard') => {
    try {
      const { error } = await supabase
        .from('hayequipo_announcements')
        .insert({
          title,
          content: message,
          target_role: authorRole,
          type,
          created_by: user?.supabaseId || null,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      await fetchNotices();
    } catch (error) {
      console.error('Error adding notice:', error);
      throw error;
    }
  }, [user, fetchNotices]);

  const editNotice = useCallback(async (id: string, title: string, message: string) => {
    if (id.startsWith('notice-')) {
      setNotices(prev => prev.map(n => n.id === id ? { ...n, title, message } : n));
      return;
    }

    try {
      const { error } = await supabase
        .from('hayequipo_announcements')
        .update({
          title,
          content: message,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchNotices();
    } catch (error) {
      console.error('Error editing notice:', error);
      throw error;
    }
  }, [fetchNotices]);

  const deleteNotice = useCallback(async (id: string) => {
    if (id.startsWith('notice-')) {
      setNotices(prev => prev.filter(n => n.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from('hayequipo_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchNotices();
    } catch (error) {
      console.error('Error deleting notice:', error);
      throw error;
    }
  }, [fetchNotices]);

  return (
    <NoticeContext.Provider value={{ 
      notices, 
      loading,
      addNotice, 
      editNotice, 
      deleteNotice,
      refreshNotices: fetchNotices
    }}>
      {children}
    </NoticeContext.Provider>
  );
};

export const useNotices = () => {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error('useNotices must be used within NoticeProvider');
  return ctx;
};
