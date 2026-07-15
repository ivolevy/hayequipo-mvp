import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, User, Activity, Apple, Plus, UserPlus, LogOut, ChevronRight, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const roleIcons = {
  dt: Shield,
  pf: Activity,
  nutri: Apple,
  admin: Shield,
  jugador: User,
};

const roleLabels = {
  dt: 'Director Técnico',
  pf: 'Prep. Físico',
  nutri: 'Nutricionista',
  admin: 'Administrador',
  jugador: 'Jugador',
};

const roleColors = {
  dt: 'bg-blue-50 text-blue-600 border border-blue-100',
  pf: 'bg-purple-50 text-purple-600 border border-purple-100',
  nutri: 'bg-amber-50 text-amber-600 border border-amber-100',
  admin: 'bg-slate-50 text-slate-600 border border-slate-100',
  jugador: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
};

const SeleccionarEquipo = () => {
  const { user, memberships, selectTeam, createTeam, joinTeam, logout } = useAuth();
  
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error('Ingresá el nombre del equipo');
      return;
    }
    setIsCreating(true);
    try {
      const code = await createTeam(newTeamName.trim());
      toast.success(`Equipo creado correctamente. Código: ${code}`);
      setNewTeamName('');
    } catch (err: any) {
      toast.error(err.message || 'Error al crear equipo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error('Ingresá el código de invitación');
      return;
    }
    setIsJoining(true);
    try {
      const teamName = await joinTeam(inviteCode.trim());
      toast.success(`Te uniste correctamente a ${teamName}`);
      setInviteCode('');
    } catch (err: any) {
      toast.error(err.message || 'Error al unirte al equipo');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Código copiado al portapapeles');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#FAFAFA] selection:bg-slate-900 selection:text-white">
      <div className="w-full max-w-2xl animate-fade-in space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl tracking-tight text-slate-900 leading-none uppercase">
            HAY <span className="text-emerald-600">EQUIPO</span>
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Seleccionar o crear tu equipo
          </p>
          <div className="text-xs text-slate-500 font-medium pt-1">
            Hola, <span className="font-semibold text-slate-700">{user?.name}</span>
          </div>
        </div>

        {/* Memberships List */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 p-6 md:p-8 space-y-6">
          
          {memberships.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Tus Equipos ({memberships.length})
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {memberships.map((m) => {
                  const Icon = roleIcons[m.role] || User;
                  return (
                    <div
                      key={m.team_id}
                      className="premium-card p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-sm">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-display font-semibold text-slate-800 uppercase tracking-tight leading-none mb-1.5 truncate">
                            {m.team_name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${roleColors[m.role]}`}>
                              {roleLabels[m.role]}
                            </span>
                            {m.invite_code && (
                              <button
                                type="button"
                                onClick={() => handleCopyCode(m.invite_code)}
                                className="inline-flex items-center gap-1 text-[8.5px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                              >
                                <span>CÓDIGO: {m.invite_code}</span>
                                {copiedCode === m.invite_code ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => selectTeam(m.team_id)}
                        className="h-10 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-black text-[9px] tracking-widest uppercase transition-all shadow-md px-6 flex items-center justify-center gap-1.5 self-end sm:self-center"
                      >
                        <span>INGRESAR</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-4 border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl space-y-2">
              <p className="text-sm font-display font-semibold text-slate-700 uppercase">Aún no pertenecés a ningún equipo</p>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                Podés unirte a un equipo usando el código que te comparta tu DT, o crear uno nuevo para empezar a organizarlo vos mismo.
              </p>
            </div>
          )}

          {/* Forms Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            
            {/* Join Team */}
            <div className="space-y-3">
              <div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  Unirse a un Equipo
                </h3>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">Ingresá el código de invitación de tu DT</p>
              </div>
              <form onSubmit={handleJoinTeam} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="flex-1 h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold px-4 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-800 uppercase"
                />
                <button
                  type="submit"
                  disabled={isJoining}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[9px] tracking-widest uppercase transition-all shadow-md px-4 flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isJoining ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>UNIRSE</span>
                  )}
                </button>
              </form>
            </div>

            {/* Create Team */}
            <div className="space-y-3">
              <div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Crear un Equipo
                </h3>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">Vas a pasar a ser el Administrador/DT</p>
              </div>
              <form onSubmit={handleCreateTeam} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre del equipo"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="flex-1 h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold px-4 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-800"
                />
                <button
                  type="submit"
                  disabled={isCreating}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[9px] tracking-widest uppercase transition-all shadow-md px-4 flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isCreating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>CREAR</span>
                  )}
                </button>
              </form>
            </div>

          </div>

        </div>

        {/* Footer Logout */}
        <div className="flex justify-between items-center px-4">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">HAY EQUIPO</p>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-widest"
          >
            <LogOut className="w-3.5 h-3.5" />
            CERRAR SESIÓN
          </button>
        </div>

      </div>
    </div>
  );
};

export default SeleccionarEquipo;
