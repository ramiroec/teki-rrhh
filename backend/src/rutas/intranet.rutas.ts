import { Router } from 'express';
import {
  listarSalas, crearSala,
  listarReuniones, crearReunion,
  listarNoticias, crearNoticia
} from '../controladores/intranet.controlador';
import { verificarAutenticacion } from '../middleware/autenticacion';
import { requerirRol } from '../middleware/permisos';

export const rutasIntranet = Router();

rutasIntranet.use(verificarAutenticacion as any);

// Salas
rutasIntranet.get('/salas', listarSalas as any);
rutasIntranet.post('/salas', requerirRol(['Administrador', 'RRHH']) as any, crearSala as any);

// Reuniones
rutasIntranet.get('/reuniones', listarReuniones as any);
rutasIntranet.post('/reuniones', crearReunion as any);

// Noticias
rutasIntranet.get('/noticias', listarNoticias as any);
rutasIntranet.post('/noticias', requerirRol(['Administrador', 'RRHH', 'Comunicaciones']) as any, crearNoticia as any);
