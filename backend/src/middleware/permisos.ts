import { Response, NextFunction } from 'express';
import { SolicitudAutenticada, RolUsuario } from '../modelos/tipos';

export function requerirRol(rolesPermitidos: RolUsuario[]) {
  return (req: SolicitudAutenticada, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'No autorizado. Por favor inicie sesión.',
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Acceso denegado. No posee los permisos necesarios para realizar esta acción.',
      });
    }

    next();
  };
}
