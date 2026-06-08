import Layout from '@/components/Layout';
import { useMatches } from '@/context/MatchContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate, Link } from 'react-router-dom';
import { useNotices } from '@/context/NoticeContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarDays, MapPin, Users, ChevronRight, Megaphone, Shield, ArrowRight } from 'lucide-react';

const AdminDashboard = () => {
  const { matches } = useMatches();
  const { notices } = useNotices();
  const navigate = useNavigate();
  const [memberCounts, setMemberCounts] = useState({ total: 0, jugadores: 0, staff: 0 });

  const nextMatches = [...matches]
    .filter(m => !m.completed && new Date(m.date).getTime() >= Date.now() - 3 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const activeTeamId = matches[0]?.team_id || localStorage.getItem('hay_equipo_active_team_id');

  useEffect(() => {
    const fetchMemberCounts = async () => {
      if (!activeTeamId) return;
      try {
        const { data, error } = await supabase
          .from('hayequipo_squad')
          .select('role')
          .eq('team_id', activeTeamId);

        if (error) throw error;
        if (data) {
          const total = data.length;
          const jugadores = data.filter(m => m.role === 'jugador').length;
          const staff = total - jugadores;
          setMemberCounts({ total, jugadores, staff });
        }
      } catch (err) {
        console.error('Error fetching member counts for admin:', err);
      }
    };
    fetchMemberCounts();
  }, [activeTeamId]);

  return (
    <Layout title="Inicio (Administrador)">
      <div className="content-width px-1 py-2 md:py-8 animate-fade-in max-w-4xl pb-24 space-y-6">
        
        {/* Banner de Bienvenida Admin */}
        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-950/20">
          <div className="relative z-10 space-y-2">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-3 py-1 rounded-full">
              Rol: Administrador 👑
            </span>
            <h2 className="font-display text-xl md:text-2xl uppercase tracking-tight">Gestión del Club</h2>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed max-w-lg">
              Bienvenido al panel general. Como administrador, tu función principal es gestionar los miembros y el cuerpo técnico del club, además de supervisar la actividad general del equipo.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-6 translate-y-6 pointer-events-none">
            <Shield className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Acceso Principal: Gestionar Plantel */}
        <div className="px-1">
          <button
            onClick={() => navigate('/admin/plantel')}
            className="w-full premium-card p-5 md:p-6 flex items-center justify-between group bg-emerald-600 border-none shadow-lg shadow-emerald-200/40 hover:bg-emerald-700 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-display text-sm md:text-base tracking-wide uppercase text-white leading-tight">GESTIONAR PLANTEL & STAFF</div>
                <div className="text-[8px] md:text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em] mt-0.5">
                  Agregar, editar y remover jugadores o cuerpo técnico
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>

        {/* Resumen del Club y Actividad */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
          <div className="premium-card p-5 bg-white border border-slate-100 flex flex-col justify-center text-center">
            <span className="text-3xl font-display text-slate-800 leading-none">{memberCounts.total}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Miembros Totales</span>
          </div>
          <div className="premium-card p-5 bg-white border border-slate-100 flex flex-col justify-center text-center">
            <span className="text-3xl font-display text-slate-800 leading-none">{memberCounts.jugadores}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Jugadores</span>
          </div>
          <div className="premium-card p-5 bg-white border border-slate-100 flex flex-col justify-center text-center">
            <span className="text-3xl font-display text-slate-800 leading-none">{memberCounts.staff}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Cuerpo Técnico / Auxiliares</span>
          </div>
        </div>

        {/* Vista General de Actividades */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
          
          {/* Próximos Partidos */}
          <div className="space-y-4">
            <h3 className="font-display text-sm tracking-tight text-slate-900 uppercase">Agenda de Partidos</h3>
            {nextMatches.length === 0 ? (
              <div className="premium-card p-8 text-center border-dashed bg-white border-slate-200">
                <CalendarDays className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sin partidos programados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nextMatches.map((match) => (
                  <Link 
                    key={match.id} 
                    to={`/admin/partido/${match.id}`}
                    className="group premium-card p-4 bg-white border border-slate-100 shadow-sm flex items-center justify-between hover:border-emerald-100 transition-all"
                  >
                    <div className="min-w-0">
                      <h4 className="font-display text-xs font-semibold text-slate-800 uppercase group-hover:text-emerald-600 transition-colors truncate">
                        vs {match.rival}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                        <CalendarDays className="w-3 h-3" />
                        <span>
                          {format(new Date(match.date), "d 'de' MMMM, HH:mm'hs'", { locale: es })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Últimos Comunicados */}
          <div className="space-y-4">
            <h3 className="font-display text-sm tracking-tight text-slate-900 uppercase">Muro de Avisos</h3>
            {notices.length === 0 ? (
              <div className="premium-card p-8 text-center border-dashed bg-white border-slate-200">
                <Megaphone className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sin avisos publicados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notices.slice(0, 3).map((notice) => (
                  <div 
                    key={notice.id} 
                    className="premium-card p-4 bg-white border border-slate-100 shadow-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-display text-xs font-semibold text-slate-800 uppercase truncate">
                        {notice.title}
                      </h4>
                      <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                        {notice.authorRole === 'dt' ? 'DT' : notice.authorRole.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {notice.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default AdminDashboard;
