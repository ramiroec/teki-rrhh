import { Router } from 'express';
import { listarRecibos, obtenerReciboPorId } from '../controladores/recibos.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';

export const rutasRecibos = Router();

rutasRecibos.use(verificarAutenticacion as any);

rutasRecibos.get('/', listarRecibos as any);
rutasRecibos.get('/:id', obtenerReciboPorId as any);
