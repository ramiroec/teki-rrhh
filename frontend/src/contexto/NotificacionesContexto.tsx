import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type TipoNotificacion = 'exito' | 'error' | 'advertencia' | 'info';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo?: string;
  mensaje: string;
  duracion?: number;
}

interface ContextoNotificacionesValor {
  notificaciones: Notificacion[];
  notificar: (notif: Omit<Notificacion, 'id'>) => void;
  notificarExito: (mensaje: string, titulo?: string) => void;
  notificarError: (mensaje: string, titulo?: string) => void;
  notificarInfo: (mensaje: string, titulo?: string) => void;
  notificarAdvertencia: (mensaje: string, titulo?: string) => void;
  cerrar: (id: string) => void;
}

const ContextoNotificaciones = createContext<ContextoNotificacionesValor | undefined>(undefined);

export const ProveedorNotificaciones: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  const cerrar = useCallback((id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notificar = useCallback(
    ({ tipo, titulo, mensaje, duracion = 4000 }: Omit<Notificacion, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const nueva: Notificacion = { id, tipo, titulo, mensaje, duracion };
      setNotificaciones((prev) => [...prev, nueva]);

      if (duracion > 0) {
        setTimeout(() => {
          cerrar(id);
        }, duracion);
      }
    },
    [cerrar]
  );

  const notificarExito = useCallback((mensaje: string, titulo = 'Operación exitosa') => {
    notificar({ tipo: 'exito', titulo, mensaje });
  }, [notificar]);

  const notificarError = useCallback((mensaje: string, titulo = 'Atención') => {
    notificar({ tipo: 'error', titulo, mensaje, duracion: 6000 });
  }, [notificar]);

  const notificarInfo = useCallback((mensaje: string, titulo = 'Información') => {
    notificar({ tipo: 'info', titulo, mensaje });
  }, [notificar]);

  const notificarAdvertencia = useCallback((mensaje: string, titulo = 'Advertencia') => {
    notificar({ tipo: 'advertencia', titulo, mensaje });
  }, [notificar]);

  return (
    <ContextoNotificaciones.Provider
      value={{
        notificaciones,
        notificar,
        notificarExito,
        notificarError,
        notificarInfo,
        notificarAdvertencia,
        cerrar,
      }}
    >
      {children}
      {/* Contenedor flotante de notificaciones Toast */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4">
        {notificaciones.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-floating border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${
              n.tipo === 'exito'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : n.tipo === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                : n.tipo === 'advertencia'
                ? 'bg-amber-50/95 border-amber-200 text-amber-900'
                : 'bg-blue-50/95 border-blue-200 text-blue-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {n.tipo === 'exito' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {n.tipo === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {n.tipo === 'advertencia' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {n.tipo === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              {n.titulo && <p className="text-sm font-semibold">{n.titulo}</p>}
              <p className="text-xs leading-relaxed text-slate-700 mt-0.5">{n.mensaje}</p>
            </div>
            <button
              onClick={() => cerrar(n.id)}
              className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ContextoNotificaciones.Provider>
  );
};

export const useNotificaciones = () => {
  const contexto = useContext(ContextoNotificaciones);
  if (!contexto) {
    throw new Error('useNotificaciones debe usarse dentro de un ProveedorNotificaciones');
  }
  return contexto;
};
