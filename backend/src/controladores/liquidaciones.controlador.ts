import { Response } from 'express';
import { pool } from '../config/db';
import { SolicitudAutenticada } from '../modelos/tipos';
import { registrarAuditoria } from '../servicios/auditoria';
import { obtenerReglasEmpresa } from '../config/reglas_negocio';
import { numeroALetras } from '../servicios/numeros';

// PERIODOS DE LIQUIDACIÓN
export async function listarPeriodos(req: SolicitudAutenticada, res: Response) {
  try {
    const { anio } = req.query;
    let consulta = `
      SELECT p.*,
             COUNT(l.id) as total_liquidaciones,
             CONCAT(u.nombre, ' ', u.apellido) as creado_por_nombre
      FROM periodos_liquidacion p
      LEFT JOIN liquidaciones l ON l.periodo_id = p.id
      LEFT JOIN usuarios u ON u.id = p.creado_por
      WHERE p.empresa_id = $1
    `;
    const params: any[] = [req.empresaId];

    if (anio) {
      params.push(anio);
      consulta += ` AND p.anio = $${params.length}`;
    }

    consulta += ` GROUP BY p.id, u.nombre, u.apellido ORDER BY p.anio DESC, p.mes DESC`;

    const resultado = await pool.query(consulta, params);
    return res.json({ exito: true, datos: resultado.rows });
  } catch (error) {
    console.error('Error al listar periodos:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar periodos de liquidación.' });
  }
}

export async function crearPeriodo(req: SolicitudAutenticada, res: Response) {
  try {
    const { anio, mes, nombre, fecha_inicio, fecha_fin } = req.body;

    if (!anio || !mes || !nombre || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ exito: false, mensaje: 'Todos los campos del periodo son requeridos.' });
    }

    const consulta = `
      INSERT INTO periodos_liquidacion (empresa_id, anio, mes, nombre, fecha_inicio, fecha_fin, estado, creado_por)
      VALUES ($1, $2, $3, $4, $5, $6, 'Borrador', $7)
      RETURNING *
    `;

    const resultado = await pool.query(consulta, [
      req.empresaId,
      anio,
      mes,
      nombre,
      fecha_inicio,
      fecha_fin,
      req.usuario?.id,
    ]);

    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: 'CREAR_PERIODO_LIQUIDACION',
      entidad: 'periodos_liquidacion',
      entidadId: resultado.rows[0].id,
      detalles: { nombre, anio, mes },
      ip: req.ip,
    });

    return res.status(201).json({
      exito: true,
      mensaje: 'Periodo de liquidación creado.',
      datos: resultado.rows[0],
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ exito: false, mensaje: 'Ya existe un periodo para ese año y mes.' });
    }
    return res.status(500).json({ exito: false, mensaje: 'Error al crear periodo de liquidación.' });
  }
}

export async function obtenerPeriodoPorId(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;

    const resPeriodo = await pool.query(
      `SELECT * FROM periodos_liquidacion WHERE id = $1 AND empresa_id = $2`,
      [id, req.empresaId]
    );

    if (resPeriodo.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Periodo no encontrado.' });
    }

    const periodo = resPeriodo.rows[0];

    // Consultar liquidaciones del periodo
    const resLiquidaciones = await pool.query(
      `SELECT l.*,
              e.codigo as empleado_codigo, e.nombres, e.apellidos, e.documento,
              s.nombre as sector_nombre, c.nombre as cargo_nombre
       FROM liquidaciones l
       JOIN empleados e ON e.id = l.empleado_id
       LEFT JOIN sectores s ON s.id = e.sector_id
       LEFT JOIN cargos c ON c.id = e.cargo_id
       WHERE l.periodo_id = $1 AND l.empresa_id = $2
       ORDER BY e.nombres ASC`,
      [id, req.empresaId]
    );

    return res.json({
      exito: true,
      datos: {
        ...periodo,
        liquidaciones: resLiquidaciones.rows,
      },
    });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar periodo.' });
  }
}

