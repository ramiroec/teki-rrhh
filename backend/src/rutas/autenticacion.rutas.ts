import { Router } from 'express';
import { iniciarSesion, obtenerUsuarioActual, listarEmpresasDemo } from '../controladores/autenticacion.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';

export const rutasAutenticacion = Router();

rutasAutenticacion.post('/iniciar-sesion', iniciarSesion as any);
rutasAutenticacion.get('/yo', verificarAutenticacion as any, obtenerUsuarioActual as any);
rutasAutenticacion.get('/empresas-demo', listarEmpresasDemo as any);
