import Layout from '@/components/Layout';
import { useMatches } from '@/context/MatchContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useNotices } from '@/context/NoticeContext';
import StatusBadge from '@/components/StatusBadge';
import { CalendarDays, MapPin, Users, PlusCircle, ChevronRight, Activity, Megaphone, Send, Trophy, Target } from 'lucide-react';
import { toast } from 'sonner';

const DTDashboard = () => {
  const { matches } = useMatches();
  const { notices } = useNotices();
  const navigate = useNavigate();

  const nextMatches = [...matches]
    .filter(m => !m.completed && new Date(m.date).getTime() >= Date.now() - 3 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <Layout title="Mi Panel">
      <div className="content-width px-1 py-2 md:py-8 animate-fade-in max-w-4xl pb-24 space-y-4 md:space-y-8">

        {/* Action: Create Match - Prominent Green */}
        <div className="px-1">
          <button
            onClick={() => navigate('/dt/crear-partido')}
            aria-label="Organizar un nuevo encuentro"
            className="w-full premium-card p-4 md:p-6 flex items-center justify-between group bg-emerald-600 border-none shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4 md:gap-5">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <PlusCircle className="w-5 h-5 md:w-7 md:h-7 text-white" aria-hidden="true" />
              </div>
              <div className="text-left">
                <div className="font-display text-base md:text-lg tracking-wide uppercase text-white leading-tight">ORGANIZAR ENCUENTRO</div>
                <div className="text-[8px] md:text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em] mt-0.5">Nuevo Desafío</div>
              </div>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" aria-hidden="true" />
            </div>
          </button>
        </div>

        {/* Action: Create Notice - Premium Action */}
        <div className="px-1">
          <button
            onClick={() => navigate('/dt/avisos')}
            className="w-full premium-card p-4 md:p-6 flex items-center justify-between group bg-white border border-slate-100 hover:border-emerald-100 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4 md:gap-5">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                <Megaphone className="w-5 h-5 md:w-7 md:h-7 text-emerald-600" aria-hidden="true" />
              </div>
              <div className="text-left">
                <div className="font-display text-base md:text-lg tracking-wide uppercase text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">COMUNICADO EQUIPO</div>
                <div className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Publicar nuevo aviso</div>
              </div>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
              <PlusCircle className="w-4 h-4 md:w-5 md:h-5 text-slate-300 group-hover:text-emerald-500 transition-all" aria-hidden="true" />
            </div>
          </button>
        </div>

        {/* Recent matches */}
        <div className="space-y-4 md:space-y-6 px-1">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base md:text-lg tracking-tight text-slate-900 uppercase">PRÓXIMO PARTIDO</h2>
            <button onClick={() => navigate('/dt/partidos')} className="text-[8px] md:text-[10px] font-black text-emerald-600 tracking-widest uppercase hover:text-emerald-700 transition-colors bg-emerald-50 px-2.5 py-1 rounded-full">
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
                  to={`/dt/partido/${match.id}`}
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

export default DTDashboard;

