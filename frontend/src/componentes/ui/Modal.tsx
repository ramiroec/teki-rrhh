import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  abierto: boolean;
  alCerrar: () => void;
  titulo?: React.ReactNode;
  subtitulo?: React.ReactNode;
  children: React.ReactNode;
  pie?: React.ReactNode;
  tamano?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'completo';
}

export const Modal: React.FC<ModalProps> = ({
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
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    completo: 'max-w-[95vw]',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Fondo con desenfoque suave */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={alCerrar}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full ${tamanos[tamano]} border border-slate-200 animate-in zoom-in-95 duration-200`}
        >
          {/* Encabezado */}
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

          {/* Cuerpo */}
          <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">{children}</div>

          {/* Pie */}
          {pie && (
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
              {pie}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
