import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  etiqueta?: string;
  error?: string;
  ayuda?: string;
  icono?: React.ReactNode;
  iconoDerecha?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ etiqueta, error, ayuda, icono, iconoDerecha, className = '', id, ...props }, ref) => {
    const inputId = id || (etiqueta ? etiqueta.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {etiqueta && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
            {etiqueta} {props.required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-2xs">
          {icono && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {icono}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`block w-full rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              icono ? 'pl-9' : 'pl-3.5'
            } ${iconoDerecha ? 'pr-9' : 'pr-3.5'} py-2 ${
              error
                ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 text-slate-800 placeholder-slate-400 hover:border-slate-400 focus:border-brand-500 focus:ring-brand-100 bg-white'
            } ${className}`}
            {...props}
          />
          {iconoDerecha && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
              {iconoDerecha}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
        {ayuda && !error && <p className="mt-1 text-xs text-slate-500">{ayuda}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
