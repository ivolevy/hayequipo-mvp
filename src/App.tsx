import { BrowserRouter, Route, Routes, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { PfProvider } from "@/context/PfContext";
import { MatchProvider } from "@/context/MatchContext";
import { NoticeProvider } from "@/context/NoticeContext";
import { NutriProvider } from "@/context/NutriContext";
import Login from "./pages/Login";
import CrearPartido from "./pages/dt/CrearPartido";
import PartidoDetalle from "./pages/dt/PartidoDetalle";
import PartidosList from "./pages/shared/PartidosList";
import DTDashboard from "./pages/dt/DTDashboard";
import DTAvisos from "./pages/dt/DTAvisos";
import GestionPlantel from "./pages/dt/GestionPlantel";
import AdminDashboard from "./pages/admin/AdminDashboard";
import JugadorDashboard from "./pages/jugador/JugadorDashboard";
import JugadorEntrenamiento from "./pages/jugador/JugadorEntrenamiento";
import JugadorNutricion from "./pages/jugador/JugadorNutricion";
import ContactoStaff from "./pages/jugador/ContactoStaff";

// PF Pages
import PFDashboard from "./pages/pf/PFDashboard";
import PFSquadHealth from "./pages/pf/PFSquadHealth";
import PFTrainingPlans from "./pages/pf/PFTrainingPlans";

// Nutri Pages
import NutriDashboard from "./pages/nutri/NutriDashboard";
import NutriPlans from "./pages/nutri/NutriPlans";
import NutriObjetivos from "./pages/nutri/NutriObjetivos";
import NutriRecomendaciones from "./pages/nutri/NutriRecomendaciones";

import Profile from "./pages/shared/Profile";
import SeleccionarEquipo from "./pages/shared/SeleccionarEquipo";

import NotFound from "./pages/NotFound";

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (location.pathname !== "/") {
        navigate("/", { replace: true });
      }
      return;
    }

    if (!user.activeTeamId) {
      if (location.pathname !== "/seleccionar-equipo") {
        navigate("/seleccionar-equipo", { replace: true });
      }
      return;
    }

    const homeRoute = `/${user.role}`;
    const isAllowedRoute = 
      location.pathname === homeRoute || 
      location.pathname.startsWith(`${homeRoute}/`) ||
      location.pathname === '/perfil';

    if (!isAllowedRoute) {
      navigate(homeRoute, { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-900 border-r-2" />
      </div>
    );
  }

  if (!user) return <Login />;

  if (!user.activeTeamId) {
    return (
      <Routes>
        <Route path="/seleccionar-equipo" element={<SeleccionarEquipo />} />
        <Route path="*" element={<Navigate to="/seleccionar-equipo" replace />} />
      </Routes>
    );
  }

  const homeRoute = `/${user.role}`;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homeRoute} replace />} />
      <Route path="/perfil" element={<Profile />} />
      <Route path="/seleccionar-equipo" element={<SeleccionarEquipo />} />

      {/* DT (now with match management) */}
      <Route path="/dt" element={<DTDashboard />} />
      <Route path="/dt/crear-partido" element={<CrearPartido />} />
      <Route path="/dt/partidos" element={<PartidosList />} />
      <Route path="/dt/partido/:id" element={<PartidoDetalle />} />
      <Route path="/dt/avisos" element={<DTAvisos />} />
      <Route path="/dt/plantel" element={<GestionPlantel />} />

      {/* Admin (General Management) */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/partidos" element={<PartidosList />} />
      <Route path="/admin/partido/:id" element={<PartidoDetalle />} />
      <Route path="/admin/plantel" element={<GestionPlantel />} />

      {/* PF (Health & Training) */}
      <Route path="/pf" element={<PFDashboard />} />
      <Route path="/pf/salud" element={<PFSquadHealth />} />
      <Route path="/pf/planes" element={<PFTrainingPlans />} />

      {/* Nutri (Nutrition) */}
      <Route path="/nutri" element={<NutriDashboard />} />
      <Route path="/nutri/objetivos" element={<NutriObjetivos />} />
      <Route path="/nutri/recomendaciones" element={<NutriRecomendaciones />} />
      <Route path="/nutri/planes" element={<NutriPlans />} />

      {/* Jugador */}
      <Route path="/jugador" element={<JugadorDashboard />} />
      <Route path="/jugador/partidos" element={<PartidosList />} />
      <Route path="/jugador/entrenamiento" element={<JugadorEntrenamiento />} />
      <Route path="/jugador/nutricion" element={<JugadorNutricion />} />
      <Route path="/jugador/contacto" element={<ContactoStaff />} />
      <Route path="/jugador/partido/:id" element={<PartidoDetalle />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <PlayerProvider>
      <PfProvider>
        <NutriProvider>
          <NoticeProvider>
            <MatchProvider>
              <TooltipProvider>
                <Sonner position="top-center" />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </TooltipProvider>
            </MatchProvider>
          </NoticeProvider>
        </NutriProvider>
      </PfProvider>
    </PlayerProvider>
  </AuthProvider>
);

export default App;
