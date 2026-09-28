import React from 'react';
import { FolderSearch } from 'lucide-react';
import { Boton } from './Boton';

interface EstadoVacioProps {
  icono?: React.ReactNode;
  titulo: string;
  descripcion: string;
  accionTexto?: string;
  alAccionar?: () => void;
  className?: string;
}

export const EstadoVacio: React.FC<EstadoVacioProps> = ({
  icono,
  titulo,
  descripcion,
  accionTexto,
  alAccionar,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 my-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        {icono || <FolderSearch className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-semibold text-slate-800">{titulo}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">{descripcion}</p>
      {accionTexto && alAccionar && (
        <Boton variante="primario" tamano="sm" onClick={alAccionar}>
          {accionTexto}
        </Boton>
      )}
    </div>
  );
};
