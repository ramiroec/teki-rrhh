import React, { useState } from 'react';
import { Menu, Bell, Building, Globe, Check } from 'lucide-react';
import { useAutenticacion } from '../../contexto/AutenticacionContexto';
import { MigaDePan, ElementoMiga } from './MigaDePan';

interface BarraSuperiorProps {
  alAbrirMovil: () => void;
  migas?: ElementoMiga[];
}

export const BarraSuperior: React.FC<BarraSuperiorProps> = ({ alAbrirMovil, migas }) => {
  const { usuario } = useAutenticacion();
  const [menuEmpresasAbierto, setMenuEmpresasAbierto] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4 z-30 sticky top-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={alAbrirMovil}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {migas && migas.length > 0 ? (
          <MigaDePan elementos={migas} />
        ) : (
          <h1 className="text-sm font-semibold text-slate-800 truncate">
            Plataforma TEKI RRHH
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Indicador de Tenant Multi-empresa */}
        <div className="relative">
          <button
            onClick={() => setMenuEmpresasAbierto(!menuEmpresasAbierto)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline-block max-w-[160px] truncate">
              {usuario?.empresa?.nombre || 'TEKI Soluciones'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          </button>

          {menuEmpresasAbierto && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuEmpresasAbierto(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
                <p className="px-3 py-1.5 font-semibold text-slate-500 uppercase text-[10px]">
                  Aislamiento Multi-tenant
                </p>
                <div className="p-2.5 rounded-lg bg-brand-50/70 border border-brand-100 text-brand-900 mb-2">
                  <p className="font-semibold text-xs flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-brand-600" /> {usuario?.empresa?.nombre}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Sesión activa y aislada. Los datos y empleados pertenecen exclusivamente a esta empresa.
                  </p>
                </div>
                <div className="px-3 py-2 bg-slate-50 rounded-lg text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Moneda: </span>
                  {usuario?.empresa?.moneda} ({usuario?.empresa?.simboloMoneda})
                </div>
              </div>
            </>
          )}
        </div>

        {/* Campana de Notificaciones */}
        <button
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative cursor-pointer"
          title="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600" />
        </button>

        {/* Idioma y Región */}
        <div className="hidden sm:flex items-center gap-1 text-slate-500 text-xs font-medium px-2 py-1 bg-slate-50 rounded-md border border-slate-200">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>ES-PY</span>
        </div>
      </div>
    </header>
  );
};
