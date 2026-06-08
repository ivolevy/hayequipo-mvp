import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User, Activity, Apple, Pencil, Search, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'jugador' | 'dt' | 'pf' | 'nutri' | 'admin';
  number?: number;
  position?: string;
}

const roleIcons = {
  dt: Shield,
  pf: Activity,
  nutri: Apple,
  jugador: User,
};

const roleLabels = {
  dt: 'Director Técnico',
  pf: 'Preparador Físico',
  nutri: 'Nutricionista',
  jugador: 'Jugador',
};

const roleColors = {
  dt: 'bg-blue-50 text-blue-600 border border-blue-100',
  pf: 'bg-purple-50 text-purple-600 border border-purple-100',
  nutri: 'bg-amber-50 text-amber-600 border border-amber-100',
  jugador: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
};

const GestionPlantel = () => {
  const { user } = useAuth();
  const activeTeamId = user?.activeTeamId;

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'jugador' | 'staff'>('todos');
  
  // Form / Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'jugador' | 'dt' | 'pf' | 'nutri' | 'admin'>('jugador');
  const [number, setNumber] = useState<string>('');
  const [position, setPosition] = useState<string>('Mediocampista');

  const fetchProfiles = async () => {
    if (!activeTeamId) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('hayequipo_squad')
        .select('id, full_name, email, role, number, position')
        .eq('team_id', activeTeamId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cargar plantel desde base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [activeTeamId]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('jugador');
    setNumber('');
    setPosition('Mediocampista');
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!activeTeamId) {
      toast.error('No hay un equipo activo seleccionado');
      return;
    }
    
    const finalEmail = email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@hayequipo.com`;

    try {
      if (isEditing && editingId) {
        // 1. Update global profile
        const { error: profileError } = await supabase
          .from('hayequipo_profiles')
          .update({
            full_name: name,
            email: finalEmail,
            role
          })
          .eq('id', editingId);

        if (profileError) throw profileError;

        // 2. Update membership
        const { error: memError } = await supabase
          .from('hayequipo_memberships')
          .update({
            role,
            number: role === 'jugador' ? Number(number) || null : null,
            position: role === 'jugador' ? position : null
          })
          .eq('profile_id', editingId)
          .eq('team_id', activeTeamId);

        if (memError) throw memError;

        toast.success('Miembro actualizado correctamente');
        resetForm();
        await fetchProfiles();
      } else {
        const newId = crypto.randomUUID();
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);

        // 1. Insert global profile
        const { error: profileError } = await supabase
          .from('hayequipo_profiles')
          .insert({
            id: newId,
            full_name: name,
            email: finalEmail,
            role,
            avatar_url: randomColor
          });

        if (profileError) throw profileError;

        // 2. Insert membership
        const { error: memError } = await supabase
          .from('hayequipo_memberships')
          .insert({
            profile_id: newId,
            team_id: activeTeamId,
            role,
            number: role === 'jugador' ? Number(number) || null : null,
            position: role === 'jugador' ? position : null
          });

        if (memError) throw memError;

        toast.success('Miembro añadido al plantel');
        resetForm();
        await fetchProfiles();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al guardar miembro');
    }
  };

  const handleEdit = (profile: Profile) => {
    setIsEditing(true);
    setEditingId(profile.id);
    setName(profile.full_name);
    setEmail(profile.email);
    setRole(profile.role);
    setNumber(profile.number ? String(profile.number) : '');
    setPosition(profile.position || 'Mediocampista');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!activeTeamId) return;
    if (confirm(`¿Estás seguro de eliminar a ${name}?`)) {
      try {
        const { error } = await supabase
          .from('hayequipo_memberships')
          .delete()
          .eq('profile_id', id)
          .eq('team_id', activeTeamId);

        if (error) throw error;
        toast.success('Miembro eliminado del plantel');
        if (editingId === id) {
          resetForm();
        }
        await fetchProfiles();
      } catch (err: any) {
        console.error(err);
        toast.error('Error al eliminar miembro');
      }
    }
  };

  // Filter profiles based on search and tab
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === 'todos') return matchesSearch;
    if (activeTab === 'jugador') return p.role === 'jugador' && matchesSearch;
    if (activeTab === 'staff') return p.role !== 'jugador' && matchesSearch;
    
    return matchesSearch;
  });

  return (
    <Layout title="Plantel & Staff">
      <div className="content-width px-4 py-8 animate-fade-in max-w-6xl pb-32 space-y-8">
        
        {/* Header */}
        <div className="px-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-display text-slate-900 uppercase tracking-tight leading-none mb-2">Plantel & Staff</h1>
            <p className="text-xs text-slate-500 font-medium">Gestión del cuerpo técnico, auxiliares y jugadores del equipo.</p>
          </div>
          <div className="bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-400">
            {profiles.length} Miembros totales
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Formulario */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
            <div className="premium-card p-6 bg-white border border-slate-100 shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-sm tracking-tight text-slate-900 uppercase">
                    {isEditing ? 'EDITAR MIEMBRO' : 'NUEVO MIEMBRO'}
                  </h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {isEditing ? 'MODIFICAR DATOS DE USUARIO' : 'REGISTRAR PERSONAL'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Michael Olise" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold px-4 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Opcional)</label>
                  <input 
                    type="email" 
                    placeholder="Ej: olise@hayequipo.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold px-4 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol</label>
                  <Select value={role} onValueChange={(val: any) => setRole(val)}>
                    <SelectTrigger className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold px-4 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-800 text-left">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-lg">
                      <SelectItem value="jugador">Jugador</SelectItem>
                      <SelectItem value="dt">Director Técnico</SelectItem>
                      <SelectItem value="pf">Prep. Físico</SelectItem>
                      <SelectItem value="nutri">Nutricionista</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {role === 'jugador' && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in pt-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Posición</label>
                      <Select value={position} onValueChange={(val: string) => setPosition(val)}>
                        <SelectTrigger className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold px-3 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-800 text-left">
                          <SelectValue placeholder="Seleccionar posición" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-lg">
                          <SelectItem value="Arquero">Arquero</SelectItem>
                          <SelectItem value="Defensor">Defensor</SelectItem>
                          <SelectItem value="Mediocampista">Mediocampista</SelectItem>
                          <SelectItem value="Delantero">Delantero</SelectItem>
                          <SelectItem value="Enganche">Enganche</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dorsal / N°</label>
                      <input 
                        type="number" 
                        placeholder="Ej: 10" 
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold px-4 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-800"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {isEditing && (
                    <button 
                      type="button"
                      onClick={resetForm}
                      className="flex-1 h-12 border border-slate-150 text-slate-500 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      CANCELAR
                    </button>
                  )}
                  <button 
                    type="submit"
                    className={`flex-1 h-12 text-white rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-1.5 ${
                      isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {isEditing ? 'GUARDAR' : 'REGISTRAR'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Listado */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center px-2">
              <div className="flex gap-1.5 bg-slate-100/80 p-1 rounded-xl self-start">
                <button
                  onClick={() => setActiveTab('todos')}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    activeTab === 'todos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  TODOS
                </button>
                <button
                  onClick={() => setActiveTab('jugador')}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    activeTab === 'jugador' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  JUGADORES
                </button>
                <button
                  onClick={() => setActiveTab('staff')}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    activeTab === 'staff' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  STAFF TÉCNICO
                </button>
              </div>

              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="BUSCAR MIEMBRO..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-150 px-4 py-2.5 pl-10 rounded-xl text-[9px] font-black tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-350"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              </div>
            </div>

            {/* List Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando plantel...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                {filteredProfiles.map((p) => {
                  const Icon = roleIcons[p.role] || User;
                  return (
                    <div 
                      key={p.id} 
                      className="premium-card p-5 bg-white border border-slate-100 hover:border-slate-200 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner shrink-0">
                          {p.role === 'jugador' && p.number ? (
                            <span className="font-display font-black text-sm">{p.number}</span>
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-display font-semibold text-slate-800 uppercase tracking-tight leading-none mb-1.5 truncate">
                            {p.full_name}
                          </h3>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${roleColors[p.role]}`}>
                                {roleLabels[p.role]}
                              </span>
                              {p.role === 'jugador' && p.position && (
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                                  · {p.position}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium truncate">{p.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          aria-label={`Editar a ${p.full_name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.full_name)}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          aria-label={`Eliminar a ${p.full_name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredProfiles.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No se encontraron miembros</p>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </Layout>
  );
};

export default GestionPlantel;
