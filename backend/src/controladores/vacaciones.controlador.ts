import { Response } from 'express';
import { pool } from '../config/db';
import { SolicitudAutenticada } from '../modelos/tipos';
import { registrarAuditoria } from '../servicios/auditoria';
import { obtenerReglasEmpresa } from '../config/reglas_negocio';

export async function listarSolicitudesVacaciones(req: SolicitudAutenticada, res: Response) {
  try {
    const { estado, empleadoId, anio } = req.query;

    let consulta = `
      SELECT v.*,
             e.nombres, e.apellidos, e.codigo as empleado_codigo, e.avatar_url,
             e.fecha_ingreso,
             s.nombre as sector_nombre,
             c.nombre as cargo_nombre,
             CONCAT(u.nombre, ' ', u.apellido) as aprobado_por_nombre
      FROM solicitudes_vacaciones v
      JOIN empleados e ON e.id = v.empleado_id
      LEFT JOIN sectores s ON s.id = e.sector_id
      LEFT JOIN cargos c ON c.id = e.cargo_id
      LEFT JOIN usuarios u ON u.id = v.aprobado_por
      WHERE v.empresa_id = $1
    `;

    const params: any[] = [req.empresaId];

    // Restricción por rol Colaborador
    if (req.usuario?.rol === 'Colaborador') {
      params.push(req.usuario.empleadoId);
      consulta += ` AND v.empleado_id = $${params.length}`;
    } else if (empleadoId) {
      params.push(empleadoId);
      consulta += ` AND v.empleado_id = $${params.length}`;
    }

    if (estado) {
      params.push(estado);
      consulta += ` AND v.estado = $${params.length}`;
    }

    if (anio) {
      params.push(anio);
      consulta += ` AND EXTRACT(YEAR FROM v.fecha_inicio) = $${params.length}`;
    }

    consulta += ` ORDER BY v.fecha_solicitud DESC, v.fecha_inicio ASC`;

    const resultado = await pool.query(consulta, params);

    return res.json({
      exito: true,
      total: resultado.rows.length,
      datos: resultado.rows,
    });
  } catch (error) {
    console.error('Error al listar vacaciones:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar solicitudes de vacaciones.' });
  }
}

export async function obtenerSaldoVacaciones(req: SolicitudAutenticada, res: Response) {
  try {
    const empleadoId = (req.query.empleadoId as string) || req.usuario?.empleadoId;

    if (!empleadoId) {
      return res.status(400).json({ exito: false, mensaje: 'Identificador de empleado no provisto.' });
    }

    // Consultar fecha de ingreso del empleado y configuración de empresa
    const resEmp = await pool.query(
      `SELECT e.id, e.nombres, e.apellidos, e.fecha_ingreso, emp.configuracion
       FROM empleados e
       JOIN empresas emp ON emp.id = e.empresa_id
       WHERE e.id = $1 AND e.empresa_id = $2`,
      [empleadoId, req.empresaId]
    );

    if (resEmp.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Empleado no encontrado.' });
    }

    const emp = resEmp.rows[0];
    const reglas = obtenerReglasEmpresa(emp.configuracion);

    // Calcular antigüedad en años
    const fechaIngreso = new Date(emp.fecha_ingreso);
    const hoy = new Date();
    let antiguedadAnios = hoy.getFullYear() - fechaIngreso.getFullYear();
    const mesDiff = hoy.getMonth() - fechaIngreso.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fechaIngreso.getDate())) {
      antiguedadAnios--;
    }
    antiguedadAnios = Math.max(0, antiguedadAnios);

    // Días correspondientes según escala
    let diasTotales = 0;
    for (const escala of reglas.escalasVacaciones) {
      if (antiguedadAnios >= escala.aniosMinimos && antiguedadAnios <= escala.aniosMaximos) {
        diasTotales = escala.diasVacaciones;
        break;
      }
    }
    if (diasTotales === 0 && antiguedadAnios >= 1) {
      diasTotales = 12; // Base legal paraguaya mínima de 1 a 5 años
    }

    // Consultar días utilizados (Aprobadas en el año corriente)
    const anioActual = hoy.getFullYear();
    const resUsados = await pool.query(
      `SELECT COALESCE(SUM(dias_solicitados), 0) as dias_usados
       FROM solicitudes_vacaciones
       WHERE empleado_id = $1 AND empresa_id = $2 AND estado = 'Aprobada'
         AND EXTRACT(YEAR FROM fecha_inicio) = $3`,
      [empleadoId, req.empresaId, anioActual]
    );
    const diasUtilizados = parseInt(resUsados.rows[0]?.dias_usados || '0', 10);

    // Días en solicitudes pendientes
    const resPendientes = await pool.query(
      `SELECT COALESCE(SUM(dias_solicitados), 0) as dias_pendientes
       FROM solicitudes_vacaciones
       WHERE empleado_id = $1 AND empresa_id = $2 AND estado = 'Pendiente'
         AND EXTRACT(YEAR FROM fecha_inicio) = $3`,
      [empleadoId, req.empresaId, anioActual]
    );
    const diasPendientes = parseInt(resPendientes.rows[0]?.dias_pendientes || '0', 10);

    const diasDisponibles = Math.max(0, diasTotales - diasUtilizados - diasPendientes);

    return res.json({
      exito: true,
      datos: {
        empleadoId: emp.id,
        nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
        fechaIngreso: emp.fecha_ingreso,
        antiguedadAnios,
        diasCorrespondientes: diasTotales,
        diasUtilizados,
        diasPendientes,
        diasDisponibles,
      },
    });
  } catch (error) {
    console.error('Error al calcular saldo de vacaciones:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al calcular saldo de vacaciones.' });
  }
}

