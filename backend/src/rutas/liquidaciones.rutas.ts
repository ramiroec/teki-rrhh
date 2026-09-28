import { Router } from 'express';
import {
  listarPeriodos,
  crearPeriodo,
  obtenerPeriodoPorId,
  calcularLiquidacionesPeriodo,
  actualizarLiquidacionIndividual,
  confirmarPeriodoYGenerarRecibos,
} from '../controladores/liquidaciones.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';
import { requerirRol } from '../middleware/permisos';

export const rutasLiquidaciones = Router();

rutasLiquidaciones.use(verificarAutenticacion as any);

rutasLiquidaciones.get('/periodos', listarPeriodos as any);
rutasLiquidaciones.post('/periodos', requerirRol(['Administrador', 'RRHH']) as any, crearPeriodo as any);
rutasLiquidaciones.get('/periodos/:id', obtenerPeriodoPorId as any);
rutasLiquidaciones.post('/periodos/:id/calcular', requerirRol(['Administrador', 'RRHH']) as any, calcularLiquidacionesPeriodo as any);
rutasLiquidaciones.put('/:id', requerirRol(['Administrador', 'RRHH']) as any, actualizarLiquidacionIndividual as any);
rutasLiquidaciones.post('/periodos/:id/confirmar', requerirRol(['Administrador', 'RRHH']) as any, confirmarPeriodoYGenerarRecibos as any);
