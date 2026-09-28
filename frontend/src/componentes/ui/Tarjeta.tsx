import React from 'react';

interface TarjetaProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Tarjeta: React.FC<TarjetaProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 shadow-card transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-elevation' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const TarjetaEncabezado: React.FC<{
  titulo?: React.ReactNode;
  subtitulo?: React.ReactNode;
  accion?: React.ReactNode;
  icono?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}> = ({ titulo, subtitulo, accion, icono, className = '', children }) => {
  return (
    <div className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`}>
      {children || (
        <>
          <div className="flex items-center gap-3 min-w-0">
            {icono && (
              <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                {icono}
              </div>
            )}
            <div className="min-w-0">
              {titulo && <h3 className="text-base font-semibold text-slate-900 truncate">{titulo}</h3>}
              {subtitulo && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitulo}</p>}
            </div>
          </div>
          {accion && <div className="shrink-0">{accion}</div>}
        </>
      )}
    </div>
  );
};

export const TarjetaCuerpo: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

export const TarjetaPie: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-xs text-slate-500 ${className}`}>
      {children}
    </div>
  );
};