// CALCULAR LIQUIDACIONES PARA EL PERIODO
export async function calcularLiquidacionesPeriodo(req: SolicitudAutenticada, res: Response) {
  const cliente = await pool.connect();
  try {
    const { id: periodoId } = req.params;
    const { empleadosIds } = req.body; // Array de IDs de empleados o vacío para todos

    await cliente.query('BEGIN');

    // 1. Obtener periodo
    const resPeriodo = await cliente.query(
      `SELECT * FROM periodos_liquidacion WHERE id = $1 AND empresa_id = $2`,
      [periodoId, req.empresaId]
    );

    if (resPeriodo.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ exito: false, mensaje: 'Periodo no encontrado.' });
    }

    const periodo = resPeriodo.rows[0];
    if (periodo.estado === 'Confirmado') {
      await cliente.query('ROLLBACK');
      return res.status(400).json({
        exito: false,
        mensaje: 'Este periodo ya se encuentra confirmado. No puede recalcularse.',
      });
    }

    // 2. Obtener reglas de la empresa
    const resEmp = await cliente.query(`SELECT configuracion FROM empresas WHERE id = $1`, [req.empresaId]);
    const reglas = obtenerReglasEmpresa(resEmp.rows[0]?.configuracion);

    // 3. Obtener empleados activos
    let qEmp = `SELECT * FROM empleados WHERE empresa_id = $1 AND estado IN ('Activo', 'Vacaciones')`;
    const pEmp: any[] = [req.empresaId];

    if (Array.isArray(empleadosIds) && empleadosIds.length > 0) {
      pEmp.push(empleadosIds);
      qEmp += ` AND id = ANY($2)`;
    }

    const resEmpleados = await cliente.query(qEmp, pEmp);

    let totalBrutoPeriodo = 0;
    let totalAdicionalesPeriodo = 0;
    let totalDescuentosPeriodo = 0;
    let totalIpsPeriodo = 0;
    let totalNetoPeriodo = 0;

    for (const emp of resEmpleados.rows) {
      const salarioBase = Number(emp.salario_base) || 0;

      // Consultar marcaciones del empleado en el periodo para calcular horas extras y ausencias reales
      const resMarc = await cliente.query(
        `SELECT SUM(COALESCE(horas_extra, 0)) as total_horas_extra,
                COUNT(CASE WHEN estado = 'Ausente' THEN 1 END) as total_ausencias
         FROM marcaciones
         WHERE empleado_id = $1 AND empresa_id = $2 AND fecha BETWEEN $3 AND $4`,
        [emp.id, req.empresaId, periodo.fecha_inicio, periodo.fecha_fin]
      );

      const horasExtraCant = Number(resMarc.rows[0]?.total_horas_extra || 0);
      const diasAusente = Number(resMarc.rows[0]?.total_ausencias || 0);

      // Reglas de negocio configuradas
      const valorHora = salarioBase / reglas.horasMesEstandar;
      const recargoFactor = 1 + reglas.recargoHoraExtraPorcentaje;
      const montoHorasExtra = Math.round(valorHora * recargoFactor * horasExtraCant);

      // Descuento ausencia = salario / diasMesEstandar * dias
      const montoAusencias = Math.round((salarioBase / reglas.diasMesEstandar) * diasAusente);

      const bonos = 0; // Se pueden ajustar manualmente luego
      const otrosHaberes = 0;
      const otrosDescuentos = 0;

      const salarioBruto = salarioBase + montoHorasExtra + bonos + otrosHaberes;

      // IPS Obrero (9% configurable)
      const porcentajeObreroDecimal = reglas.porcentajeIpsObrero / 100;
      const montoIpsObrero = Math.round(salarioBruto * porcentajeObreroDecimal);

      // IPS Patronal (16.5% configurable)
      const porcentajePatronalDecimal = reglas.porcentajeIpsPatronal / 100;
      const montoIpsPatronal = Math.round(salarioBruto * porcentajePatronalDecimal);

      const totalDescuentos = montoIpsObrero + montoAusencias + otrosDescuentos;
      const salarioNeto = Math.max(0, salarioBruto - totalDescuentos);

      totalBrutoPeriodo += salarioBruto;
      totalAdicionalesPeriodo += (montoHorasExtra + bonos + otrosHaberes);
      totalDescuentosPeriodo += totalDescuentos;
      totalIpsPeriodo += montoIpsObrero;
      totalNetoPeriodo += salarioNeto;

      // Upsert liquidación
      const resLiq = await cliente.query(
        `INSERT INTO liquidaciones (
          empresa_id, periodo_id, empleado_id, dias_trabajados, horas_extra_cantidad,
          salario_base, monto_horas_extra, monto_bonos, monto_otros_haberes,
          monto_ausencias, monto_otros_descuentos, monto_ips_obrero, monto_ips_patronal,
          salario_bruto, total_descuentos, salario_neto, estado
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16, 'Calculado'
        )
        ON CONFLICT (periodo_id, empleado_id)
        DO UPDATE SET
          dias_trabajados = EXCLUDED.dias_trabajados,
          horas_extra_cantidad = EXCLUDED.horas_extra_cantidad,
          salario_base = EXCLUDED.salario_base,
          monto_horas_extra = EXCLUDED.monto_horas_extra,
          monto_bonos = EXCLUDED.monto_bonos,
          monto_otros_haberes = EXCLUDED.monto_otros_haberes,
          monto_ausencias = EXCLUDED.monto_ausencias,
          monto_otros_descuentos = EXCLUDED.monto_otros_descuentos,
          monto_ips_obrero = EXCLUDED.monto_ips_obrero,
          monto_ips_patronal = EXCLUDED.monto_ips_patronal,
          salario_bruto = EXCLUDED.salario_bruto,
          total_descuentos = EXCLUDED.total_descuentos,
          salario_neto = EXCLUDED.salario_neto,
          estado = EXCLUDED.estado
        RETURNING id`,
        [
          req.empresaId, periodoId, emp.id, 30 - diasAusente, horasExtraCant,
          salarioBase, montoHorasExtra, bonos, otrosHaberes,
          montoAusencias, otrosDescuentos, montoIpsObrero, montoIpsPatronal,
          salarioBruto, totalDescuentos, salarioNeto
        ]
      );

      const liqId = resLiq.rows[0].id;

      // Limpiar detalle anterior y recrearlo
      await cliente.query(`DELETE FROM detalle_liquidaciones WHERE liquidacion_id = $1`, [liqId]);

      await cliente.query(
        `INSERT INTO detalle_liquidaciones (empresa_id, liquidacion_id, tipo, concepto, cantidad, monto)
         VALUES ($1, $2, 'HABER', 'Salario Base Mensual', 30, $3)`,
        [req.empresaId, liqId, salarioBase]
      );

      if (montoHorasExtra > 0) {
        await cliente.query(
          `INSERT INTO detalle_liquidaciones (empresa_id, liquidacion_id, tipo, concepto, cantidad, porcentaje, monto)
           VALUES ($1, $2, 'HABER', 'Horas Extraordinarias (50%)', $3, 50.00, $4)`,
          [req.empresaId, liqId, horasExtraCant, montoHorasExtra]
        );
      }

      if (montoAusencias > 0) {
        await cliente.query(
          `INSERT INTO detalle_liquidaciones (empresa_id, liquidacion_id, tipo, concepto, cantidad, monto)
           VALUES ($1, $2, 'DEDUCCION', 'Descuento por Ausencias Injustificadas', $3, $4)`,
          [req.empresaId, liqId, diasAusente, montoAusencias]
        );
      }

      await cliente.query(
        `INSERT INTO detalle_liquidaciones (empresa_id, liquidacion_id, tipo, concepto, cantidad, porcentaje, monto)
         VALUES ($1, $2, 'DEDUCCION', 'Aporte Obrero IPS (9%)', 1, 9.00, $3)`,
        [req.empresaId, liqId, montoIpsObrero]
      );
    }

    // Actualizar totales del periodo
    await cliente.query(
      `UPDATE periodos_liquidacion
       SET total_bruto = $1, total_adicionales = $2, total_descuentos = $3,
           total_ips = $4, total_neto = $5, estado = 'Calculado'
       WHERE id = $6`,
      [totalBrutoPeriodo, totalAdicionalesPeriodo, totalDescuentosPeriodo, totalIpsPeriodo, totalNetoPeriodo, periodoId]
    );

    await cliente.query('COMMIT');

    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: 'CALCULO_LIQUIDACION',
      entidad: 'periodos_liquidacion',
      entidadId: periodoId,
      detalles: { totalNeto: totalNetoPeriodo, empleados: resEmpleados.rows.length },
      ip: req.ip,
    });

    return res.json({
      exito: true,
      mensaje: `Cálculo realizado con éxito para ${resEmpleados.rows.length} empleados.`,
      datos: {
        totalBruto: totalBrutoPeriodo,
        totalAdicionales: totalAdicionalesPeriodo,
        totalDescuentos: totalDescuentosPeriodo,
        totalIps: totalIpsPeriodo,
        totalNeto: totalNetoPeriodo,
      },
    });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error al calcular liquidación:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al calcular la liquidación.' });
  } finally {
    cliente.release();
  }
}

