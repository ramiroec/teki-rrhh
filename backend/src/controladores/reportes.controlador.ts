import { Response } from 'express';
import { pool } from '../config/db';
import { SolicitudAutenticada } from '../modelos/tipos';

export async function obtenerDashboardPrincipal(req: SolicitudAutenticada, res: Response) {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    // 1. Estadísticas generales de empleados
    const resEmp = await pool.query(
      `SELECT
        COUNT(*) as total_empleados,
        COUNT(CASE WHEN estado = 'Activo' THEN 1 END) as activos,
        COUNT(CASE WHEN estado = 'Vacaciones' THEN 1 END) as de_vacaciones,
        COUNT(CASE WHEN estado = 'Baja' THEN 1 END) as bajas,
        COUNT(CASE WHEN fecha_ingreso >= CURRENT_DATE - INTERVAL '60 days' THEN 1 END) as nuevos_ingresos,
        COALESCE(SUM(CASE WHEN estado = 'Activo' THEN salario_base ELSE 0 END), 0) as masa_salarial_base
       FROM empleados
       WHERE empresa_id = $1`,
      [req.empresaId]
    );
    const statsEmp = resEmp.rows[0];

    // 2. Ausentes hoy
    const resAusentes = await pool.query(
      `SELECT e.id, e.nombres, e.apellidos, e.avatar_url, m.estado, m.observaciones
       FROM marcaciones m
       JOIN empleados e ON e.id = m.empleado_id
       WHERE m.empresa_id = $1 AND m.fecha = $2 AND m.estado IN ('Ausente', 'Permiso')`,
      [req.empresaId, hoy]
    );

    // 3. Solicitudes de vacaciones pendientes
    const resVacPendientes = await pool.query(
      `SELECT v.id, v.fecha_solicitud, v.fecha_inicio, v.fecha_fin, v.dias_solicitados, v.motivo,
              e.nombres, e.apellidos, e.avatar_url, s.nombre as sector_nombre
       FROM solicitudes_vacaciones v
       JOIN empleados e ON e.id = v.empleado_id
       LEFT JOIN sectores s ON s.id = e.sector_id
       WHERE v.empresa_id = $1 AND v.estado = 'Pendiente'
       ORDER BY v.fecha_solicitud DESC
       LIMIT 5`,
      [req.empresaId]
    );

    // 4. Próximos cumpleaños (próximos 45 días)
    const resCumples = await pool.query(
      `SELECT id, nombres, apellidos, avatar_url, fecha_nacimiento,
              TO_CHAR(fecha_nacimiento, 'DD "de" TMMonth') as fecha_cumple_formato,
              EXTRACT(DAY FROM fecha_nacimiento) as dia,
              EXTRACT(MONTH FROM fecha_nacimiento) as mes
       FROM empleados
       WHERE empresa_id = $1 AND estado = 'Activo' AND fecha_nacimiento IS NOT NULL
       ORDER BY
         CASE 
           WHEN (EXTRACT(MONTH FROM fecha_nacimiento) * 100 + EXTRACT(DAY FROM fecha_nacimiento)) >= (EXTRACT(MONTH FROM CURRENT_DATE) * 100 + EXTRACT(DAY FROM CURRENT_DATE))
           THEN (EXTRACT(MONTH FROM fecha_nacimiento) * 100 + EXTRACT(DAY FROM fecha_nacimiento))
           ELSE (EXTRACT(MONTH FROM fecha_nacimiento) * 100 + EXTRACT(DAY FROM fecha_nacimiento) + 1200)
         END ASC
       LIMIT 6`,
      [req.empresaId]
    );

    // 5. Próximos aniversarios laborales
    const resAniversarios = await pool.query(
      `SELECT id, nombres, apellidos, avatar_url, fecha_ingreso,
              EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM fecha_ingreso) as anios_cumplidos,
              TO_CHAR(fecha_ingreso, 'DD "de" TMMonth') as fecha_ingreso_formato
       FROM empleados
       WHERE empresa_id = $1 AND estado = 'Activo'
       ORDER BY
         CASE 
           WHEN (EXTRACT(MONTH FROM fecha_ingreso) * 100 + EXTRACT(DAY FROM fecha_ingreso)) >= (EXTRACT(MONTH FROM CURRENT_DATE) * 100 + EXTRACT(DAY FROM CURRENT_DATE))
           THEN (EXTRACT(MONTH FROM fecha_ingreso) * 100 + EXTRACT(DAY FROM fecha_ingreso))
           ELSE (EXTRACT(MONTH FROM fecha_ingreso) * 100 + EXTRACT(DAY FROM fecha_ingreso) + 1200)
         END ASC
       LIMIT 6`,
      [req.empresaId]
    );

    // 6. Horas extra y resumen de asistencia en los últimos 30 días
    const resAsistencia = await pool.query(
      `SELECT
         COALESCE(SUM(horas_extra), 0) as total_horas_extra,
         COALESCE(SUM(minutos_retraso), 0) as total_minutos_retraso,
         COUNT(CASE WHEN estado = 'Presente' THEN 1 END) as total_presentes,
         COUNT(CASE WHEN estado = 'Llegada tardía' THEN 1 END) as total_tardias,
         COUNT(CASE WHEN estado = 'Ausente' THEN 1 END) as total_ausencias
       FROM marcaciones
       WHERE empresa_id = $1 AND fecha >= CURRENT_DATE - INTERVAL '30 days'`,
      [req.empresaId]
    );

    // 7. Distribución por sector
    const resPorSector = await pool.query(
      `SELECT COALESCE(s.nombre, 'Sin Asignar') as sector, COUNT(e.id) as cantidad
       FROM empleados e
       LEFT JOIN sectores s ON s.id = e.sector_id
       WHERE e.empresa_id = $1 AND e.estado = 'Activo'
       GROUP BY s.nombre
       ORDER BY cantidad DESC`,
      [req.empresaId]
    );

    // 8. Distribución por tipo de contrato
    const resPorContrato = await pool.query(
      `SELECT COALESCE(t.nombre, 'No especificado') as tipo_contrato, COUNT(e.id) as cantidad
       FROM empleados e
       LEFT JOIN tipos_contrato t ON t.id = e.tipo_contrato_id
       WHERE e.empresa_id = $1 AND e.estado = 'Activo'
       GROUP BY t.nombre
       ORDER BY cantidad DESC`,
      [req.empresaId]
    );

    // 9. Evolución de contrataciones (por año/mes reciente)
    const resEvolucion = await pool.query(
      `SELECT 
         TO_CHAR(fecha_ingreso, 'YYYY-MM') as periodo,
         COUNT(*) as altas
       FROM empleados
       WHERE empresa_id = $1
       GROUP BY TO_CHAR(fecha_ingreso, 'YYYY-MM')
       ORDER BY periodo ASC
       LIMIT 8`,
      [req.empresaId]
    );

    return res.json({
      exito: true,
      datos: {
        totales: {
          totalEmpleados: parseInt(statsEmp.total_empleados || '0', 10),
          empleadosActivos: parseInt(statsEmp.activos || '0', 10),
          empleadosVacaciones: parseInt(statsEmp.de_vacaciones || '0', 10),
          empleadosBajas: parseInt(statsEmp.bajas || '0', 10),
          nuevosIngresos: parseInt(statsEmp.nuevos_ingresos || '0', 10),
          masaSalarialBase: Number(statsEmp.masa_salarial_base || 0),
          horasExtraMes: Number(resAsistencia.rows[0]?.total_horas_extra || 0),
          solicitudesVacacionesPendientes: parseInt(resVacPendientes.rowCount as any || '0', 10),
        },
        asistenciaResumen: resAsistencia.rows[0],
        ausentesHoy: resAusentes.rows,
        vacacionesPendientes: resVacPendientes.rows,
        proximosCumpleanos: resCumples.rows,
        proximosAniversarios: resAniversarios.rows,
        distribucionSectores: resPorSector.rows,
        distribucionContratos: resPorContrato.rows,
        evolucionEmpleados: resEvolucion.rows,
      },
    });
  } catch (error) {
    console.error('Error al obtener dashboard principal:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar datos del dashboard.' });
  }
}

