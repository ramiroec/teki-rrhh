import { Router } from 'express';
import { rutasAutenticacion } from './autenticacion.rutas';
import { rutasEmpresas } from './empresas.rutas';
import { rutasUsuarios } from './usuarios.rutas';
import { rutasEmpleados } from './empleados.rutas';
import { rutasCatalogos } from './catalogos.rutas';
import { rutasAsistencia } from './asistencia.rutas';
import { rutasVacaciones } from './vacaciones.rutas';
import { rutasLiquidaciones } from './liquidaciones.rutas';
import { rutasRecibos } from './recibos.rutas';
import { rutasReportes } from './reportes.rutas';
import { rutasAuditoria } from './auditoria.rutas';
import { rutasIntranet } from './intranet.rutas';

import { rutasSectores } from './sectores.rutas';
import { rutasDepartamentos } from './departamentos.rutas';
import { rutasCargos } from './cargos.rutas';

export const enrutadorPrincipal = Router();

enrutadorPrincipal.use('/autenticacion', rutasAutenticacion);
enrutadorPrincipal.use('/empresas', rutasEmpresas);
enrutadorPrincipal.use('/usuarios', rutasUsuarios);
enrutadorPrincipal.use('/empleados', rutasEmpleados);
enrutadorPrincipal.use('/sectores', rutasSectores);
enrutadorPrincipal.use('/departamentos', rutasDepartamentos);
enrutadorPrincipal.use('/cargos', rutasCargos);
enrutadorPrincipal.use('/catalogos', rutasCatalogos);
enrutadorPrincipal.use('/asistencia', rutasAsistencia);
enrutadorPrincipal.use('/vacaciones', rutasVacaciones);
enrutadorPrincipal.use('/liquidaciones', rutasLiquidaciones);
enrutadorPrincipal.use('/recibos', rutasRecibos);
enrutadorPrincipal.use('/reportes', rutasReportes);
enrutadorPrincipal.use('/auditoria', rutasAuditoria);
enrutadorPrincipal.use('/intranet', rutasIntranet);
