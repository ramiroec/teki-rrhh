import { Router } from 'express';
import {
  listarMarcaciones,
  obtenerResumenAsistencia,
  registrarMarcacionManual,
} from '../controladores/asistencia.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';
import { requerirRol } from '../middleware/permisos';

export const rutasAsistencia = Router();

rutasAsistencia.use(verificarAutenticacion as any);

rutasAsistencia.get('/marcaciones', listarMarcaciones as any);
rutasAsistencia.get('/resumen', obtenerResumenAsistencia as any);
rutasAsistencia.post('/marcaciones', requerirRol(['Administrador', 'RRHH']) as any, registrarMarcacionManual as any);
