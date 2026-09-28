import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  abierto: boolean;
  alCerrar: () => void;
  titulo?: React.ReactNode;
  subtitulo?: React.ReactNode;
  children: React.ReactNode;
  pie?: React.ReactNode;
  tamano?: 'md' | 'lg' | 'xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  abierto,
  alCerrar,
  titulo,
  subtitulo,
  children,
  pie,
  tamano = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto) {
        alCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (abierto) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  const tamanos = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={alCerrar}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen ${tamanos[tamano]} bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300`}
        >
          {/* Cabecera */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              {titulo && <h3 className="text-lg font-semibold text-slate-900">{titulo}</h3>}
              {subtitulo && <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>}
            </div>
            <button
              onClick={alCerrar}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo con scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {/* Pie opcional */}
          {pie && (
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
              {pie}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
