import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DemoUser, UserRole } from '@/data/users';

export interface TeamMembership {
  team_id: string;
  team_name: string;
  invite_code: string;
  role: UserRole;
  number?: number;
  position?: string;
}

interface AuthContextType {
  user: (DemoUser & { activeTeamId?: string; activeTeamName?: string; inviteCode?: string }) | null;
  login: (user: DemoUser) => Promise<void>;
  logout: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  signUpWithCredentials: (
    email: string, 
    password: string, 
    fullName: string, 
    role: UserRole, 
    extra?: { number?: number; position?: string }
  ) => Promise<{ sessionRequired: boolean }>;
  verifyOtpForSignUp: (
    email: string,
    token: string,
    fullName: string,
    role: UserRole,
    extra?: { number?: number; position?: string }
  ) => Promise<void>;
  isLoggingIn: boolean;
  loginMessage: string;
  loading: boolean;
  memberships: TeamMembership[];
  activeTeamId: string | null;
  selectTeam: (teamId: string) => void;
  switchTeam: () => void;
  createTeam: (teamName: string) => Promise<string>;
  joinTeam: (inviteCode: string) => Promise<string>;
  refreshMemberships: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'dt': return 'Director Técnico';
    case 'pf': return 'Prep. Físico';
    case 'nutri': return 'Nutricionista';
    case 'admin': return 'Administrador';
    default: return 'Jugador';
  }
};

