import React from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/data/users';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Users,
  LogOut,
  ChevronLeft,
  Activity,
  Apple,
  Phone,
  Megaphone,
  Target,
  Utensils
} from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navByRole: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Crear partido', to: '/admin/crear-partido', icon: PlusCircle },
    { label: 'Partidos', to: '/admin/partidos', icon: ClipboardList },
    { label: 'Avisos', to: '/admin/avisos', icon: Megaphone },
    { label: 'Plantel & Staff', to: '/admin/plantel', icon: Users },
    { label: 'Estado Físico', to: '/admin/salud', icon: Activity },
    { label: 'Nutrición', to: '/admin/objetivos-nutri', icon: Apple },
  ],
  dt: [
    { label: 'Dashboard', to: '/dt', icon: LayoutDashboard },
    { label: 'Crear partido', to: '/dt/crear-partido', icon: PlusCircle },
    { label: 'Partidos', to: '/dt/partidos', icon: ClipboardList },
    { label: 'Avisos', to: '/dt/avisos', icon: Megaphone },
    { label: 'Plantel & Staff', to: '/dt/plantel', icon: Users },
  ],
  pf: [
    { label: 'Dashboard', to: '/pf', icon: LayoutDashboard },
    { label: 'Estado Físico', to: '/pf/salud', icon: Activity },
    { label: 'Planes', to: '/pf/planes', icon: ClipboardList },
  ],
  nutri: [
    { label: 'Dashboard', to: '/nutri', icon: LayoutDashboard },
    { label: 'Objetivos', to: '/nutri/objetivos', icon: Target },
    { label: 'Sugerencias', to: '/nutri/recomendaciones', icon: Utensils },
    { label: 'Planes', to: '/nutri/planes', icon: Users },
  ],
  jugador: [
    { label: 'Mi Panel', to: '/jugador', icon: LayoutDashboard },
    { label: 'Partidos', to: '/jugador/partidos', icon: ClipboardList },
    { label: 'Rutina', to: '/jugador/entrenamiento', icon: Activity },
    { label: 'Nutrición', to: '/jugador/nutricion', icon: Apple },
    { label: 'Staff', to: '/jugador/contacto', icon: Phone },
  ],
};

