import React from 'react';
import { Loader2 } from 'lucide-react';

interface BotonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'esquema' | 'peligro' | 'fantasma';
  tamano?: 'sm' | 'md' | 'lg';
  cargando?: boolean;
  icono?: React.ReactNode;
  iconoDerecha?: React.ReactNode;
}

export const Boton: React.FC<BotonProps> = ({
  children,
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  icono,
  iconoDerecha,
  className = '',
  disabled,
  ...props
}) => {
  const estilosBase = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantes = {
    primario: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm focus:ring-brand-500 active:scale-[0.99]',
    secundario: 'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 active:scale-[0.99]',
    esquema: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm focus:ring-brand-500 active:scale-[0.99]',
    peligro: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500 active:scale-[0.99]',
    fantasma: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300',
  };

  const tamanos = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={`${estilosBase} ${variantes[variante]} ${tamanos[tamano]} ${className}`}
      disabled={disabled || cargando}
      {...props}
    >
      {cargando ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        icono && <span className="shrink-0">{icono}</span>
      )}
      {children}
      {!cargando && iconoDerecha && <span className="shrink-0">{iconoDerecha}</span>}
    </button>
  );
};