export async function crearSolicitudVacaciones(req: SolicitudAutenticada, res: Response) {
  try {
    const { empleado_id, fecha_inicio, fecha_fin, fecha_reincorporacion, dias_solicitados, motivo } = req.body;

    const idEmpleado = req.usuario?.rol === 'Colaborador' ? req.usuario.empleadoId : (empleado_id || req.usuario?.empleadoId);

    if (!idEmpleado || !fecha_inicio || !fecha_fin || !dias_solicitados) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Complete las fechas de inicio, fin y cantidad de días solicitados.',
      });
    }

    // Calcular fecha de reincorporación si no fue especificada (día hábil siguiente)
    let reincorp = fecha_reincorporacion;
    if (!reincorp) {
      const f = new Date(fecha_fin);
      f.setDate(f.getDate() + 1);
      // Si cae domingo (0) pasar a lunes
      if (f.getDay() === 0) f.setDate(f.getDate() + 1);
      reincorp = f.toISOString().split('T')[0];
    }

    const consulta = `
      INSERT INTO solicitudes_vacaciones (
        empresa_id, empleado_id, fecha_inicio, fecha_fin,
        fecha_reincorporacion, dias_solicitados, motivo, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pendiente')
      RETURNING *
    `;

    const resultado = await pool.query(consulta, [
      req.empresaId,
      idEmpleado,
      fecha_inicio,
      fecha_fin,
      reincorp,
      parseInt(dias_solicitados, 10),
      motivo || null,
    ]);

    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: 'SOLICITUD_VACACIONES',
      entidad: 'solicitudes_vacaciones',
      entidadId: resultado.rows[0].id,
      detalles: { dias_solicitados, fecha_inicio, fecha_fin },
      ip: req.ip,
    });

    return res.status(201).json({
      exito: true,
      mensaje: 'Su solicitud de vacaciones ha sido enviada para revisión.',
      datos: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al solicitar vacaciones:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al enviar solicitud de vacaciones.' });
  }
}