interface LayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  backTo?: string;
  onBack?: () => void;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, showBack, backTo, onBack, title }) => {
  const { user, logout, switchTeam } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const navItems = navByRole[user.role];
  const isMainModule = ['/jugador', '/dt', '/pf', '/nutri', '/admin'].includes(location.pathname);
  const shouldDisplayBack = showBack && !isMainModule;

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row bg-[#FAFAFA]">
      {/* Desktop Sidebar - Emerald Branding Restored */}
      <aside className="hidden md:flex flex-col w-72 bg-emerald-600 p-8 justify-between shrink-0 h-screen sticky top-0 shadow-2xl z-50">
        <div>
          <div className="mb-16">
            <h2 className="font-display text-xl tracking-tight text-white leading-none mb-1 uppercase">
              HAY <span className="text-emerald-200">EQUIPO</span>
            </h2>
            {user.activeTeamName && (
              <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mt-1 opacity-80 truncate">
                {user.activeTeamName}
              </p>
            )}
          </div>
          <nav className="space-y-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={item.label}
                end={item.to === `/${user.role}`}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-5 py-4 rounded-2xl text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-emerald-600 shadow-xl shadow-emerald-700/20'
                      : 'text-emerald-50 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <item.icon className="w-5 h-5" aria-hidden="true" />
                <span className="font-bold tracking-tight uppercase text-xs">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="pt-8 border-t border-white/10">
          <Link to="/perfil" className="flex items-center gap-4 px-2 mb-4 group hover:bg-white/5 p-2 rounded-2xl transition-all">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold shadow-xl border-2 border-white/20 transition-transform group-hover:scale-105"
              style={{ backgroundColor: user.color, color: '#FFF' }}
            >
              {user.initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate group-hover:text-emerald-100">{user.name}</div>
              <div className="text-[10px] font-black text-emerald-100 uppercase tracking-widest opacity-60">Ver Perfil</div>
            </div>
          </Link>
          <button
            onClick={switchTeam}
            className="flex items-center gap-4 px-5 py-3.5 text-xs font-black text-emerald-50 hover:text-white transition-all w-full rounded-2xl hover:bg-white/10 uppercase tracking-widest mb-1.5"
          >
            <Users className="w-5 h-5" aria-hidden="true" />
            <span>Cambiar Equipo</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-4 px-5 py-3.5 text-xs font-black text-emerald-50 hover:text-white transition-all w-full rounded-2xl hover:bg-white/10 uppercase tracking-widest"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-2xl border-b border-slate-50 flex items-center justify-between px-8 z-[999] shadow-sm">
        <div className="flex flex-col min-w-0 mr-4">
          <h2 className="font-display text-lg tracking-tight text-slate-900 leading-none uppercase">HAY <span className="text-emerald-600">EQUIPO</span></h2>
          {user.activeTeamName && (
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1 truncate">{user.activeTeamName}</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={switchTeam}
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center text-slate-500 shadow-sm border border-slate-100"
            aria-label="Cambiar Equipo"
          >
            <Users className="w-4.5 h-4.5" />
          </button>
          <Link
            to="/perfil"
            className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-xs font-bold shadow-lg shadow-black/5 active:scale-95 transition-transform"
            style={{ backgroundColor: user.color, color: '#FFF' }}
          >
            {user.initials}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col h-full overflow-hidden pt-24 pb-28 md:pt-0 md:pb-0">
        <div className="flex-1 overflow-y-auto overscroll-none px-2 pt-0 pb-4 md:px-4 md:pt-0 md:pb-8 lg:px-16 lg:pt-0 lg:pb-16 animate-fade-in">
          {shouldDisplayBack ? (
            <div className="sticky top-0 z-50 bg-gradient-to-b from-[#FAFAFA] via-[#FAFAFA]/90 to-transparent pt-4 pb-6 md:pt-8 lg:pt-16 -mx-2 px-2 md:-mx-4 md:px-4 lg:-mx-16 lg:px-16 mb-2">
              <button
                onClick={() => {
                  if (onBack) {
                    onBack();
                  } else {
                    navigate(backTo || `/${user.role}`);
                  }
                }}
                className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-emerald-600 transition-all bg-white border border-slate-100 rounded-full shadow-md active:scale-95"
                aria-label="Volver"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="h-4 md:h-8 lg:h-16" />
          )}
          {children}
        </div>
      </main>

      {/* Mobile bottom nav - Adaptive Width */}
      <nav className="md:hidden fixed bottom-8 left-4 right-4 h-20 bg-slate-900/95 backdrop-blur-2xl flex items-center justify-between z-[9999] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] px-3 max-w-md mx-auto">
        <div className="flex items-center justify-evenly flex-1 min-w-0">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${user.role}`}
              className={({ isActive }) => 
                `flex items-center justify-center w-11 h-11 rounded-full transition-all duration-500 shrink-0 ${
                  isActive ? 'bg-white shadow-lg' : 'text-white/40'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    className={`w-[1.15rem] h-[1.15rem] transition-colors duration-300 ${isActive ? 'text-slate-900' : 'text-white/40'}`} 
                    aria-hidden="true" 
                  />
                  <span className="sr-only">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        
        <div className="flex items-center shrink-0">
          <div className="w-px h-6 bg-white/10 mx-1.5" />
          <button
            onClick={logout}
            className="flex items-center justify-center w-11 h-11 rounded-full text-white/40 hover:text-rose-400 transition-all"
            aria-label="Cerrar Sesión"
          >
            <LogOut className="w-[1.15rem] h-[1.15rem]" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
