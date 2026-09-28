import { Router } from 'express';
import {
  listarCargos,
  crearCargo,
  actualizarCargo,
  desactivarCargo,
} from '../controladores/catalogos.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';
import { requerirRol } from '../middleware/permisos';

export const rutasCargos = Router();

rutasCargos.use(verificarAutenticacion as any);

rutasCargos.get('/', listarCargos as any);
rutasCargos.post('/', requerirRol(['Administrador', 'RRHH']) as any, crearCargo as any);
rutasCargos.put('/:id', requerirRol(['Administrador', 'RRHH']) as any, actualizarCargo as any);
rutasCargos.delete('/:id', requerirRol(['Administrador', 'RRHH']) as any, desactivarCargo as any);
