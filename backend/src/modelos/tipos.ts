import { Request } from 'express';

export type RolUsuario = 'Administrador' | 'RRHH' | 'Colaborador' | 'Comunicaciones';

export interface UsuarioAutenticado {
  id: string;
  empresaId: string;
  empleadoId?: string | null;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  empresaNombre?: string;
  empresaSimboloMoneda?: string;
}

export interface SolicitudAutenticada extends Request {
  usuario?: UsuarioAutenticado;
  empresaId?: string;
}
