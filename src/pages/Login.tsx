import { useState, useEffect } from 'react';
import { demoUsers, DemoUser, UserRole } from '@/data/users';
import { useAuth } from '@/context/AuthContext';
import { Shield, User, Activity, Apple, ChevronRight, Loader2, Mail, Lock, Info, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  dt: Shield,
  pf: Activity,
  nutri: Apple,
  jugador: User,
  admin: Shield,
};


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

const Login = () => {
  const { 
    login, 
    loginWithCredentials, 
    signUpWithCredentials, 
    verifyOtpForSignUp, 
    isLoggingIn, 
    loginMessage 
  } = useAuth();
  
  // Navigation & authentication modes
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpToken, setOtpToken] = useState('');

  // Roster profiles loaded dynamically
  const [dbMembers, setDbMembers] = useState<DemoUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showRosterSelect, setShowRosterSelect] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  useEffect(() => {
    const fetchRoster = async () => {
      setLoadingMembers(true);
      try {
        const { data, error } = await supabase
          .from('hayequipo_profiles')
          .select('id, full_name, role, avatar_url, email')
          .order('full_name', { ascending: true });

        if (error) throw error;

        if (data) {
          const mapped: DemoUser[] = data.map(p => ({
            id: p.id,
            supabaseId: p.id,
            name: p.full_name,
            email: p.email,
            role: p.role as UserRole,
            roleLabel: getRoleLabel(p.role),
            initials: getInitials(p.full_name),
            color: p.avatar_url || '#10B981',
            emoji: getRoleEmoji(p.role),
            playerId: p.role === 'jugador' ? p.id : undefined
          }));
          
          // Exclude hardcoded demo users to avoid duplicate shortcuts
          const demoSupabaseIds = demoUsers.map(u => u.supabaseId);
          const filtered = mapped.filter(u => !demoSupabaseIds.includes(u.supabaseId));
          setDbMembers(filtered);
        }
      } catch (err) {
        console.error('Error fetching roster for login:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchRoster();
  }, []);

  const handleShortcutLogin = (user: DemoUser) => {
    if (isLoggingIn) return;
    login(user);
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Completá el email y contraseña');
      return;
    }
    try {
      await loginWithCredentials(email, password);
      toast.success('Sesión iniciada con éxito');
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar sesión');
    }
  };

  const handleFormSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error('Completá todos los campos obligatorios');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      const { sessionRequired } = await signUpWithCredentials(
        email,
        password,
        fullName,
        'jugador'
      );

      if (sessionRequired) {
        toast.info('Código de confirmación enviado a tu correo');
        setMode('verify');
      } else {
        toast.success('Registro completado con éxito');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al registrarse');
    }
  };

  const handleFormVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpToken.length !== 6) {
      toast.error('Ingresá el código de 6 dígitos');
      return;
    }
    try {
      await verifyOtpForSignUp(
        email,
        otpToken,
        fullName,
        'jugador'
      );
      toast.success('¡Email verificado! Cuenta creada correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al verificar el código');
    }
  };

  const handleResendCode = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      if (error) throw error;
      toast.success('Código de confirmación reenviado');
    } catch (err: any) {
      toast.error(err.message || 'Error al reenviar el código');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#FAFAFA] selection:bg-slate-900 selection:text-white">
      {isLoggingIn ? (
        <div className="animate-fade-in text-center space-y-8">
          <div className="relative">
             <div className="w-20 h-20 border-[3px] border-slate-100 rounded-[2rem] mx-auto flex items-center justify-center">
               <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
             </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-display text-slate-900 uppercase tracking-tight">{loginMessage}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sincronizando Datos</p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xl animate-fade-in space-y-10">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <h1 className="font-display text-3xl md:text-4xl tracking-tight text-slate-900 leading-none uppercase">
              HAY <span className="text-emerald-600">EQUIPO</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-custom mt-0.5">
              PLATAFORMA DE GESTIÓN DEPORTIVA
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 p-8 md:p-10 space-y-8">
            {/* Toggle Switch between Login and Register */}
            {mode !== 'verify' && (
              <div className="grid grid-cols-2 p-1 bg-slate-50 border border-slate-100/80 rounded-2xl relative">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`py-2.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300 rounded-xl ${
                    mode === 'login' 
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-100' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Ingresar
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`py-2.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300 rounded-xl ${
                    mode === 'register' 
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-100' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Crear Cuenta
                </button>
              </div>
            )}

            {/* Render Login Form */}
            {mode === 'login' && (
              <form onSubmit={handleFormLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3.5 text-xs outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/35 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3.5 text-xs outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/35 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 mt-2"
                >
                  <span>INGRESAR</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Render Register Form */}
            {mode === 'register' && (
              <form onSubmit={handleFormSignUp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: Lionel Messi"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3.5 text-xs outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/35 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3.5 text-xs outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/35 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3.5 text-xs outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/35 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 mt-4"
                >
                  <span>CREAR CUENTA</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Render OTP Verification Form */}
            {mode === 'verify' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 mx-auto flex items-center justify-center text-emerald-600">
                    <Mail className="w-5 h-5 animate-pulse" />
                  </div>
                  <h3 className="font-display text-lg tracking-tight text-slate-900 uppercase">
                    Verificá tu correo
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                    Enviamos un código de confirmación a <strong className="text-slate-600">{email}</strong>. Ingresalo para activar tu cuenta.
                  </p>
                </div>

                <form onSubmit={handleFormVerify} className="space-y-6">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <InputOTP
                      maxLength={6}
                      value={otpToken}
                      onChange={setOtpToken}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                    >
                      <span>ACTIVAR CUENTA</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="flex justify-between items-center px-1">
                      <button
                        type="button"
                        onClick={() => setMode('register')}
                        className="text-[9px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        VOLVER A REGISTRO
                      </button>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest"
                      >
                        REENVIAR CÓDIGO
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Demo Shortcuts and dynamic squad selector (only in login mode) */}
            {mode === 'login' && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-100" />
                  <h2 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] whitespace-nowrap flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-slate-300" />
                    Atajos rápidos de prueba
                  </h2>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                
                {/* Shortcut Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {demoUsers.map((user, i) => {
                    const Icon = roleIcons[user.role];
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleShortcutLogin(user)}
                        style={{ animationDelay: `${i * 100}ms` }}
                        className="premium-card p-3 text-left group hover:bg-emerald-600 border border-slate-100 hover:border-emerald-600 transition-all duration-300 flex items-center gap-3.5 bg-slate-50/50"
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:bg-white/20 transition-colors"
                          style={{ backgroundColor: user.color }}
                        >
                          <Icon className="w-4 h-4 text-white" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-xs text-slate-800 group-hover:text-white transition-colors uppercase tracking-tight truncate">{user.name}</div>
                          <div className="text-[7.5px] font-black text-slate-400 group-hover:text-emerald-100 uppercase tracking-widest mt-0.5 transition-colors">{user.roleLabel}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic selector for other roster members */}
                {dbMembers.length > 0 && (
                  <div className="pt-5 border-t border-slate-100/80 space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowRosterSelect(!showRosterSelect)}
                      className="w-full flex items-center justify-between py-1 text-left text-[9px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em]"
                    >
                      <span>Ingresar como otro miembro del plantel ({dbMembers.length})</span>
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-250 ${showRosterSelect ? 'rotate-90' : ''}`} />
                    </button>

                    {showRosterSelect && (
                      <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="relative">
                          <select
                            value={selectedMemberId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedMemberId(val);
                              const found = dbMembers.find(m => m.id === val);
                              if (found) {
                                handleShortcutLogin(found);
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 pr-10 text-xs font-semibold outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/35 transition-all text-slate-700 appearance-none cursor-pointer"
                          >
                            <option value="">-- Seleccionar miembro del plantel --</option>
                            {dbMembers.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.name} ({getRoleLabel(member.role)})
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronRight className="w-4 h-4 rotate-90" />
                          </div>
                        </div>
                        <p className="text-[8.5px] text-slate-400/80 font-medium uppercase tracking-wider leading-relaxed px-1">
                          * Haz clic sobre un miembro creado por el DT para simular su inicio de sesión al instante.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">HAY EQUIPO MVP · 2026</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
