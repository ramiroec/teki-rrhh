import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface ElementoMiga {
  titulo: string;
  ruta?: string;
}

export const MigaDePan: React.FC<{ elementos: ElementoMiga[] }> = ({ elementos }) => {
  return (
    <nav className="flex items-center text-xs text-slate-500 gap-1.5" aria-label="Breadcrumb">
      <Link to="/" className="flex items-center hover:text-slate-800 transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {elementos.map((item, index) => {
        const esUltimo = index === elementos.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {item.ruta && !esUltimo ? (
              <Link to={item.ruta} className="hover:text-slate-800 transition-colors font-medium">
                {item.titulo}
              </Link>
            ) : (
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                {item.titulo}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
