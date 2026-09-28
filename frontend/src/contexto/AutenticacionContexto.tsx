import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Usuario } from '../tipos';
import { api } from '../servicios/api';

interface ContextoAutenticacionValor {
  usuario: Usuario | null;
  cargando: boolean;
  estaAutenticado: boolean;
  iniciarSesion: (email: string, pass: string, recordar?: boolean) => Promise<{ exito: boolean; mensaje?: string }>;
  cerrarSesion: () => void;
  refrescarUsuario: () => Promise<void>;
  esAdmin: boolean;
  esRRHH: boolean;
  esColaborador: boolean;
}

const ContextoAutenticacion = createContext<ContextoAutenticacionValor | undefined>(undefined);

export const ProveedorAutenticacion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  const refrescarUsuario = useCallback(async () => {
    const token = localStorage.getItem('teki_token') || sessionStorage.getItem('teki_token');
    if (!token) {
      setUsuario(null);
      setCargando(false);
      return;
    }

    try {
      const res = await api.get<Usuario>('/autenticacion/yo');
      if (res.exito && res.datos) {
        setUsuario(res.datos);
      } else {
        localStorage.removeItem('teki_token');
        sessionStorage.removeItem('teki_token');
        setUsuario(null);
      }
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refrescarUsuario();
  }, [refrescarUsuario]);

  const iniciarSesion = async (email: string, pass: string, recordar: boolean = true) => {
    try {
      const res = await api.post<{ token: string; usuario: Usuario }>('/autenticacion/iniciar-sesion', {
        email,
        password: pass,
      });

      if (res.exito && res.datos) {
        const { token, usuario: usuarioLogueado } = res.datos;
        if (recordar) {
          localStorage.setItem('teki_token', token);
        } else {
          sessionStorage.setItem('teki_token', token);
        }
        setUsuario(usuarioLogueado);
        return { exito: true };
      }

      return { exito: false, mensaje: res.mensaje || 'Credenciales inválidas' };
    } catch (error) {
      return { exito: false, mensaje: 'Error al conectar con el servidor' };
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('teki_token');
    sessionStorage.removeItem('teki_token');
    setUsuario(null);
    window.location.href = '/iniciar-sesion';
  };

  const rol = usuario?.rol;
  const esAdmin = rol === 'Administrador';
  const esRRHH = rol === 'Administrador' || rol === 'RRHH';
  const esColaborador = rol === 'Colaborador';

  return (
    <ContextoAutenticacion.Provider
      value={{
        usuario,
        cargando,
        estaAutenticado: !!usuario,
        iniciarSesion,
        cerrarSesion,
        refrescarUsuario,
        esAdmin,
        esRRHH,
        esColaborador,
      }}
    >
      {children}
    </ContextoAutenticacion.Provider>
  );
};

export const useAutenticacion = () => {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) {
    throw new Error('useAutenticacion debe usarse dentro de un ProveedorAutenticacion');
  }
  return contexto;
};