export async function obtenerPanelRRHH(req: SolicitudAutenticada, res: Response) {
  try {
    // Métricas analíticas avanzadas para RRHH
    const resAnalitica = await pool.query(
      `SELECT
        COUNT(*) as total_empleados,
        COUNT(CASE WHEN estado = 'Activo' THEN 1 END) as activos,
        COUNT(CASE WHEN estado = 'Baja' THEN 1 END) as bajas,
        AVG(EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM fecha_ingreso)) as antiguedad_promedio,
        AVG(salario_base) as salario_promedio,
        MIN(salario_base) as salario_minimo,
        MAX(salario_base) as salario_maximo
       FROM empleados
       WHERE empresa_id = $1`,
      [req.empresaId]
    );

    // Masa salarial por sector
    const resMasaPorSector = await pool.query(
      `SELECT COALESCE(s.nombre, 'General') as sector,
              SUM(e.salario_base) as masa_salarial,
              COUNT(e.id) as cantidad_empleados,
              AVG(e.salario_base) as salario_promedio
       FROM empleados e
       LEFT JOIN sectores s ON s.id = e.sector_id
       WHERE e.empresa_id = $1 AND e.estado = 'Activo'
       GROUP BY s.nombre
       ORDER BY masa_salarial DESC`,
      [req.empresaId]
    );

    // Comparativa de los últimos periodos de liquidación
    const resHistoricoLiquidaciones = await pool.query(
      `SELECT nombre, anio, mes, total_bruto, total_ips, total_neto, estado
       FROM periodos_liquidacion
       WHERE empresa_id = $1
       ORDER BY anio DESC, mes DESC
       LIMIT 6`,
      [req.empresaId]
    );

    return res.json({
      exito: true,
      datos: {
        metricas: resAnalitica.rows[0],
        masaPorSector: resMasaPorSector.rows,
        historicoLiquidaciones: resHistoricoLiquidaciones.rows,
      },
    });
  } catch (error) {
    console.error('Error al obtener analítica de panel RRHH:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar panel de RRHH.' });
  }
}
