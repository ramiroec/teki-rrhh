import { Response } from 'express';
import { pool } from '../config/db';
import { SolicitudAutenticada } from '../modelos/tipos';

export async function listarRecibos(req: SolicitudAutenticada, res: Response) {
  try {
    const { busqueda, periodo, empleadoId } = req.query;

    let consulta = `
      SELECT r.*,
             e.nombres, e.apellidos, e.documento, e.codigo as empleado_codigo, e.avatar_url,
             s.nombre as sector_nombre, c.nombre as cargo_nombre
      FROM recibos r
      JOIN empleados e ON e.id = r.empleado_id
      LEFT JOIN sectores s ON s.id = e.sector_id
      LEFT JOIN cargos c ON c.id = e.cargo_id
      WHERE r.empresa_id = $1
    `;

    const params: any[] = [req.empresaId];

    if (req.usuario?.rol === 'Colaborador') {
      params.push(req.usuario.empleadoId);
      consulta += ` AND r.empleado_id = $${params.length}`;
    } else if (empleadoId) {
      params.push(empleadoId);
      consulta += ` AND r.empleado_id = $${params.length}`;
    }

    if (periodo) {
      params.push(`%${periodo}%`);
      consulta += ` AND r.periodo_nombre ILIKE $${params.length}`;
    }

    if (busqueda) {
      params.push(`%${busqueda}%`);
      const idx = params.length;
      consulta += ` AND (
        e.nombres ILIKE $${idx} OR
        e.apellidos ILIKE $${idx} OR
        e.documento ILIKE $${idx} OR
        r.numero_recibo ILIKE $${idx}
      )`;
    }

    consulta += ` ORDER BY r.creado_en DESC, e.nombres ASC`;

    const resultado = await pool.query(consulta, params);

    return res.json({
      exito: true,
      total: resultado.rows.length,
      datos: resultado.rows,
    });
  } catch (error) {
    console.error('Error al listar recibos:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar recibos de salario.' });
  }
}

export async function obtenerReciboPorId(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;

    const consulta = `
      SELECT r.*,
             -- Datos Empresa
             emp.nombre as empresa_nombre, emp.ruc as empresa_ruc, emp.direccion as empresa_direccion,
             emp.ciudad as empresa_ciudad, emp.telefono as empresa_telefono, emp.simbolo_moneda,
             -- Datos Empleado
             e.nombres as empleado_nombres, e.apellidos as empleado_apellidos,
             e.documento as empleado_documento, e.codigo as empleado_codigo,
             e.fecha_ingreso as empleado_fecha_ingreso,
             s.nombre as sector_nombre, d.nombre as departamento_nombre,
             c.nombre as cargo_nombre,
             -- Datos Liquidación
             l.dias_trabajados, l.horas_extra_cantidad,
             l.monto_horas_extra, l.monto_bonos, l.monto_otros_haberes,
             l.monto_ausencias, l.monto_otros_descuentos, l.monto_ips_obrero, l.monto_ips_patronal
      FROM recibos r
      JOIN empresas emp ON emp.id = r.empresa_id
      JOIN empleados e ON e.id = r.empleado_id
      LEFT JOIN sectores s ON s.id = e.sector_id
      LEFT JOIN departamentos d ON d.id = e.departamento_id
      LEFT JOIN cargos c ON c.id = e.cargo_id
      JOIN liquidaciones l ON l.id = r.liquidacion_id
      WHERE r.id = $1 AND r.empresa_id = $2
    `;

    const resultado = await pool.query(consulta, [id, req.empresaId]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Recibo no encontrado.' });
    }

    const recibo = resultado.rows[0];

    // Si es colaborador, solo puede ver sus propios recibos
    if (req.usuario?.rol === 'Colaborador' && req.usuario?.empleadoId !== recibo.empleado_id) {
      return res.status(403).json({ exito: false, mensaje: 'Acceso no autorizado a este recibo.' });
    }

    // Consultar items detallados de la liquidación
    const resDetalle = await pool.query(
      `SELECT * FROM detalle_liquidaciones WHERE liquidacion_id = $1 ORDER BY tipo ASC, monto DESC`,
      [recibo.liquidacion_id]
    );

    return res.json({
      exito: true,
      datos: {
        ...recibo,
        detalles: resDetalle.rows,
      },
    });
  } catch (error) {
    console.error('Error al obtener recibo:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar el recibo.' });
  }
}
