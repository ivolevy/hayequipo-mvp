import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { User, Mail, Shield, LogOut, ChevronRight, Key } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    toast.promise(new Promise(r => setTimeout(r, 1000)), {
      loading: 'Cerrando sesión...',
      success: () => {
        logout();
        return 'Sesión cerrada correctamente';
      },
      error: 'Error al cerrar sesión',
    });
  };

  return (
    <Layout title="Mi Perfil" showBack>
      <div className="px-2 pb-12 md:pb-32 animate-fade-in max-w-4xl space-y-6 md:space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-8 px-2">
          {/* Avatar - Desktop Only */}
          <div 
            className="hidden md:flex w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] items-center justify-center text-white font-display text-lg md:text-xl shadow-xl shadow-slate-200 shrink-0"
            style={{ backgroundColor: user.color }}
          >
            {user.initials}
          </div>
          <div className="space-y-1 text-left w-full md:w-auto">
            <h1 className="hidden md:block text-xl md:text-2xl font-display text-slate-900 uppercase tracking-tight leading-none">{user.name}</h1>
            <div className="inline-flex items-center bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{user.roleLabel}</span>
            </div>
          </div>
        </div>

        {/* Info Groups */}
        <div className="space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Información de Cuenta</h2>
            <div className="premium-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Nombre Completo</p>
                    <p className="text-sm font-bold text-slate-800 uppercase">{user.name}</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-50" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Correo Electrónico</p>
                    <p className="text-sm font-bold text-slate-800">
                      {user.email || (
                        user.role === 'dt' ? 'caruso@hayequipo.app' : 
                        user.role === 'jugador' ? 'olise@hayequipo.app' : 
                        user.role === 'pf' ? 'janson@hayequipo.app' : 'mario@hayequipo.app'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Seguridad</h2>
            <div className="premium-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Contraseña</p>
                    <p className="text-sm font-bold text-slate-800">••••••••••••</p>
                  </div>
                </div>
                <button 
                  onClick={() => toast.info('Funcionalidad en desarrollo')}
                  className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors bg-emerald-50 px-3 py-1.5 rounded-lg"
                >
                  Cambiar
                </button>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="pt-4">
            <button 
              onClick={handleLogout}
              className="w-full bg-rose-100/60 md:bg-white border border-rose-200/50 md:border-none rounded-[2rem] p-4 md:p-6 flex items-center justify-between group hover:bg-rose-50 transition-all active:scale-[0.98] shadow-[0_8px_30px_rgb(244,63,94,0.06)] md:shadow-lg md:shadow-rose-100/20"
            >
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-rose-500 text-white md:bg-rose-50 md:text-rose-500 group-hover:bg-rose-600 md:group-hover:bg-rose-100 md:group-hover:text-rose-600 transition-colors flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="text-left">
                  <div className="font-display text-sm md:text-xl tracking-tight text-rose-700 md:text-slate-900 uppercase group-hover:text-rose-600 transition-colors">Cerrar Sesión</div>
                  <div className="text-[8px] md:text-[9px] font-black text-rose-500/80 md:text-slate-400 uppercase tracking-widest mt-0.5">Finalizar sesión actual</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-rose-400 md:text-slate-200 group-hover:text-rose-300 transition-colors" />
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Profile;
