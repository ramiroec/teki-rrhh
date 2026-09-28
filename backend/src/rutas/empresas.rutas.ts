import { Router } from 'express';
import { obtenerEmpresaActual, actualizarConfiguracionEmpresa } from '../controladores/empresas.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';
import { requerirRol } from '../middleware/permisos';

export const rutasEmpresas = Router();

rutasEmpresas.use(verificarAutenticacion as any);
rutasEmpresas.get('/actual', obtenerEmpresaActual as any);
rutasEmpresas.put('/configuracion', requerirRol(['Administrador']) as any, actualizarConfiguracionEmpresa as any);
