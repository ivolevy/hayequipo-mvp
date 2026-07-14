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
  plan?: string;
}

interface AuthContextType {
  user: (DemoUser & { activeTeamId?: string; activeTeamName?: string; inviteCode?: string; activeTeamPlan?: string }) | null;
  login: (user: DemoUser, planOverride?: string) => Promise<void>;
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
  sendPasswordResetEmail: (email: string) => Promise<void>;
  resetPasswordWithOtp: (email: string, token: string, newPassword: string) => Promise<void>;
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

const sendWelcomeEmail = async (userName: string, userEmail: string) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (
    !serviceId || 
    !templateId || 
    !publicKey || 
    templateId.includes('your_template_id_here') || 
    publicKey.includes('your_public_key_here')
  ) {
    console.warn('EmailJS no está completamente configurado en las variables de entorno.');
    return;
  }

  // Validar que el email no esté vacío y tenga formato correcto
  if (!userEmail || !userEmail.includes('@')) {
    console.error('Intento de envío abortado: El email de destino es inválido o está vacío:', userEmail);
    return;
  }

  console.log('Intentando enviar correo de bienvenida a:', userEmail, 'para el usuario:', userName);

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          user_name: userName,
          user_email: userEmail,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS API error: ${response.status} - ${errorText}`);
    }
    console.log('Email de bienvenida enviado con éxito.');
  } catch (error) {
    console.error('Error al enviar el email de bienvenida:', error);
  }
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
      let { data: profile, error } = await supabase
        .from('hayequipo_profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error) throw error;

      // If no profile exists yet (first login after email link confirmation), create it
      if (!profile) {
        const { data: sessionData } = await supabase.auth.getSession();
        const fullName = sessionData.session?.user.user_metadata?.full_name || 'Nuevo Usuario';
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);

        const { data: newProfile, error: createError } = await supabase
          .from('hayequipo_profiles')
          .insert({
            id: uid,
            full_name: fullName,
            email: email,
            role: 'jugador',
            avatar_url: randomColor,
            health_status: 'disponible'
          })
          .select()
          .single();

        if (createError) throw createError;
        profile = newProfile;
      }

      if (profile) {
        // 2. Fetch memberships for this user
        const { data: mems, error: memsError } = await supabase
          .from('hayequipo_memberships')
          .select('*, hayequipo_teams(name, invite_code, plan)')
          .eq('profile_id', uid);

        if (memsError) throw memsError;

        const formattedMems: TeamMembership[] = (mems || []).map(m => {
          const teamInfo = Array.isArray(m.hayequipo_teams)
            ? m.hayequipo_teams[0]
            : m.hayequipo_teams;

          return {
            team_id: m.team_id,
            team_name: teamInfo?.name || 'Equipo sin nombre',
            invite_code: teamInfo?.invite_code || '',
            role: (m.role === 'admin' ? 'dt' : m.role) as UserRole,
            number: m.number || undefined,
            position: m.position || undefined,
            plan: teamInfo?.plan || 'free',
          };
        });

        setMemberships(formattedMems);

        // 3. Determine active team
        // Load the saved active team from localStorage if no override is specified
        const savedActiveTeamId = localStorage.getItem('hay_equipo_active_team_id');
        const targetTeamId = selectedTeamIdOverride !== undefined 
          ? selectedTeamIdOverride 
          : (savedActiveTeamId || (formattedMems.length > 0 ? formattedMems[0].team_id : null));

        if (targetTeamId && formattedMems.some(m => m.team_id === targetTeamId)) {
          const activeMem = formattedMems.find(m => m.team_id === targetTeamId)!;
          setActiveTeamId(targetTeamId);
          localStorage.setItem('hay_equipo_active_team_id', targetTeamId);

          const mappedUser: DemoUser & { activeTeamId?: string; activeTeamName?: string; inviteCode?: string; activeTeamPlan?: string } = {
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
            activeTeamPlan: activeMem.plan || 'free',
          };
          setUser(mappedUser);
          localStorage.setItem('hay_equipo_user', JSON.stringify(mappedUser));
        } else {
          // Logged in but no team selected yet
          setActiveTeamId(null);
          localStorage.removeItem('hay_equipo_active_team_id');

          const mappedUser: DemoUser & { activeTeamId?: string; activeTeamName?: string; inviteCode?: string; activeTeamPlan?: string } = {
            id: profile.id,
            supabaseId: profile.id,
            name: profile.full_name,
            email: profile.email || email,
            role: 'jugador', // placeholder role
            roleLabel: 'Usuario',
            initials: getInitials(profile.full_name),
            color: profile.avatar_url || '#10B981',
            emoji: '⚽',
            activeTeamPlan: 'free',
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

  const login = useCallback(async (u: DemoUser, planOverride?: string) => {
    setIsLoggingIn(true);
    setLoginMessage(`Sincronizando con equipo...`);
    await new Promise(r => setTimeout(r, 600));

    const demoIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444'
    ];

    if (!demoIds.includes(u.id)) {
      // Dynamic user: fetch their real memberships from the database
      await fetchUserProfile(u.id, u.email || '');
      setIsLoggingIn(false);
      setLoginMessage('');
      return;
    }

    // Hardcode membership for demo users so they work out of the box
    const demoTeamId = 'e0d3e922-9070-4754-a53d-47c5417f65d2';
    const targetPlan = planOverride || 'free';

    // Synchronize the team's plan in Supabase so the database is in sync
    try {
      await supabase
        .from('hayequipo_teams')
        .update({ plan: targetPlan })
        .eq('id', demoTeamId);
    } catch (e) {
      console.error('Error updating demo team plan during shortcut login:', e);
    }

    const mappedUser = {
      ...u,
      activeTeamId: demoTeamId,
      activeTeamName: 'Hay Equipo FC',
      inviteCode: 'HAY123',
      activeTeamPlan: targetPlan
    };

    setUser(mappedUser);
    setActiveTeamId(demoTeamId);
    setMemberships([{
      team_id: demoTeamId,
      team_name: 'Hay Equipo FC',
      invite_code: 'HAY123',
      role: u.role,
      plan: targetPlan
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
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('No se pudo registrar el usuario.');

      // Check if session is established (email confirmation is disabled)
      if (data.session) {
        await fetchUserProfile(data.user.id, email);
        // Send welcome email in background
        sendWelcomeEmail(fullName, email).catch(err => console.error("Error en welcome email:", err));
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
      // Send welcome email in background
      sendWelcomeEmail(fullName, email).catch(err => console.error("Error en welcome email:", err));
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      throw err;
    } finally {
      setIsLoggingIn(false);
      setLoginMessage('');
    }
  }, []);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    setIsLoggingIn(true);
    setLoginMessage('Enviando correo de recuperación...');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (err: any) {
      console.error('Error sending password reset email:', err);
      throw err;
    } finally {
      setIsLoggingIn(false);
      setLoginMessage('');
    }
  }, []);

  const resetPasswordWithOtp = useCallback(async (email: string, token: string, newPassword: string) => {
    setIsLoggingIn(true);
    setLoginMessage('Restableciendo contraseña...');
    try {
      // 1. Verify recovery OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery'
      });

      if (error) throw error;
      if (!data.user) throw new Error('No se pudo verificar el código de recuperación.');

      // 2. Update user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // 3. Fetch user profile to log them in successfully
      await fetchUserProfile(data.user.id, data.user.email || email);
    } catch (err: any) {
      console.error('Error resetting password with OTP:', err);
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
          role: 'dt' // Creator is the DT/Coach
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

      // 2. Create membership defaulting to 'jugador'
      const defaultRole = 'jugador';
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
      sendPasswordResetEmail,
      resetPasswordWithOtp,
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