const getRoleEmoji = (role: string) => {
  switch (role) {
    case 'dt': return '📋';
    case 'pf': return '🏃';
    case 'nutri': return '🍎';
    case 'admin': return '👑';
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
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  const fetchUserProfile = async (uid: string, email: string, selectedTeamIdOverride?: string | null) => {
    try {
      // 1. Fetch user base details
      const { data: profile, error } = await supabase
        .from('hayequipo_profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        // 2. Fetch memberships for this user
        const { data: mems, error: memsError } = await supabase
          .from('hayequipo_memberships')
          .select('*, hayequipo_teams(name, invite_code)')
          .eq('profile_id', uid);

        if (memsError) throw memsError;

        const formattedMems: TeamMembership[] = (mems || []).map(m => ({
          team_id: m.team_id,
          team_name: m.hayequipo_teams?.name || 'Equipo sin nombre',
          invite_code: m.hayequipo_teams?.invite_code || '',
          role: m.role as UserRole,
          number: m.number || undefined,
          position: m.position || undefined,
        }));

        setMemberships(formattedMems);

        // 3. Determine active team
        let targetTeamId = selectedTeamIdOverride !== undefined ? selectedTeamIdOverride : activeTeamId;
        
        if (!targetTeamId) {
          const savedActive = localStorage.getItem('hay_equipo_active_team_id');
          if (savedActive && formattedMems.some(m => m.team_id === savedActive)) {
            targetTeamId = savedActive;
          } else if (formattedMems.length === 1) {
            targetTeamId = formattedMems[0].team_id;
          }
        }

        if (targetTeamId && formattedMems.some(m => m.team_id === targetTeamId)) {
          const activeMem = formattedMems.find(m => m.team_id === targetTeamId)!;
          setActiveTeamId(targetTeamId);
          localStorage.setItem('hay_equipo_active_team_id', targetTeamId);

          const mappedUser: DemoUser & { activeTeamId?: string; activeTeamName?: string; inviteCode?: string } = {
            id: profile.id,
            supabaseId: profile.id,
            name: profile.full_name,
            email: profile.email || email,
            role: activeMem.role,
            roleLabel: getRoleLabel(activeMem.role),
            initials: getInitials(profile.full_name),
            color: profile.avatar_url || '#10B981',
            emoji: getRoleEmoji(activeMem.role),
            playerId: activeMem.role === 'jugador' ? profile.id : undefined,
            activeTeamId: targetTeamId,
            activeTeamName: activeMem.team_name,
            inviteCode: activeMem.invite_code,
          };
          setUser(mappedUser);
          localStorage.setItem('hay_equipo_user', JSON.stringify(mappedUser));
        } else {
          // Logged in but no team selected yet
          setActiveTeamId(null);
          localStorage.removeItem('hay_equipo_active_team_id');

          const mappedUser: DemoUser & { activeTeamId?: string; activeTeamName?: string; inviteCode?: string } = {
            id: profile.id,
            supabaseId: profile.id,
            name: profile.full_name,
            email: profile.email || email,
            role: 'jugador', // placeholder role
            roleLabel: 'Usuario',
            initials: getInitials(profile.full_name),
            color: profile.avatar_url || '#10B981',
            emoji: '⚽',
          };
          setUser(mappedUser);
          localStorage.setItem('hay_equipo_user', JSON.stringify(mappedUser));
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshMemberships = useCallback(async () => {
    if (user?.supabaseId) {
      await fetchUserProfile(user.supabaseId, user.email || '');
    }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('hay_equipo_user');
    const savedActive = localStorage.getItem('hay_equipo_active_team_id');
    
    if (savedActive) {
      setActiveTeamId(savedActive);
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      
      // If we are not a demo user, refresh memberships
      const demoIds = [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444'
      ];
      if (!demoIds.includes(parsed.id)) {
        fetchUserProfile(parsed.id, parsed.email || '');
      } else {
        setLoading(false);
      }
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
        setMemberships([]);
        setActiveTeamId(null);
        localStorage.removeItem('hay_equipo_user');
        localStorage.removeItem('hay_equipo_active_team_id');
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

    // Hardcode membership for demo users so they work out of the box
    const demoTeamId = 'e0d3e922-9070-4754-a53d-47c5417f65d2';
    const mappedUser = {
      ...u,
      activeTeamId: demoTeamId,
      activeTeamName: 'Hay Equipo FC',
      inviteCode: 'HAY123'
    };

    setUser(mappedUser);
    setActiveTeamId(demoTeamId);
    setMemberships([{
      team_id: demoTeamId,
      team_name: 'Hay Equipo FC',
      invite_code: 'HAY123',
      role: u.role
    }]);

    localStorage.setItem('hay_equipo_user', JSON.stringify(mappedUser));
    localStorage.setItem('hay_equipo_active_team_id', demoTeamId);
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

  const signUpWithCredentials = useCallback(async (
    email: string, 
    password: string, 
    fullName: string, 
    role: UserRole, 
    extra?: { number?: number; position?: string }
  ): Promise<{ sessionRequired: boolean }> => {
    setIsLoggingIn(true);
    setLoginMessage('Registrando nueva cuenta...');
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No se pudo registrar el usuario.');

      // Check if session is established (email confirmation is disabled)
      if (data.session) {
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        const { error: profileError } = await supabase
          .from('hayequipo_profiles')
          .insert({
            id: data.user.id,
            team_id: null, // do not link a default team directly
            full_name: fullName,
            email: email,
            role: role,
            number: extra?.number || null,
            position: extra?.position || null,
            avatar_url: randomColor,
            health_status: role === 'jugador' ? 'disponible' : null
          });

        if (profileError) throw profileError;
        await fetchUserProfile(data.user.id, email);
        return { sessionRequired: false };
      }

      // If no session is returned, email confirmation/OTP is required
      return { sessionRequired: true };
    } catch (err: any) {
      console.error('Error signing up:', err);
      throw err;
    } finally {
      setIsLoggingIn(false);
      setLoginMessage('');
    }
  }, []);

  const verifyOtpForSignUp = useCallback(async (
    email: string,
    token: string,
    fullName: string,
    role: UserRole,
    extra?: { number?: number; position?: string }
  ) => {
    setIsLoggingIn(true);
    setLoginMessage('Verificando código de seguridad...');
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });

      if (error) throw error;
      if (!data.user) throw new Error('No se pudo verificar el código.');

      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
      
      const { error: profileError } = await supabase
        .from('hayequipo_profiles')
        .insert({
          id: data.user.id,
          team_id: null,
          full_name: fullName,
          email: email,
          role: role,
          number: extra?.number || null,
          position: extra?.position || null,
          avatar_url: randomColor,
          health_status: role === 'jugador' ? 'disponible' : null
        });

      if (profileError && !profileError.message.includes('duplicate key value')) {
        throw profileError;
      }

      await fetchUserProfile(data.user.id, email);
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      throw err;
    } finally {
      setIsLoggingIn(false);
      setLoginMessage('');
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setMemberships([]);
    setActiveTeamId(null);
    localStorage.removeItem('hay_equipo_user');
    localStorage.removeItem('hay_equipo_active_team_id');
    await supabase.auth.signOut();
  }, []);

  const selectTeam = useCallback((teamId: string) => {
    if (user?.supabaseId) {
      fetchUserProfile(user.supabaseId, user.email || '', teamId);
    }
  }, [user]);

  const switchTeam = useCallback(() => {
    setActiveTeamId(null);
    localStorage.removeItem('hay_equipo_active_team_id');
    if (user) {
      const mappedUser = {
        ...user,
        activeTeamId: undefined,
        activeTeamName: undefined,
        inviteCode: undefined,
        role: 'jugador' as UserRole,
        roleLabel: 'Usuario',
        emoji: '⚽'
      };
      setUser(mappedUser);
      localStorage.setItem('hay_equipo_user', JSON.stringify(mappedUser));
    }
  }, [user]);

  const createTeam = useCallback(async (teamName: string): Promise<string> => {
    if (!user?.supabaseId) throw new Error('Usuario no autenticado');

    // Generate random 6-character uppercase alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      // 1. Create team
      const { data: newTeam, error: teamError } = await supabase
        .from('hayequipo_teams')
        .insert({
          name: teamName,
          invite_code: code
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // 2. Create admin/dt membership for creator
      const { error: memError } = await supabase
        .from('hayequipo_memberships')
        .insert({
          profile_id: user.supabaseId,
          team_id: newTeam.id,
          role: 'dt' // Creator is the DT/Admin
        });

      if (memError) throw memError;

      // 3. Refresh profile and select team
      await fetchUserProfile(user.supabaseId, user.email || '', newTeam.id);

      return code;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }, [user]);

  const joinTeam = useCallback(async (inviteCode: string): Promise<string> => {
    if (!user?.supabaseId) throw new Error('Usuario no autenticado');

    try {
      // 1. Find team
      const { data: team, error: teamError } = await supabase
        .from('hayequipo_teams')
        .select('id, name')
        .eq('invite_code', inviteCode.toUpperCase().trim())
        .maybeSingle();

      if (teamError) throw teamError;
      if (!team) throw new Error('Código de invitación inválido');

      // 2. Create membership using the user's global profile role
      const defaultRole = user?.role || 'jugador';
      const { error: memError } = await supabase
        .from('hayequipo_memberships')
        .insert({
          profile_id: user.supabaseId,
          team_id: team.id,
          role: defaultRole
        });

      if (memError && !memError.message.includes('unique_violation') && !memError.message.includes('already exists')) {
        throw memError;
      }

      // 3. Refresh profile and select team
      await fetchUserProfile(user.supabaseId, user.email || '', team.id);

      return team.name;
    } catch (error) {
      console.error('Error joining team:', error);
      throw error;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loginWithCredentials,
      signUpWithCredentials,
      verifyOtpForSignUp,
      isLoggingIn, 
      loginMessage,
      loading,
      memberships,
      activeTeamId,
      selectTeam,
      switchTeam,
      createTeam,
      joinTeam,
      refreshMemberships
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
