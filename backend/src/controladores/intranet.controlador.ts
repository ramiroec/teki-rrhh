import { Response } from 'express';
import { pool } from '../config/db';
import { SolicitudAutenticada } from '../modelos/tipos';
import { registrarAuditoria } from '../servicios/auditoria';

// SALAS DE REUNIONES
export async function listarSalas(req: SolicitudAutenticada, res: Response) {
  try {
    const resu = await pool.query(
      `SELECT * FROM salas WHERE empresa_id = $1 AND activo = true ORDER BY nombre ASC`,
      [req.empresaId]
    );
    return res.json({ exito: true, datos: resu.rows });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al listar salas.' });
  }
}

export async function crearSala(req: SolicitudAutenticada, res: Response) {
  try {
    const { nombre, tipo, capacidad, ubicacion, equipamiento, enlace_virtual } = req.body;
    const resu = await pool.query(
      `INSERT INTO salas (empresa_id, nombre, tipo, capacidad, ubicacion, equipamiento, enlace_virtual)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.empresaId, nombre, tipo || 'FISICA', capacidad || 10, ubicacion, equipamiento || [], enlace_virtual]
    );
    return res.status(201).json({ exito: true, datos: resu.rows[0] });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al crear sala.' });
  }
}

// REUNIONES
export async function listarReuniones(req: SolicitudAutenticada, res: Response) {
  try {
    const resu = await pool.query(
      `SELECT r.*, s.nombre as sala_nombre, s.ubicacion as sala_ubicacion,
              CONCAT(u.nombre, ' ', u.apellido) as organizador_nombre
       FROM reuniones r
       LEFT JOIN salas s ON s.id = r.sala_id
       LEFT JOIN usuarios u ON u.id = r.organizador_id
       WHERE r.empresa_id = $1
       ORDER BY r.fecha_inicio ASC`,
      [req.empresaId]
    );
    return res.json({ exito: true, datos: resu.rows });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al listar reuniones.' });
  }
}

export async function crearReunion(req: SolicitudAutenticada, res: Response) {
  try {
    const { titulo, descripcion, modalidad, sala_id, fecha_inicio, fecha_fin, enlace_reunion, plataforma } = req.body;

    // Verificar posibles conflictos de horario de sala si es presencial o híbrida
    if (sala_id) {
      const resConflicto = await pool.query(
        `SELECT id, titulo, fecha_inicio, fecha_fin
         FROM reuniones
         WHERE sala_id = $1 AND empresa_id = $2 AND estado != 'CANCELADA'
           AND (fecha_inicio < $4 AND fecha_fin > $3)`,
        [sala_id, req.empresaId, fecha_inicio, fecha_fin]
      );
      if (resConflicto.rows.length > 0) {
        return res.status(409).json({
          exito: false,
          mensaje: `Conflicto de sala: Ya existe la reunión "${resConflicto.rows[0].titulo}" programada en ese horario.`,
        });
      }
    }

    const resu = await pool.query(
      `INSERT INTO reuniones (empresa_id, titulo, descripcion, modalidad, sala_id, organizador_id, fecha_inicio, fecha_fin, enlace_reunion, plataforma)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        req.empresaId, titulo, descripcion, modalidad || 'PRESENCIAL', sala_id || null,
        req.usuario?.id, fecha_inicio, fecha_fin, enlace_reunion, plataforma || 'MEET'
      ]
    );

    return res.status(201).json({ exito: true, mensaje: 'Reunión programada.', datos: resu.rows[0] });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al programar reunión.' });
  }
}

// NOTICIAS INTRANET
export async function listarNoticias(req: SolicitudAutenticada, res: Response) {
  try {
    const resu = await pool.query(
      `SELECT n.*, CONCAT(u.nombre, ' ', u.apellido) as autor_nombre
       FROM noticias_intranet n
       LEFT JOIN usuarios u ON u.id = n.publicado_por
       WHERE n.empresa_id = $1
       ORDER BY n.fijado DESC, n.fecha_publicacion DESC`,
      [req.empresaId]
    );
    return res.json({ exito: true, datos: resu.rows });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar noticias.' });
  }
}

export async function crearNoticia(req: SolicitudAutenticada, res: Response) {
  try {
    const { titulo, contenido, categoria, imagen_url, fijado } = req.body;
    const resu = await pool.query(
      `INSERT INTO noticias_intranet (empresa_id, titulo, contenido, categoria, imagen_url, publicado_por, fijado)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.empresaId, titulo, contenido, categoria || 'General', imagen_url, req.usuario?.id, fijado || false]
    );
    return res.status(201).json({ exito: true, mensaje: 'Noticia publicada.', datos: resu.rows[0] });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al crear noticia.' });
  }
}
