import { Router } from 'express';
import { obtenerDashboardPrincipal, obtenerPanelRRHH } from '../controladores/reportes.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';

export const rutasReportes = Router();

rutasReportes.use(verificarAutenticacion as any);

rutasReportes.get('/dashboard', obtenerDashboardPrincipal as any);
rutasReportes.get('/panel-rrhh', obtenerPanelRRHH as any);
