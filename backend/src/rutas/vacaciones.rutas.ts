import { Router } from 'express';
import {
  listarSolicitudesVacaciones,
  obtenerSaldoVacaciones,
  crearSolicitudVacaciones,
  responderSolicitudVacaciones,
  obtenerCalendarioVacaciones,
  cancelarSolicitudVacaciones,
} from '../controladores/vacaciones.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';
import { requerirRol } from '../middleware/permisos';

export const rutasVacaciones = Router();

rutasVacaciones.use(verificarAutenticacion as any);

rutasVacaciones.get('/solicitudes', listarSolicitudesVacaciones as any);
rutasVacaciones.get('/saldo', obtenerSaldoVacaciones as any);
rutasVacaciones.get('/calendario', obtenerCalendarioVacaciones as any);
rutasVacaciones.post('/solicitudes', crearSolicitudVacaciones as any);
rutasVacaciones.patch('/solicitudes/:id/responder', requerirRol(['Administrador', 'RRHH']) as any, responderSolicitudVacaciones as any);
rutasVacaciones.patch('/solicitudes/:id/cancelar', cancelarSolicitudVacaciones as any);
