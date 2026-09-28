import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SolicitudAutenticada, UsuarioAutenticado } from '../modelos/tipos';

const JWT_SECRET = process.env.JWT_SECRET || 'teki_rrhh_super_secreto_seguro_2027_production_key_saas';

export function verificarAutenticacion(req: SolicitudAutenticada, res: Response, next: NextFunction) {
  try {
    const cabeceraAutorizacion = req.headers.authorization;
    if (!cabeceraAutorizacion || !cabeceraAutorizacion.startsWith('Bearer ')) {
      return res.status(401).json({
        exito: false,
        mensaje: 'No se proporcionó token de autenticación válido.',
      });
    }

    const token = cabeceraAutorizacion.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET) as UsuarioAutenticado;

    req.usuario = payload;
    req.empresaId = payload.empresaId;

    next();
  } catch (error) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Su sesión ha expirado o el token es inválido. Por favor, inicie sesión nuevamente.',
    });
  }
}
