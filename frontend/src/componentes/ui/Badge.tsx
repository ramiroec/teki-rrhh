import React from 'react';

export type VarianteBadge =
  | 'exito'
  | 'alerta'
  | 'peligro'
  | 'info'
  | 'neutro'
  | 'marca'
  | 'purpura';

interface BadgeProps {
  children: React.ReactNode;
  variante?: VarianteBadge;
  conPunto?: boolean;
  tamano?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variante,
  conPunto = true,
  tamano = 'md',
  className = '',
}) => {
  // Autodetección de variante si no se especifica explícitamente según texto del estado
  let varFinal = variante;
  if (!varFinal && typeof children === 'string') {
    const texto = children.toLowerCase();
    if (texto.includes('activo') || texto.includes('aprob') || texto.includes('presente') || texto.includes('confirmado') || texto.includes('emitido')) {
      varFinal = 'exito';
    } else if (texto.includes('pendiente') || texto.includes('tardía') || texto.includes('prueba') || texto.includes('borrador')) {
      varFinal = 'alerta';
    } else if (texto.includes('baja') || texto.includes('rechaz') || texto.includes('cancel') || texto.includes('ausente') || texto.includes('inactivo')) {
      varFinal = 'peligro';
    } else if (texto.includes('vacacion')) {
      varFinal = 'info';
    } else if (texto.includes('calculado') || texto.includes('permiso')) {
      varFinal = 'purpura';
    } else {
      varFinal = 'neutro';
    }
  } else if (!varFinal) {
    varFinal = 'neutro';
  }

  const estilosVariantes = {
    exito: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    alerta: 'bg-amber-50 text-amber-700 border-amber-200/80',
    peligro: 'bg-rose-50 text-rose-700 border-rose-200/80',
    info: 'bg-sky-50 text-sky-700 border-sky-200/80',
    marca: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    purpura: 'bg-purple-50 text-purple-700 border-purple-200/80',
    neutro: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const estilosPunto = {
    exito: 'bg-emerald-500',
    alerta: 'bg-amber-500',
    peligro: 'bg-rose-500',
    info: 'bg-sky-500',
    marca: 'bg-indigo-500',
    purpura: 'bg-purple-500',
    neutro: 'bg-slate-400',
  };

  const tamanos = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-2xs ${estilosVariantes[varFinal]} ${tamanos[tamano]} ${className}`}
    >
      {conPunto && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${estilosPunto[varFinal]}`} />
      )}
      {children}
    </span>
  );
};
