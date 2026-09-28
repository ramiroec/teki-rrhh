import { pool } from '../config/db';

export async function registrarAuditoria(params: {
  empresaId: string;
  usuarioId?: string | null;
  usuarioNombre: string;
  accion: string;
  entidad: string;
  entidadId?: string | string[] | null;
  detalles?: any;
  ip?: string;
}) {
  try {
    const idCadena = Array.isArray(params.entidadId) ? params.entidadId.join(',') : (params.entidadId || null);
    await pool.query(
      `INSERT INTO auditoria (empresa_id, usuario_id, usuario_nombre, accion, entidad, entidad_id, detalles, ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        params.empresaId,
        params.usuarioId || null,
        params.usuarioNombre,
        params.accion,
        params.entidad,
        idCadena,
        params.detalles ? JSON.stringify(params.detalles) : null,
        params.ip || '127.0.0.1',
      ]
    );
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
}
