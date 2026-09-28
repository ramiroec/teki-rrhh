import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  Palmtree,
  Calculator,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  History,
  Building2,
  CalendarCheck,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAutenticacion } from '../../contexto/AutenticacionContexto';
import { Badge } from '../ui/Badge';

interface BarraLateralProps {
  alCerrarMovil?: () => void;
}

export const BarraLateral: React.FC<BarraLateralProps> = ({ alCerrarMovil }) => {
  const { usuario, cerrarSesion, esAdmin, esRRHH, esColaborador } = useAutenticacion();

  const enlacesPrincipales = [
    {
      titulo: 'Inicio',
      ruta: '/',
      icono: <LayoutDashboard className="w-4 h-4" />,
      mostrar: true,
    },
    {
      titulo: 'Empleados',
      ruta: '/empleados',
      icono: <Users className="w-4 h-4" />,
      mostrar: !esColaborador,
    },
    {
      titulo: 'Asistencia',
      ruta: '/asistencia',
      icono: <Clock className="w-4 h-4" />,
      mostrar: true,
    },
    {
      titulo: 'Vacaciones',
      ruta: '/vacaciones',
      icono: <Palmtree className="w-4 h-4" />,
      mostrar: true,
    },
    {
      titulo: 'Liquidaciones',
      ruta: '/liquidaciones',
      icono: <Calculator className="w-4 h-4" />,
      mostrar: esRRHH,
    },
    {
      titulo: 'Recibos de Salario',
      ruta: '/recibos',
      icono: <Receipt className="w-4 h-4" />,
      mostrar: true,
    },
    {
      titulo: 'Panel de RRHH',
      ruta: '/panel-rrhh',
      icono: <BarChart3 className="w-4 h-4" />,
      mostrar: esRRHH,
    },
  ];

  const enlacesAdministracion = [
    {
      titulo: 'Usuarios y Permisos',
      ruta: '/usuarios',
      icono: <ShieldCheck className="w-4 h-4" />,
      mostrar: esAdmin || esRRHH,
    },
    {
      titulo: 'Configuración',
      ruta: '/configuracion',
      icono: <Settings className="w-4 h-4" />,
      mostrar: esAdmin || esRRHH,
    },
    {
      titulo: 'Auditoría',
      ruta: '/auditoria',
      icono: <History className="w-4 h-4" />,
      mostrar: esAdmin || esRRHH,
    },
  ];

  const enlacesFuturos = [
    {
      titulo: 'Intranet y Salas',
      ruta: '/intranet',
      icono: <CalendarCheck className="w-4 h-4" />,
      mostrar: true,
    },
  ];

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 select-none">
      {/* Cabecera / Identidad TEKI */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight">TEKI</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Gestión del Talento</p>
          </div>
        </div>
      </div>

      {/* Empresa Multi-tenant activa */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-200 truncate">
            {usuario?.empresa?.nombre || 'TEKI Soluciones'}
          </p>
          <p className="text-[10px] text-slate-400 truncate">RUC: {usuario?.empresa?.ruc || '80092341-2'}</p>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Menú Principal */}
        <div>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Principal
          </p>
          <nav className="space-y-1">
            {enlacesPrincipales
              .filter((e) => e.mostrar)
              .map((enlace) => (
                <NavLink
                  key={enlace.ruta}
                  to={enlace.ruta}
                  end={enlace.ruta === '/'}
                  onClick={alCerrarMovil}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <span className="shrink-0">{enlace.icono}</span>
                  <span className="truncate">{enlace.titulo}</span>
                </NavLink>
              ))}
          </nav>
        </div>

        {/* Espacio Colaborativo */}
        <div>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Colaboración
          </p>
          <nav className="space-y-1">
            {enlacesFuturos
              .filter((e) => e.mostrar)
              .map((enlace) => (
                <NavLink
                  key={enlace.ruta}
                  to={enlace.ruta}
                  onClick={alCerrarMovil}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <span className="shrink-0">{enlace.icono}</span>
                  <span className="truncate">{enlace.titulo}</span>
                </NavLink>
              ))}
          </nav>
        </div>

        {/* Administración */}
        {(esAdmin || esRRHH) && (
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Administración
            </p>
            <nav className="space-y-1">
              {enlacesAdministracion
                .filter((e) => e.mostrar)
                .map((enlace) => (
                  <NavLink
                    key={enlace.ruta}
                    to={enlace.ruta}
                    onClick={alCerrarMovil}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <span className="shrink-0">{enlace.icono}</span>
                    <span className="truncate">{enlace.titulo}</span>
                  </NavLink>
                ))}
            </nav>
          </div>
        )}
      </div>

      {/* Pie de Usuario */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={
                usuario?.avatarUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  usuario?.nombre || 'Usuario'
                )}`
              }
              alt={usuario?.nombre}
              className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {usuario?.nombre} {usuario?.apellido}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge tamano="sm" variante="marca">
                  {usuario?.rol}
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            title="Cerrar sesión"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
