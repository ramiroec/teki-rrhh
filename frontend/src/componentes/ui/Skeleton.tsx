import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-slate-200/80 rounded-md ${className}`} />;
};

export const SkeletonFilaTabla: React.FC<{ columnas?: number }> = ({ columnas = 5 }) => {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      {Array.from({ length: columnas }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-4 bg-slate-200/70 rounded w-full" />
        </td>
      ))}
    </tr>
  );
};
