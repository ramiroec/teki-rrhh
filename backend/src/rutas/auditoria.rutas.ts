import { Router } from 'express';
import { listarAuditoria } from '../controladores/auditoria.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';
import { requerirRol } from '../middleware/permisos';

export const rutasAuditoria = Router();

rutasAuditoria.use(verificarAutenticacion as any);
rutasAuditoria.get('/', requerirRol(['Administrador', 'RRHH']) as any, listarAuditoria as any);
