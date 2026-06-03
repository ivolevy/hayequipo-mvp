import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#FAFAFA] animate-fade-in">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto border border-rose-100 shadow-xl shadow-rose-500/5">
            <ShieldAlert className="w-10 h-10 text-rose-500" />
          </div>
          <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
            Error
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="font-display text-4xl md:text-5xl tracking-tighter text-slate-900 leading-none uppercase">
            404
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Página no encontrada
          </p>
        </div>

        <p className="text-sm text-slate-500 leading-relaxed max-w-[280px] mx-auto font-medium">
          Lo sentimos, la vista que estás buscando no existe o ha sido movida.
        </p>

        <div className="pt-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-[10px] tracking-widest uppercase hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al inicio
          </Link>
        </div>
      </div>

      <div className="fixed bottom-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
        HAY EQUIPO · PLATAFORMA DE GESTIÓN
      </div>
    </div>
  );
};

export default NotFound;
