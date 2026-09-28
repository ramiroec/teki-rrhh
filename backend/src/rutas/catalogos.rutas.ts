import { Router } from 'express';
import {
  listarSectores, crearSector, actualizarSector, desactivarSector,
  listarDepartamentos, crearDepartamento, actualizarDepartamento, desactivarDepartamento,
  listarCargos, crearCargo, actualizarCargo, desactivarCargo,
  listarTiposContrato, crearTipoContrato,
  listarHorarios, crearHorario,
  listarConceptosSalariales, crearConceptoSalarial,
} from '../controladores/catalogos.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';
import { requerirRol } from '../middleware/permisos';

export const rutasCatalogos = Router();

rutasCatalogos.use(verificarAutenticacion as any);

// Sectores
rutasCatalogos.get('/sectores', listarSectores as any);
rutasCatalogos.post('/sectores', requerirRol(['Administrador', 'RRHH']) as any, crearSector as any);
rutasCatalogos.put('/sectores/:id', requerirRol(['Administrador', 'RRHH']) as any, actualizarSector as any);
rutasCatalogos.delete('/sectores/:id', requerirRol(['Administrador', 'RRHH']) as any, desactivarSector as any);

// Departamentos
rutasCatalogos.get('/departamentos', listarDepartamentos as any);
rutasCatalogos.post('/departamentos', requerirRol(['Administrador', 'RRHH']) as any, crearDepartamento as any);
rutasCatalogos.put('/departamentos/:id', requerirRol(['Administrador', 'RRHH']) as any, actualizarDepartamento as any);
rutasCatalogos.delete('/departamentos/:id', requerirRol(['Administrador', 'RRHH']) as any, desactivarDepartamento as any);

// Cargos
rutasCatalogos.get('/cargos', listarCargos as any);
rutasCatalogos.post('/cargos', requerirRol(['Administrador', 'RRHH']) as any, crearCargo as any);
rutasCatalogos.put('/cargos/:id', requerirRol(['Administrador', 'RRHH']) as any, actualizarCargo as any);
rutasCatalogos.delete('/cargos/:id', requerirRol(['Administrador', 'RRHH']) as any, desactivarCargo as any);

// Tipos de Contrato
rutasCatalogos.get('/tipos-contrato', listarTiposContrato as any);
rutasCatalogos.post('/tipos-contrato', requerirRol(['Administrador', 'RRHH']) as any, crearTipoContrato as any);

// Horarios
rutasCatalogos.get('/horarios', listarHorarios as any);
rutasCatalogos.post('/horarios', requerirRol(['Administrador', 'RRHH']) as any, crearHorario as any);

// Conceptos Salariales
rutasCatalogos.get('/conceptos-salariales', listarConceptosSalariales as any);
rutasCatalogos.post('/conceptos-salariales', requerirRol(['Administrador', 'RRHH']) as any, crearConceptoSalarial as any);
