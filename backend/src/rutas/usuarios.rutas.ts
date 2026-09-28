import { Router } from 'express';
import { listarUsuarios, crearUsuario, actualizarUsuario } from '../controladores/usuarios.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';
import { requerirRol } from '../middleware/permisos';

export const rutasUsuarios = Router();

rutasUsuarios.use(verificarAutenticacion as any);

rutasUsuarios.get('/', requerirRol(['Administrador', 'RRHH']) as any, listarUsuarios as any);
rutasUsuarios.post('/', requerirRol(['Administrador']) as any, crearUsuario as any);
rutasUsuarios.put('/:id', requerirRol(['Administrador']) as any, actualizarUsuario as any);
