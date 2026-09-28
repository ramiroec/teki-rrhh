import { Router } from 'express';
import {
  listarEmpleados,
  obtenerEmpleadoPorId,
  crearEmpleado,
  actualizarEmpleado,
  cambiarEstadoEmpleado,
  agregarDocumentoEmpleado,
} from '../controladores/empleados.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';
import { requerirRol } from '../middleware/permisos';

export const rutasEmpleados = Router();

rutasEmpleados.use(verificarAutenticacion as any);

rutasEmpleados.get('/', listarEmpleados as any);
rutasEmpleados.get('/:id', obtenerEmpleadoPorId as any);
rutasEmpleados.post('/', requerirRol(['Administrador', 'RRHH']) as any, crearEmpleado as any);
rutasEmpleados.put('/:id', requerirRol(['Administrador', 'RRHH']) as any, actualizarEmpleado as any);
rutasEmpleados.patch('/:id/estado', requerirRol(['Administrador', 'RRHH']) as any, cambiarEstadoEmpleado as any);
rutasEmpleados.post('/:id/documentos', requerirRol(['Administrador', 'RRHH']) as any, agregarDocumentoEmpleado as any);