// MODIFICAR CONCEPTOS DE UNA LIQUIDACIÓN INDIVIDUAL (AJUSTE MANUAL ANTES DE CONFIRMAR)
export async function actualizarLiquidacionIndividual(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    const { monto_bonos, monto_otros_haberes, monto_otros_descuentos, observaciones } = req.body;

    // Consultar liquidación actual
    const resLiq = await pool.query(
      `SELECT l.*, p.estado as periodo_estado, emp.configuracion as emp_config
       FROM liquidaciones l
       JOIN periodos_liquidacion p ON p.id = l.periodo_id
       JOIN empresas emp ON emp.id = l.empresa_id
       WHERE l.id = $1 AND l.empresa_id = $2`,
      [id, req.empresaId]
    );

    if (resLiq.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Liquidación no encontrada.' });
    }

    const liq = resLiq.rows[0];
    if (liq.periodo_estado === 'Confirmado') {
      return res.status(400).json({ exito: false, mensaje: 'No se puede modificar una liquidación ya confirmada.' });
    }

    const reglas = obtenerReglasEmpresa(liq.emp_config);
    const salarioBase = Number(liq.salario_base);
    const montoHorasExtra = Number(liq.monto_horas_extra);
    const bonos = monto_bonos !== undefined ? Number(monto_bonos) : Number(liq.monto_bonos);
    const otrosHaberes = monto_otros_haberes !== undefined ? Number(monto_otros_haberes) : Number(liq.monto_otros_haberes);
    const ausencias = Number(liq.monto_ausencias);
    const otrosDescuentos = monto_otros_descuentos !== undefined ? Number(monto_otros_descuentos) : Number(liq.monto_otros_descuentos);

    const salarioBruto = salarioBase + montoHorasExtra + bonos + otrosHaberes;
    const ipsObrero = Math.round(salarioBruto * (reglas.porcentajeIpsObrero / 100));
    const ipsPatronal = Math.round(salarioBruto * (reglas.porcentajeIpsPatronal / 100));
    const totalDescuentos = ipsObrero + ausencias + otrosDescuentos;
    const salarioNeto = Math.max(0, salarioBruto - totalDescuentos);

    const resActualizado = await pool.query(
      `UPDATE liquidaciones
       SET monto_bonos = $1,
           monto_otros_haberes = $2,
           monto_otros_descuentos = $3,
           monto_ips_obrero = $4,
           monto_ips_patronal = $5,
           salario_bruto = $6,
           total_descuentos = $7,
           salario_neto = $8,
           observaciones = COALESCE($9, observaciones)
       WHERE id = $10 AND empresa_id = $11
       RETURNING *`,
      [bonos, otrosHaberes, otrosDescuentos, ipsObrero, ipsPatronal, salarioBruto, totalDescuentos, salarioNeto, observaciones, id, req.empresaId]
    );

    // Recomputar totales del periodo
    await pool.query(
      `UPDATE periodos_liquidacion
       SET total_bruto = (SELECT SUM(salario_bruto) FROM liquidaciones WHERE periodo_id = $1),
           total_descuentos = (SELECT SUM(total_descuentos) FROM liquidaciones WHERE periodo_id = $1),
           total_ips = (SELECT SUM(monto_ips_obrero) FROM liquidaciones WHERE periodo_id = $1),
           total_neto = (SELECT SUM(salario_neto) FROM liquidaciones WHERE periodo_id = $1)
       WHERE id = $1`,
      [liq.periodo_id]
    );

    return res.json({
      exito: true,
      mensaje: 'Conceptos ajustados correctamente.',
      datos: resActualizado.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar liquidación individual:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al actualizar liquidación.' });
  }
}

// CONFIRMAR PERIODO Y GENERAR RECIBOS OFICIALES
export async function confirmarPeriodoYGenerarRecibos(req: SolicitudAutenticada, res: Response) {
  const cliente = await pool.connect();
  try {
    const { id: periodoId } = req.params;

    await cliente.query('BEGIN');

    const resPeriodo = await cliente.query(
      `SELECT * FROM periodos_liquidacion WHERE id = $1 AND empresa_id = $2`,
      [periodoId, req.empresaId]
    );

    if (resPeriodo.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ exito: false, mensaje: 'Periodo no encontrado.' });
    }

    const periodo = resPeriodo.rows[0];

    // Obtener liquidaciones del periodo
    const resLiq = await cliente.query(
      `SELECT * FROM liquidaciones WHERE periodo_id = $1 AND empresa_id = $2`,
      [periodoId, req.empresaId]
    );

    if (resLiq.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(400).json({
        exito: false,
        mensaje: 'No hay liquidaciones calculadas para este periodo. Realice el cálculo primero.',
      });
    }

    // Contar cuántos recibos existen previamente en la empresa para numeración secuencial
    const resCount = await cliente.query(
      `SELECT COUNT(*) as total FROM recibos WHERE empresa_id = $1`,
      [req.empresaId]
    );
    let siguienteNumero = parseInt(resCount.rows[0]?.total || '0', 10) + 1;

    for (const liq of resLiq.rows) {
      const numRecibo = `REC-${periodo.anio}-${String(periodo.mes).padStart(2, '0')}-${String(siguienteNumero).padStart(4, '0')}`;
      siguienteNumero++;

      const letras = numeroALetras(Number(liq.salario_neto));

      await cliente.query(
        `INSERT INTO recibos (
          empresa_id, liquidacion_id, empleado_id, numero_recibo,
          periodo_nombre, fecha_emision, salario_bruto, total_descuentos,
          salario_neto, salario_neto_letras, estado
        ) VALUES (
          $1, $2, $3, $4,
          $5, CURRENT_DATE, $6, $7,
          $8, $9, 'Emitido'
        )
        ON CONFLICT (empresa_id, numero_recibo) DO NOTHING`,
        [
          req.empresaId, liq.id, liq.empleado_id, numRecibo,
          periodo.nombre, liq.salario_bruto, liq.total_descuentos,
          liq.salario_neto, letras
        ]
      );
    }

    // Actualizar estado de las liquidaciones y periodo a 'Confirmado'
    await cliente.query(`UPDATE liquidaciones SET estado = 'Confirmado' WHERE periodo_id = $1`, [periodoId]);
    await cliente.query(`UPDATE periodos_liquidacion SET estado = 'Confirmado' WHERE id = $1`, [periodoId]);

    await cliente.query('COMMIT');

    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: 'CONFIRMACION_LIQUIDACION',
      entidad: 'periodos_liquidacion',
      entidadId: periodoId,
      detalles: { periodo: periodo.nombre, totalRecibos: resLiq.rows.length },
      ip: req.ip,
    });

    return res.json({
      exito: true,
      mensaje: `Periodo confirmado exitosamente y ${resLiq.rows.length} recibos generados listos para entrega.`,
    });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error al confirmar periodo:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al confirmar periodo y generar recibos.' });
  } finally {
    cliente.release();
  }
}
