import { Router } from 'express';
import {
  listarDepartamentos,
  crearDepartamento,
  actualizarDepartamento,
  desactivarDepartamento,
} from '../controladores/catalogos.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';
import { requerirRol } from '../middleware/permisos';

export const rutasDepartamentos = Router();

rutasDepartamentos.use(verificarAutenticacion as any);

rutasDepartamentos.get('/', listarDepartamentos as any);
rutasDepartamentos.post('/', requerirRol(['Administrador', 'RRHH']) as any, crearDepartamento as any);
rutasDepartamentos.put('/:id', requerirRol(['Administrador', 'RRHH']) as any, actualizarDepartamento as any);
rutasDepartamentos.delete('/:id', requerirRol(['Administrador', 'RRHH']) as any, desactivarDepartamento as any);
