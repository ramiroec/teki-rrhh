import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonFilaTabla } from './Skeleton';
import { EstadoVacio } from './EstadoVacio';

export interface ColumnaTabla<T> {
  clave: string;
  encabezado: string;
  render?: (fila: T, indice: number) => React.ReactNode;
  alineacion?: 'izquierda' | 'centro' | 'derecha';
  ancho?: string;
  ordenarPor?: string;
}

interface TablaProps<T> {
  columnas: ColumnaTabla<T>[];
  datos: T[];
  cargando?: boolean;
  claveId?: keyof T | ((fila: T) => string);
  alHacerClicFila?: (fila: T) => void;
  mensajeVacio?: string;
  subtituloVacio?: string;
  paginaActual?: number;
  totalPaginas?: number;
  alCambiarPagina?: (pagina: number) => void;
  className?: string;
}

export function Tabla<T extends Record<string, any>>({
  columnas,
  datos,
  cargando = false,
  claveId = 'id',
  alHacerClicFila,
  mensajeVacio = 'No se encontraron registros',
  subtituloVacio = 'Intente ajustando los filtros de búsqueda.',
  paginaActual = 1,
  totalPaginas = 1,
  alCambiarPagina,
  className = '',
}: TablaProps<T>) {
  const obtenerIdFila = (fila: T, idx: number): string => {
    if (typeof claveId === 'function') return claveId(fila);
    return String(fila[claveId] ?? idx);
  };

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-card ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              {columnas.map((col) => {
                const alineacion =
                  col.alineacion === 'derecha'
                    ? 'text-right'
                    : col.alineacion === 'centro'
                    ? 'text-center'
                    : 'text-left';
                return (
                  <th key={col.clave} style={{ width: col.ancho }} className={`py-3.5 px-4 ${alineacion}`}>
                    {col.encabezado}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {cargando ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonFilaTabla key={i} columnas={columnas.length} />
              ))
            ) : datos.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="py-8">
                  <EstadoVacio titulo={mensajeVacio} descripcion={subtituloVacio} />
                </td>
              </tr>
            ) : (
              datos.map((fila, idx) => (
                <tr
                  key={obtenerIdFila(fila, idx)}
                  onClick={() => alHacerClicFila && alHacerClicFila(fila)}
                  className={`group transition-colors ${
                    alHacerClicFila ? 'cursor-pointer hover:bg-slate-50/90' : 'hover:bg-slate-50/50'
                  }`}
                >
                  {columnas.map((col) => {
                    const alineacion =
                      col.alineacion === 'derecha'
                        ? 'text-right'
                        : col.alineacion === 'centro'
                        ? 'text-center'
                        : 'text-left';
                    return (
                      <td key={col.clave} className={`py-3 px-4 text-xs sm:text-sm ${alineacion}`}>
                        {col.render ? col.render(fila, idx) : (fila[col.clave] ?? '-')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación opcional */}
      {totalPaginas > 1 && alCambiarPagina && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-600">
          <div>
            Página <span className="font-semibold text-slate-800">{paginaActual}</span> de{' '}
            <span className="font-semibold text-slate-800">{totalPaginas}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => alCambiarPagina(paginaActual - 1)}
              disabled={paginaActual <= 1}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => alCambiarPagina(paginaActual + 1)}
              disabled={paginaActual >= totalPaginas}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
