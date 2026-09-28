import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import { SolicitudAutenticada } from '../modelos/tipos';
import { registrarAuditoria } from '../servicios/auditoria';

export async function listarUsuarios(req: SolicitudAutenticada, res: Response) {
  try {
    const { busqueda, rol, soloActivos } = req.query;

    let consulta = `
      SELECT u.id, u.email, u.nombre, u.apellido, u.rol, u.avatar_url, u.activo,
             u.ultimo_acceso, u.creado_en,
             e.id as empleado_id, e.codigo as empleado_codigo,
             s.nombre as sector_nombre, c.nombre as cargo_nombre
      FROM usuarios u
      LEFT JOIN empleados e ON e.id = u.empleado_id
      LEFT JOIN sectores s ON s.id = e.sector_id
      LEFT JOIN cargos c ON c.id = e.cargo_id
      WHERE u.empresa_id = $1
    `;
    const params: any[] = [req.empresaId];

    if (rol) {
      params.push(rol);
      consulta += ` AND u.rol = $${params.length}`;
    }
    if (soloActivos === 'true') {
      consulta += ` AND u.activo = true`;
    }
    if (busqueda) {
      params.push(`%${busqueda}%`);
      const idx = params.length;
      consulta += ` AND (u.nombre ILIKE $${idx} OR u.apellido ILIKE $${idx} OR u.email ILIKE $${idx})`;
    }

    consulta += ` ORDER BY u.nombre ASC`;

    const resultado = await pool.query(consulta, params);

    return res.json({
      exito: true,
      datos: resultado.rows,
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar usuarios.' });
  }
}

export async function crearUsuario(req: SolicitudAutenticada, res: Response) {
  try {
    const { email, password, nombre, apellido, rol, empleado_id, avatar_url } = req.body;

    if (!email || !password || !nombre || !apellido || !rol) {
      return res.status(400).json({ exito: false, mensaje: 'Complete los datos obligatorios del usuario.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const consulta = `
      INSERT INTO usuarios (empresa_id, empleado_id, email, password_hash, nombre, apellido, rol, avatar_url, activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING id, email, nombre, apellido, rol, avatar_url, activo, creado_en
    `;

    const resultado = await pool.query(consulta, [
      req.empresaId,
      empleado_id || null,
      email.trim().toLowerCase(),
      passwordHash,
      nombre.trim(),
      apellido.trim(),
      rol,
      avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nombre + ' ' + apellido)}`,
    ]);

    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: 'CREAR_USUARIO',
      entidad: 'usuarios',
      entidadId: resultado.rows[0].id,
      detalles: { email, rol, empleado_id },
      ip: req.ip,
    });

    return res.status(201).json({
      exito: true,
      mensaje: 'Usuario creado exitosamente.',
      datos: resultado.rows[0],
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ exito: false, mensaje: 'El correo electrónico ya está registrado en la empresa.' });
    }
    return res.status(500).json({ exito: false, mensaje: 'Error al crear usuario.' });
  }
}

export async function actualizarUsuario(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    const { email, password, nombre, apellido, rol, empleado_id, activo } = req.body;

    let passHashClause = '';
    const params: any[] = [nombre, apellido, rol, empleado_id || null, activo, id, req.empresaId];

    if (password && password.trim().length > 0) {
      const hash = await bcrypt.hash(password, 10);
      params.push(hash);
      passHashClause = `, password_hash = $${params.length}`;
    }

    const consulta = `
      UPDATE usuarios
      SET nombre = COALESCE($1, nombre),
          apellido = COALESCE($2, apellido),
          rol = COALESCE($3, rol),
          empleado_id = $4,
          activo = COALESCE($5, activo),
          actualizado_en = CURRENT_TIMESTAMP
          ${passHashClause}
      WHERE id = $6 AND empresa_id = $7
      RETURNING id, email, nombre, apellido, rol, empleado_id, activo
    `;

    const resultado = await pool.query(consulta, params);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }

    return res.json({
      exito: true,
      mensaje: 'Usuario actualizado.',
      datos: resultado.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al actualizar usuario.' });
  }
}
