import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProveedorAutenticacion, useAutenticacion } from './contexto/AutenticacionContexto';
import { ProveedorNotificaciones } from './contexto/NotificacionesContexto';
import { DisposicionPrincipal } from './componentes/layout/DisposicionPrincipal';

// Páginas
import { IniciarSesion } from './paginas/IniciarSesion';
import { DashboardPrincipal } from './paginas/DashboardPrincipal';
import { ModuloEmpleados } from './paginas/ModuloEmpleados';
import { FichaEmpleado } from './paginas/FichaEmpleado';
import { ModuloAsistencia } from './paginas/ModuloAsistencia';
import { ModuloVacaciones } from './paginas/ModuloVacaciones';
import { ModuloLiquidaciones } from './paginas/ModuloLiquidaciones';
import { ModuloRecibos } from './paginas/ModuloRecibos';
import { ModuloPanelRRHH } from './paginas/ModuloPanelRRHH';
import { ModuloUsuarios } from './paginas/ModuloUsuarios';
import { ModuloConfiguracion } from './paginas/ModuloConfiguracion';
import { ModuloAuditoria } from './paginas/ModuloAuditoria';
import { ModuloIntranet } from './paginas/ModuloIntranet';

// Componente para proteger rutas privadas
const RutaProtegida: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { estaAutenticado, cargando } = useAutenticacion();

  if (cargando) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wider text-slate-300">Cargando plataforma TEKI...</p>
        </div>
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  return <>{children}</>;
};

// Generador de migas de pan según la ruta actual
const EnvoltorioDisposicion: React.FC = () => {
  const ubicacion = useLocation();
  const path = ubicacion.pathname;

  let migas: { titulo: string; ruta?: string }[] = [{ titulo: 'Inicio', ruta: '/' }];

  if (path.startsWith('/empleados')) {
    migas.push({ titulo: 'Colaboradores', ruta: '/empleados' });
    if (path !== '/empleados') {
      migas.push({ titulo: 'Ficha del Colaborador' });
    }
  } else if (path === '/asistencia') {
    migas.push({ titulo: 'Control de Asistencia' });
  } else if (path === '/vacaciones') {
    migas.push({ titulo: 'Gestión de Vacaciones' });
  } else if (path.startsWith('/liquidaciones')) {
    migas.push({ titulo: 'Liquidaciones de Salarios' });
  } else if (path === '/recibos') {
    migas.push({ titulo: 'Recibos de Salario' });
  } else if (path === '/panel-rrhh') {
    migas.push({ titulo: 'Panel de RRHH y Analítica' });
  } else if (path === '/usuarios') {
    migas.push({ titulo: 'Usuarios y Permisos' });
  } else if (path.startsWith('/configuracion')) {
    migas.push({ titulo: 'Configuración y Catálogos' });
  } else if (path === '/auditoria') {
    migas.push({ titulo: 'Auditoría y Trazabilidad' });
  } else if (path === '/intranet') {
    migas.push({ titulo: 'Intranet y Salas' });
  }

  return <DisposicionPrincipal migas={migas} />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ProveedorNotificaciones>
        <ProveedorAutenticacion>
          <Routes>
            {/* Ruta pública */}
            <Route path="/iniciar-sesion" element={<IniciarSesion />} />

            {/* Rutas protegidas con Layout principal */}
            <Route
              element={
                <RutaProtegida>
                  <EnvoltorioDisposicion />
                </RutaProtegida>
              }
            >
              <Route path="/" element={<DashboardPrincipal />} />
              <Route path="/panel" element={<Navigate to="/" replace />} />
              <Route path="/empleados" element={<ModuloEmpleados />} />
              <Route path="/empleados/nuevo" element={<ModuloEmpleados />} />
              <Route path="/empleados/:id" element={<FichaEmpleado />} />
              <Route path="/empleados/:id/editar" element={<FichaEmpleado />} />
              <Route path="/asistencia" element={<ModuloAsistencia />} />
              <Route path="/vacaciones" element={<ModuloVacaciones />} />
              <Route path="/liquidaciones" element={<ModuloLiquidaciones />} />
              <Route path="/liquidaciones/nueva" element={<ModuloLiquidaciones />} />
              <Route path="/recibos" element={<ModuloRecibos />} />
              <Route path="/panel-rrhh" element={<ModuloPanelRRHH />} />
              <Route path="/usuarios" element={<ModuloUsuarios />} />
              <Route path="/configuracion" element={<ModuloConfiguracion />} />
              <Route path="/configuracion/sectores" element={<ModuloConfiguracion />} />
              <Route path="/configuracion/departamentos" element={<ModuloConfiguracion />} />
              <Route path="/configuracion/cargos" element={<ModuloConfiguracion />} />
              <Route path="/auditoria" element={<ModuloAuditoria />} />
              <Route path="/intranet" element={<ModuloIntranet />} />
            </Route>

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProveedorAutenticacion>
      </ProveedorNotificaciones>
    </BrowserRouter>
  );
};
