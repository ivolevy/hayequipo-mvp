import Layout from '@/components/Layout';
import { useMatches } from '@/context/MatchContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate, Link } from 'react-router-dom';
import { useNotices } from '@/context/NoticeContext';
import { CalendarDays, MapPin, Users, PlusCircle, ChevronRight, Activity, Megaphone, Apple, Shield } from 'lucide-react';

const AdminDashboard = () => {
  const { matches } = useMatches();
  const { notices } = useNotices();
  const navigate = useNavigate();

  const nextMatches = [...matches]
    .filter(m => !m.completed && new Date(m.date).getTime() >= Date.now() - 3 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <Layout title="Panel de Control General (Admin)">
      <div className="content-width px-1 py-2 md:py-8 animate-fade-in max-w-4xl pb-24 space-y-4 md:space-y-8">
        
        {/* Banner de Bienvenida Admin */}
        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-950/20">
          <div className="relative z-10 space-y-2">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-3 py-1 rounded-full">
              Rol: Administrador del Equipo 👑
            </span>
            <h2 className="font-display text-xl md:text-2xl uppercase tracking-tight">Gestión Deportiva Total</h2>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed max-w-lg">
              Tenés control total sobre tu plantel. Podés organizar encuentros deportivos, publicar comunicados, supervisar el estado físico de los jugadores y revisar planes de nutrición.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-6 translate-y-6 pointer-events-none">
            <Shield className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Acciones Rápidas - Grid de Gestión Completa */}
        <div className="space-y-3">
          <h2 className="font-display text-xs tracking-wider text-slate-400 uppercase ml-1">Herramientas de Gestión</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Organizar Encuentro */}
            <button
              onClick={() => navigate('/admin/crear-partido')}
              className="premium-card p-5 flex items-center justify-between group bg-emerald-600 border-none shadow-md hover:bg-emerald-700 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <PlusCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-display text-sm tracking-wide uppercase text-white leading-tight">Organizar Encuentro</div>
                  <div className="text-[8px] font-black text-emerald-100 uppercase tracking-[0.2em] mt-0.5">Crear nuevo partido</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Comunicado Equipo */}
            <button
              onClick={() => navigate('/admin/avisos')}
              className="premium-card p-5 flex items-center justify-between group bg-white border border-slate-100 hover:border-emerald-100 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <Megaphone className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <div className="font-display text-sm tracking-wide uppercase text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">Aviso al Equipo</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Publicar comunicado</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Gestionar Plantel */}
            <button
              onClick={() => navigate('/admin/plantel')}
              className="premium-card p-5 flex items-center justify-between group bg-white border border-slate-100 hover:border-emerald-100 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                  <Users className="w-6 h-6 text-slate-700" />
                </div>
                <div className="text-left">
                  <div className="font-display text-sm tracking-wide uppercase text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">Plantel & Staff</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Administrar miembros y roles</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Estado Físico */}
            <button
              onClick={() => navigate('/admin/salud')}
              className="premium-card p-5 flex items-center justify-between group bg-white border border-slate-100 hover:border-emerald-100 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
                  <Activity className="w-6 h-6 text-rose-600" />
                </div>
                <div className="text-left">
                  <div className="font-display text-sm tracking-wide uppercase text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">Estado Físico</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Control de salud del plantel</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Nutrición */}
            <button
              onClick={() => navigate('/admin/objetivos-nutri')}
              className="premium-card p-5 flex items-center justify-between group bg-white border border-slate-100 hover:border-emerald-100 transition-all active:scale-[0.98] md:col-span-2"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <Apple className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-left">
                  <div className="font-display text-sm tracking-wide uppercase text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">Gestión de Nutrición</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Sugerencias y objetivos nutricionales</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

          </div>
        </div>

        {/* Próximos partidos */}
        <div className="space-y-4 md:space-y-6 px-1">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base md:text-lg tracking-tight text-slate-900 uppercase">Próximos Encuentros</h2>
            <button onClick={() => navigate('/admin/partidos')} className="text-[8px] md:text-[10px] font-black text-emerald-600 tracking-widest uppercase hover:text-emerald-700 transition-colors bg-emerald-50 px-2.5 py-1 rounded-full">
              VER TODO
            </button>
          </div>
          
          {nextMatches.length === 0 ? (
            <div className="premium-card p-8 md:p-16 text-center border-dashed bg-white border-slate-200">
              <CalendarDays className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No hay compromisos agendados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {nextMatches.map((match) => (
                <Link 
                  key={match.id} 
                  to={`/admin/partido/${match.id}`}
                  className="group premium-card p-5 bg-white border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-100 hover:shadow-md transition-all duration-300"
                >
                  <div>
                    <h3 className="font-display text-base font-semibold text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                      vs {match.rival}
                    </h3>
                    <div className="flex flex-col gap-1 mt-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {(() => {
                            const formatted = format(new Date(match.date), "EEEE d 'de' MMMM · HH:mm'hs'", { locale: es });
                            return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                          })()}
                        </span>
                      </div>
                      {match.venue && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{match.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {match.convocations.slice(0, 3).map((c, i) => (
                          <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center">
                            <Users className="w-3 text-slate-400" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {match.convocations.length} CONVOCADOS
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest group-hover:underline">
                      <span>Detalles</span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
