import { Router } from 'express';
import {
  listarSectores,
  crearSector,
  actualizarSector,
  desactivarSector,
} from '../controladores/catalogos.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';
import { requerirRol } from '../middleware/permisos';

export const rutasSectores = Router();

rutasSectores.use(verificarAutenticacion as any);

rutasSectores.get('/', listarSectores as any);
rutasSectores.post('/', requerirRol(['Administrador', 'RRHH']) as any, crearSector as any);
rutasSectores.put('/:id', requerirRol(['Administrador', 'RRHH']) as any, actualizarSector as any);
rutasSectores.delete('/:id', requerirRol(['Administrador', 'RRHH']) as any, desactivarSector as any);
