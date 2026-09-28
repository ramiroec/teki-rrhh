import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta?: string;
  error?: string;
  ayuda?: string;
  opciones?: { valor: string | number; texto: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ etiqueta, error, ayuda, opciones, children, className = '', id, ...props }, ref) => {
    const selectId = id || (etiqueta ? etiqueta.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {etiqueta && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1.5">
            {etiqueta} {props.required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-2xs">
          <select
            id={selectId}
            ref={ref}
            className={`block w-full rounded-lg border text-sm py-2 px-3 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              error
                ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 text-slate-800 hover:border-slate-400 focus:border-brand-500 focus:ring-brand-100'
            } ${className}`}
            {...props}
          >
            {opciones
              ? opciones.map((op) => (
                  <option key={op.valor} value={op.valor}>
                    {op.texto}
                  </option>
                ))
              : children}
          </select>
        </div>
        {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
        {ayuda && !error && <p className="mt-1 text-xs text-slate-500">{ayuda}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
