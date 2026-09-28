import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { enrutadorPrincipal } from './rutas';
import { pool } from './config/db';

dotenv.config();

const app = express();
const PUERTO = process.env.PORT || 3001;

// Configuración de CORS
const origenesPermitidos = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (ej. curl, tests internos) o en la lista
      if (!origin || origenesPermitidos.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // En desarrollo permitir orígenes locales
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Verificación de estado de salud del servicio y base de datos
app.get('/api/salud', async (_req: Request, res: Response) => {
  try {
    const resDb = await pool.query('SELECT NOW() as ahora, version()');
    return res.json({
      exito: true,
      mensaje: 'Plataforma TEKI RRHH SaaS operativa.',
      tiempo: resDb.rows[0].ahora,
      baseDatos: 'Conectada exitosamente',
    });
  } catch (error) {
    return res.status(503).json({
      exito: false,
      mensaje: 'Servicio en mantenimiento o base de datos no disponible temporalmente.',
    });
  }
});

// Enrutar API principal
app.use('/api', enrutadorPrincipal);

// Manejador para rutas no encontradas
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    exito: false,
    mensaje: 'El recurso solicitado no fue encontrado.',
  });
});

// Manejador centralizado de errores (mensajes amigables para el usuario)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error no controlado en la aplicación:', err);
  const estado = err.status || 500;
  const mensaje =
    estado === 500
      ? 'No pudimos procesar la operación. Por favor verifique los datos e intente nuevamente.'
      : err.message || 'Ocurrió un error inesperado.';

  res.status(estado).json({
    exito: false,
    mensaje,
    codigo: err.code || 'ERROR_INTERNO',
  });
});

app.listen(PUERTO, () => {
  console.log(`🚀 Servidor TEKI RRHH SaaS API ejecutándose en http://localhost:${PUERTO}`);
  console.log(`📡 Rutas disponibles bajo http://localhost:${PUERTO}/api`);
});
