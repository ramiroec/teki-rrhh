import { Response } from 'express';
import { pool } from '../config/db';
import { SolicitudAutenticada } from '../modelos/tipos';
import { registrarAuditoria } from '../servicios/auditoria';

export async function listarMarcaciones(req: SolicitudAutenticada, res: Response) {
  try {
    const { fecha, fechaDesde, fechaHasta, empleadoId, sectorId, estado } = req.query;

    let consulta = `
      SELECT m.*,
             e.nombres, e.apellidos, e.codigo as empleado_codigo, e.avatar_url,
             s.nombre as sector_nombre,
             c.nombre as cargo_nombre,
             h.nombre as horario_nombre, h.hora_entrada as horario_entrada, h.hora_salida as horario_salida
      FROM marcaciones m
      JOIN empleados e ON e.id = m.empleado_id
      LEFT JOIN sectores s ON s.id = e.sector_id
      LEFT JOIN cargos c ON c.id = e.cargo_id
      LEFT JOIN horarios h ON h.id = e.horario_id
      WHERE m.empresa_id = $1
    `;

    const params: any[] = [req.empresaId];

    // Si es colaborador, solo puede consultar sus propias marcaciones
    if (req.usuario?.rol === 'Colaborador') {
      params.push(req.usuario.empleadoId);
      consulta += ` AND m.empleado_id = $${params.length}`;
    } else if (empleadoId) {
      params.push(empleadoId);
      consulta += ` AND m.empleado_id = $${params.length}`;
    }

    if (fecha) {
      params.push(fecha);
      consulta += ` AND m.fecha = $${params.length}`;
    }

    if (fechaDesde && fechaHasta) {
      params.push(fechaDesde);
      params.push(fechaHasta);
      consulta += ` AND m.fecha BETWEEN $${params.length - 1} AND $${params.length}`;
    }

    if (sectorId) {
      params.push(sectorId);
      consulta += ` AND e.sector_id = $${params.length}`;
    }

    if (estado) {
      params.push(estado);
      consulta += ` AND m.estado = $${params.length}`;
    }

    consulta += ` ORDER BY m.fecha DESC, m.hora_entrada ASC NULLS LAST`;

    const resultado = await pool.query(consulta, params);

    return res.json({
      exito: true,
      total: resultado.rows.length,
      datos: resultado.rows,
    });
  } catch (error) {
    console.error('Error al listar marcaciones:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar asistencias.' });
  }
}

export async function obtenerResumenAsistencia(req: SolicitudAutenticada, res: Response) {
  try {
    const fecha = (req.query.fecha as string) || new Date().toISOString().split('T')[0];

    // Total de empleados activos
    const resTotales = await pool.query(
      `SELECT COUNT(*) as total_empleados FROM empleados WHERE empresa_id = $1 AND estado = 'Activo'`,
      [req.empresaId]
    );
    const totalActivos = parseInt(resTotales.rows[0]?.total_empleados || '0', 10);

    // Marcaciones de la fecha dada
    const resMarcaciones = await pool.query(
      `SELECT estado, COUNT(*) as cantidad, SUM(COALESCE(horas_extra, 0)) as total_horas_extra,
              SUM(COALESCE(minutos_retraso, 0)) as total_minutos_retraso
       FROM marcaciones
       WHERE empresa_id = $1 AND fecha = $2
       GROUP BY estado`,
      [req.empresaId, fecha]
    );

    let presentes = 0;
    let tardias = 0;
    let ausentes = 0;
    let vacaciones = 0;
    let permisos = 0;
    let totalHorasExtra = 0;
    let totalMinutosRetraso = 0;

    for (const fila of resMarcaciones.rows) {
      const cant = parseInt(fila.cantidad, 10);
      totalHorasExtra += parseFloat(fila.total_horas_extra || '0');
      totalMinutosRetraso += parseInt(fila.total_minutos_retraso || '0', 10);

      if (fila.estado === 'Presente') presentes += cant;
      else if (fila.estado === 'Llegada tardía') tardias += cant;
      else if (fila.estado === 'Ausente') ausentes += cant;
      else if (fila.estado === 'Vacaciones') vacaciones += cant;
      else if (fila.estado === 'Permiso') permisos += cant;
    }

    const sinMarcacion = Math.max(0, totalActivos - (presentes + tardias + ausentes + vacaciones + permisos));

    return res.json({
      exito: true,
      datos: {
        fecha,
        totalActivos,
        presentes,
        tardias,
        ausentes: ausentes + sinMarcacion,
        vacaciones,
        permisos,
        totalHorasExtra,
        totalMinutosRetraso,
      },
    });
  } catch (error) {
    console.error('Error al obtener resumen de asistencia:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al obtener resumen de asistencia.' });
  }
}

