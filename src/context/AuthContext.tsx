import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DemoUser, UserRole } from '@/data/users';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: DemoUser | null;
  login: (user: DemoUser) => Promise<void>;
  logout: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  signUpWithCredentials: (
    email: string, 
    password: string, 
    fullName: string, 
    role: UserRole, 
    extra?: { number?: number; position?: string }
  ) => Promise<void>;
  isLoggingIn: boolean;
  loginMessage: string;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'dt': return 'Director Técnico';
    case 'pf': return 'Prep. Físico';
    case 'nutri': return 'Nutricionista';
    default: return 'Jugador';
  }
};

const getRoleEmoji = (role: string) => {
  switch (role) {
    case 'dt': return '📋';
    case 'pf': return '🏃';
    case 'nutri': return '🍎';
    default: return '⚽';
  }
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string, email: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('hayequipo_profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        const mappedUser: DemoUser = {
          id: profile.id,
          supabaseId: profile.id,
          name: profile.full_name,
          email: profile.email || email,
          role: profile.role as UserRole,
          roleLabel: getRoleLabel(profile.role),
          initials: getInitials(profile.full_name),
          color: profile.avatar_url || '#10B981',
          emoji: getRoleEmoji(profile.role),
          playerId: profile.role === 'jugador' ? profile.id : undefined
        };
        setUser(mappedUser);
        localStorage.setItem('hay_equipo_user', JSON.stringify(mappedUser));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('hay_equipo_user');
    if (saved) {
      setUser(JSON.parse(saved));
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email || '');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email || '');
      } else {
        const savedUser = localStorage.getItem('hay_equipo_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          const demoIds = [
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333',
            '44444444-4444-4444-4444-444444444444'
          ];
          if (demoIds.includes(parsed.id)) {
            return;
          }
        }
        setUser(null);
        localStorage.removeItem('hay_equipo_user');
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (u: DemoUser) => {
    setIsLoggingIn(true);
    setLoginMessage(`Sincronizando con equipo...`);
    await new Promise(r => setTimeout(r, 600));
    setUser(u);
    localStorage.setItem('hay_equipo_user', JSON.stringify(u));
    setIsLoggingIn(false);
    setLoginMessage('');
  }, []);

  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    setIsLoggingIn(true);
    setLoginMessage('Validando credenciales...');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('No se pudo iniciar sesión.');

      await fetchUserProfile(data.user.id, data.user.email || '');
    } catch (err: any) {
      console.error('Error logging in:', err);
      throw err;
    } finally {
      setIsLoggingIn(false);
      setLoginMessage('');
    }
  }, []);

  const signUpWithCredentials = useCallback(async (email: string, password: string, fullName: string, role: UserRole, extra?: { number?: number; position?: string }) => {
    setIsLoggingIn(true);
    setLoginMessage('Registrando nueva cuenta...');
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No se pudo registrar el usuario.');

      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
      
      const { error: profileError } = await supabase
        .from('hayequipo_profiles')
        .insert({
          id: data.user.id,
          team_id: 'e0d3e922-9070-4754-a53d-47c5417f65d2',
          full_name: fullName,
          email: email,
          role: role,
          number: extra?.number || null,
          position: extra?.position || null,
          avatar_url: randomColor,
          health_status: role === 'jugador' ? 'disponible' : null
        });

      if (profileError) throw profileError;

      await loginWithCredentials(email, password);
    } catch (err: any) {
      console.error('Error signing up:', err);
      throw err;
    } finally {
      setIsLoggingIn(false);
      setLoginMessage('');
    }
  }, [loginWithCredentials]);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem('hay_equipo_user');
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loginWithCredentials,
      signUpWithCredentials,
      isLoggingIn, 
      loginMessage,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