export async function responderSolicitudVacaciones(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    const { estado, respuesta_motivo } = req.body;

    if (!['Aprobada', 'Rechazada', 'Cancelada'].includes(estado)) {
      return res.status(400).json({ exito: false, mensaje: 'Estado de resolución inválido.' });
    }

    const consulta = `
      UPDATE solicitudes_vacaciones
      SET estado = $1,
          respuesta_motivo = $2,
          aprobado_por = $3,
          fecha_respuesta = CURRENT_TIMESTAMP
      WHERE id = $4 AND empresa_id = $5
      RETURNING *
    `;

    const resultado = await pool.query(consulta, [
      estado,
      respuesta_motivo || null,
      req.usuario?.id,
      id,
      req.empresaId,
    ]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Solicitud no encontrada.' });
    }

    const vacacion = resultado.rows[0];

    // Si fue aprobada, podemos actualizar el estado del empleado a 'Vacaciones' si la fecha_inicio es hoy o futura
    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: estado === 'Aprobada' ? 'APROBACION_VACACIONES' : 'RECHAZO_VACACIONES',
      entidad: 'solicitudes_vacaciones',
      entidadId: id,
      detalles: { estado, respuesta_motivo },
      ip: req.ip,
    });

    return res.json({
      exito: true,
      mensaje: `La solicitud fue ${estado.toLowerCase()} exitosamente.`,
      datos: vacacion,
    });
  } catch (error) {
    console.error('Error al responder solicitud de vacaciones:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al procesar la solicitud.' });
  }
}

export async function obtenerCalendarioVacaciones(req: SolicitudAutenticada, res: Response) {
  try {
    const { mes, anio, sectorId } = req.query;

    let consulta = `
      SELECT v.id, v.fecha_inicio, v.fecha_fin, v.fecha_reincorporacion, v.dias_solicitados, v.estado,
             e.id as empleado_id, e.nombres, e.apellidos, e.avatar_url,
             s.nombre as sector_nombre, c.nombre as cargo_nombre
      FROM solicitudes_vacaciones v
      JOIN empleados e ON e.id = v.empleado_id
      LEFT JOIN sectores s ON s.id = e.sector_id
      LEFT JOIN cargos c ON c.id = e.cargo_id
      WHERE v.empresa_id = $1 AND v.estado IN ('Aprobada', 'Pendiente')
    `;

    const params: any[] = [req.empresaId];

    if (anio) {
      params.push(anio);
      consulta += ` AND (EXTRACT(YEAR FROM v.fecha_inicio) = $${params.length} OR EXTRACT(YEAR FROM v.fecha_fin) = $${params.length})`;
    }

    if (sectorId) {
      params.push(sectorId);
      consulta += ` AND e.sector_id = $${params.length}`;
    }

    consulta += ` ORDER BY v.fecha_inicio ASC`;

    const resultado = await pool.query(consulta, params);

    return res.json({
      exito: true,
      datos: resultado.rows,
    });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al obtener calendario de vacaciones.' });
  }
}

export async function cancelarSolicitudVacaciones(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const resSol = await pool.query(
      `SELECT * FROM solicitudes_vacaciones WHERE id = $1 AND empresa_id = $2`,
      [id, req.empresaId]
    );

    if (resSol.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Solicitud no encontrada.' });
    }

    const sol = resSol.rows[0];

    if (req.usuario?.rol === 'Colaborador') {
      if (sol.empleado_id !== req.usuario.empleadoId) {
        return res.status(403).json({ exito: false, mensaje: 'No tiene permiso para cancelar esta solicitud.' });
      }
      if (sol.estado !== 'Pendiente') {
        return res.status(400).json({ exito: false, mensaje: 'Solo puede cancelar solicitudes que se encuentren en estado Pendiente.' });
      }
    }

    const resUpd = await pool.query(
      `UPDATE solicitudes_vacaciones
       SET estado = 'Cancelada',
           respuesta_motivo = COALESCE($1, 'Cancelada por el usuario'),
           fecha_respuesta = CURRENT_TIMESTAMP
       WHERE id = $2 AND empresa_id = $3
       RETURNING *`,
      [motivo, id, req.empresaId]
    );

    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: 'CANCELACION_VACACIONES',
      entidad: 'solicitudes_vacaciones',
      entidadId: id,
      detalles: { motivo },
      ip: req.ip,
    });

    return res.json({
      exito: true,
      mensaje: 'La solicitud de vacaciones ha sido cancelada.',
      datos: resUpd.rows[0],
    });
  } catch (error) {
    console.error('Error al cancelar solicitud:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al cancelar la solicitud.' });
  }
}