export async function registrarMarcacionManual(req: SolicitudAutenticada, res: Response) {
  try {
    const { empleado_id, fecha, hora_entrada, hora_salida, estado, tipo_origen, observaciones } = req.body;

    if (!empleado_id || !fecha) {
      return res.status(400).json({ exito: false, mensaje: 'El empleado y la fecha son obligatorios.' });
    }

    // Calcular horas trabajadas y posibles horas extras según horario del empleado
    let horasTrabajadas = 0;
    let horasExtra = 0;
    let minutosRetraso = 0;

    if (hora_entrada && hora_salida) {
      const [hIni, mIni] = hora_entrada.split(':').map(Number);
      const [hFin, mFin] = hora_salida.split(':').map(Number);
      const minutosTotales = (hFin * 60 + mFin) - (hIni * 60 + mIni);
      horasTrabajadas = Number(Math.max(0, minutosTotales / 60).toFixed(2));

      // Consultar horario asignado al empleado
      const resHorario = await pool.query(
        `SELECT h.* FROM empleados e LEFT JOIN horarios h ON h.id = e.horario_id WHERE e.id = $1`,
        [empleado_id]
      );
      const horario = resHorario.rows[0];

      if (horario?.hora_entrada) {
        const [hEsp, mEsp] = horario.hora_entrada.split(':').map(Number);
        const diffEntrada = (hIni * 60 + mIni) - (hEsp * 60 + mEsp);
        const tolerancia = horario.tolerancia_minutos || 15;
        if (diffEntrada > tolerancia) {
          minutosRetraso = diffEntrada;
        }
      }

      // Si supera las 8 horas estándar, computar horas extra
      if (horasTrabajadas > 8) {
        horasExtra = Number((horasTrabajadas - 8).toFixed(2));
      }
    }

    const estadoFinal = estado || (minutosRetraso > 0 ? 'Llegada tardía' : (hora_entrada ? 'Presente' : 'Ausente'));

    const consulta = `
      INSERT INTO marcaciones (
        empresa_id, empleado_id, fecha, hora_entrada, hora_salida,
        horas_trabajadas, horas_extra, minutos_retraso, estado, tipo_origen, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (empleado_id, fecha)
      DO UPDATE SET
        hora_entrada = EXCLUDED.hora_entrada,
        hora_salida = EXCLUDED.hora_salida,
        horas_trabajadas = EXCLUDED.horas_trabajadas,
        horas_extra = EXCLUDED.horas_extra,
        minutos_retraso = EXCLUDED.minutos_retraso,
        estado = EXCLUDED.estado,
        tipo_origen = EXCLUDED.tipo_origen,
        observaciones = EXCLUDED.observaciones
      RETURNING *
    `;

    const resultado = await pool.query(consulta, [
      req.empresaId,
      empleado_id,
      fecha,
      hora_entrada || null,
      hora_salida || null,
      horasTrabajadas,
      horasExtra,
      minutosRetraso,
      estadoFinal,
      tipo_origen || 'Manual',
      observaciones || null,
    ]);

    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: 'REGISTRO_MARCACION',
      entidad: 'marcaciones',
      entidadId: resultado.rows[0].id,
      detalles: { empleado_id, fecha, estado: estadoFinal, horasTrabajadas },
      ip: req.ip,
    });

    return res.status(201).json({
      exito: true,
      mensaje: 'Marcación registrada correctamente.',
      datos: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al registrar marcación:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al registrar marcación.' });
  }
}
