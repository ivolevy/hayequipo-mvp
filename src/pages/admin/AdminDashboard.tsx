import Layout from '@/components/Layout';
import { useMatches } from '@/context/MatchContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate, Link } from 'react-router-dom';
import { useNotices } from '@/context/NoticeContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarDays, MapPin, Users, ChevronRight, Megaphone } from 'lucide-react';

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
  const activeTeamName = localStorage.getItem('hay_equipo_user') 
    ? JSON.parse(localStorage.getItem('hay_equipo_user')!).activeTeamName 
    : 'Mi Equipo';

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
    <Layout title="">
      <div className="content-width px-4 py-6 md:py-10 animate-fade-in max-w-4xl pb-24 space-y-8">
        
        {/* Simple Minimal Header */}
        <div className="border-b border-slate-100 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <h1 className="text-2xl font-display font-semibold text-slate-800 uppercase tracking-tight">
              {activeTeamName}
            </h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Panel de Administración
            </span>
          </div>
        </div>

        {/* 2-Column Minimal Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Matches and Announcements */}
          <div className="md:col-span-8 space-y-8">
            
            {/* Próximos Partidos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h2 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Agenda de Partidos
                </h2>
                <Link 
                  to="/admin/partidos" 
                  className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 tracking-wider uppercase transition-colors"
                >
                  Ver todos
                </Link>
              </div>

              {nextMatches.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <CalendarDays className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sin partidos programados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nextMatches.map((match) => (
                    <Link 
                      key={match.id} 
                      to={`/admin/partido/${match.id}`}
                      className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all shadow-sm"
                    >
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight group-hover:text-emerald-600 transition-colors truncate">
                          vs {match.rival}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                            {format(new Date(match.date), "d 'de' MMMM, HH:mm'hs'", { locale: es })}
                          </span>
                          {match.venue && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              {match.venue}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Muro de Avisos */}
            <div className="space-y-4">
              <div className="border-b border-slate-50 pb-2">
                <h2 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Comunicados del Staff
                </h2>
              </div>

              {notices.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <Megaphone className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sin avisos publicados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notices.slice(0, 3).map((notice) => (
                    <div 
                      key={notice.id} 
                      className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 uppercase truncate">
                          {notice.title}
                        </h4>
                        <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-full">
                          {notice.authorRole === 'dt' ? 'DT' : notice.authorRole.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {notice.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Squad Management & Summary */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Squad Overview Card */}
            <div className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Estructura del Club</h3>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">
                  Resumen de miembros registrados
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Plantel</span>
                  <span className="text-sm font-display text-slate-700 font-bold">{memberCounts.jugadores}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Staff Técnico</span>
                  <span className="text-sm font-display text-slate-700 font-bold">{memberCounts.staff}</span>
                </div>
                <div className="flex justify-between items-center py-2 font-semibold">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Total</span>
                  <span className="text-sm font-display text-slate-800 font-black">{memberCounts.total}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/admin/plantel')}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[9px] tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Gestionar Plantel</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
};

export default AdminDashboard;
