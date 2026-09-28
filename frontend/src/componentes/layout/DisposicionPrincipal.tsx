import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BarraLateral } from './BarraLateral';
import { BarraSuperior } from './BarraSuperior';
import { ElementoMiga } from './MigaDePan';

interface DisposicionPrincipalProps {
  migas?: ElementoMiga[];
}

export const DisposicionPrincipal: React.FC<DisposicionPrincipalProps> = ({ migas }) => {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Barra Lateral en Desktop */}
      <div className="hidden lg:flex shrink-0">
        <BarraLateral />
      </div>

      {/* Drawer Móvil para Barra Lateral */}
      {menuMovilAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuMovilAbierto(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <BarraLateral alCerrarMovil={() => setMenuMovilAbierto(false)} />
          </div>
        </div>
      )}

      {/* Área de Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <BarraSuperior alAbrirMovil={() => setMenuMovilAbierto(true)} migas={migas} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
