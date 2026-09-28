import { Response } from 'express';
import { pool } from '../config/db';
import { SolicitudAutenticada } from '../modelos/tipos';

export async function listarAuditoria(req: SolicitudAutenticada, res: Response) {
  try {
    const { entidad, accion, usuario } = req.query;

    let consulta = `
      SELECT *
      FROM auditoria
      WHERE empresa_id = $1
    `;
    const params: any[] = [req.empresaId];

    if (entidad) {
      params.push(entidad);
      consulta += ` AND entidad = $${params.length}`;
    }
    if (accion) {
      params.push(accion);
      consulta += ` AND accion = $${params.length}`;
    }
    if (usuario) {
      params.push(`%${usuario}%`);
      consulta += ` AND usuario_nombre ILIKE $${params.length}`;
    }

    consulta += ` ORDER BY creado_en DESC LIMIT 100`;

    const resultado = await pool.query(consulta, params);

    return res.json({
      exito: true,
      datos: resultado.rows,
    });
  } catch (error) {
    console.error('Error al listar auditoría:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar logs de auditoría.' });
  }
}
