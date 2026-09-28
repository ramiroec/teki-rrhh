import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL no está definida en las variables de entorno.');
}

export const pool = new Pool({
  connectionString,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el cliente del pool PostgreSQL:', err);
});

export const consultar = async (text: string, params?: any[]) => {
  const inicio = Date.now();
  const res = await pool.query(text, params);
  const duracion = Date.now() - inicio;
  if (process.env.NODE_ENV === 'development' && duracion > 200) {
    console.log('Consulta ejecutada en', duracion, 'ms:', { text, filas: res.rowCount });
  }
  return res;
};
