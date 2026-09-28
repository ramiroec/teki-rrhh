import { Response } from 'express';
import { pool } from '../config/db';
import { SolicitudAutenticada } from '../modelos/tipos';
import { registrarAuditoria } from '../servicios/auditoria';

export async function listarEmpleados(req: SolicitudAutenticada, res: Response) {
  try {
    const { busqueda, sectorId, departamentoId, cargoId, estado, ordenPor, ordenDir } = req.query;

    let consulta = `
      SELECT e.id, e.codigo, e.nombres, e.apellidos, e.documento, e.fecha_nacimiento,
             e.sexo, e.estado_civil, e.correo, e.celular, e.fecha_ingreso, e.fecha_salida,
             e.salario_base, e.estado, e.avatar_url, e.correo_corporativo, e.interno,
             s.nombre as sector_nombre,
             d.nombre as departamento_nombre,
             c.nombre as cargo_nombre,
             t.nombre as tipo_contrato_nombre,
             h.nombre as horario_nombre,
             CONCAT(j.nombres, ' ', j.apellidos) as jefe_nombre
      FROM empleados e
      LEFT JOIN sectores s ON s.id = e.sector_id
      LEFT JOIN departamentos d ON d.id = e.departamento_id
      LEFT JOIN cargos c ON c.id = e.cargo_id
      LEFT JOIN tipos_contrato t ON t.id = e.tipo_contrato_id
      LEFT JOIN horarios h ON h.id = e.horario_id
      LEFT JOIN empleados j ON j.id = e.jefe_id
      WHERE e.empresa_id = $1
    `;

    const params: any[] = [req.empresaId];

    if (busqueda) {
      params.push(`%${busqueda}%`);
      const idx = params.length;
      consulta += ` AND (
        e.nombres ILIKE $${idx} OR
        e.apellidos ILIKE $${idx} OR
        e.documento ILIKE $${idx} OR
        e.codigo ILIKE $${idx} OR
        e.correo ILIKE $${idx} OR
        e.correo_corporativo ILIKE $${idx}
      )`;
    }

    if (sectorId) {
      params.push(sectorId);
      consulta += ` AND e.sector_id = $${params.length}`;
    }

    if (departamentoId) {
      params.push(departamentoId);
      consulta += ` AND e.departamento_id = $${params.length}`;
    }

    if (cargoId) {
      params.push(cargoId);
      consulta += ` AND e.cargo_id = $${params.length}`;
    }

    if (estado) {
      params.push(estado);
      consulta += ` AND e.estado = $${params.length}`;
    }

    const campoOrden = ['nombres', 'fecha_ingreso', 'salario_base', 'codigo'].includes(ordenPor as string)
      ? `e.${ordenPor}`
      : 'e.nombres';
    const direccion = ordenDir === 'DESC' ? 'DESC' : 'ASC';

    consulta += ` ORDER BY ${campoOrden} ${direccion}`;

    const resultado = await pool.query(consulta, params);

    return res.json({
      exito: true,
      total: resultado.rows.length,
      datos: resultado.rows,
    });
  } catch (error) {
    console.error('Error al listar empleados:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al obtener la lista de empleados.' });
  }
}

export async function obtenerEmpleadoPorId(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;

    // Si el usuario es rol 'Colaborador', solo puede ver su propio perfil
    if (req.usuario?.rol === 'Colaborador' && req.usuario?.empleadoId !== id) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tiene autorización para visualizar los datos de otros colaboradores.',
      });
    }

    const consulta = `
      SELECT e.*,
             s.nombre as sector_nombre,
             d.nombre as departamento_nombre,
             c.nombre as cargo_nombre,
             t.nombre as tipo_contrato_nombre,
             h.nombre as horario_nombre,
             h.hora_entrada, h.hora_salida,
             CONCAT(j.nombres, ' ', j.apellidos) as jefe_nombre
      FROM empleados e
      LEFT JOIN sectores s ON s.id = e.sector_id
      LEFT JOIN departamentos d ON d.id = e.departamento_id
      LEFT JOIN cargos c ON c.id = e.cargo_id
      LEFT JOIN tipos_contrato t ON t.id = e.tipo_contrato_id
      LEFT JOIN horarios h ON h.id = e.horario_id
      LEFT JOIN empleados j ON j.id = e.jefe_id
      WHERE e.id = $1 AND e.empresa_id = $2
    `;

    const resultado = await pool.query(consulta, [id, req.empresaId]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Empleado no encontrado.' });
    }

    const empleado = resultado.rows[0];

    // Consultar documentos asociados
    const resDocs = await pool.query(
      `SELECT * FROM documentos_empleado WHERE empleado_id = $1 AND empresa_id = $2 ORDER BY fecha_subida DESC`,
      [id, req.empresaId]
    );

    // Consultar últimas marcaciones
    const resMarcaciones = await pool.query(
      `SELECT * FROM marcaciones WHERE empleado_id = $1 AND empresa_id = $2 ORDER BY fecha DESC LIMIT 10`,
      [id, req.empresaId]
    );

    // Consultar solicitudes de vacaciones
    const resVacaciones = await pool.query(
      `SELECT * FROM solicitudes_vacaciones WHERE empleado_id = $1 AND empresa_id = $2 ORDER BY fecha_solicitud DESC`,
      [id, req.empresaId]
    );

    return res.json({
      exito: true,
      datos: {
        ...empleado,
        documentos: resDocs.rows,
        marcacionesRecientes: resMarcaciones.rows,
        solicitudesVacaciones: resVacaciones.rows,
      },
    });
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar datos del empleado.' });
  }
}

export async function crearEmpleado(req: SolicitudAutenticada, res: Response) {
  try {
    const {
      codigo, nombres, apellidos, documento, fecha_nacimiento, sexo, estado_civil,
      nacionalidad, direccion, ciudad, telefono, celular, correo,
      fecha_ingreso, sector_id, departamento_id, cargo_id, tipo_contrato_id,
      salario_base, horario_id, jefe_id, estado,
      interno, correo_corporativo, contacto_emergencia_nombre,
      contacto_emergencia_telefono, contacto_emergencia_parentesco,
      observaciones, avatar_url
    } = req.body;

    if (!codigo || !nombres || !apellidos || !documento || !fecha_ingreso || salario_base === undefined) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Complete los campos obligatorios: Código, Nombres, Apellidos, Documento, Fecha de ingreso y Salario base.',
      });
    }

    const consulta = `
      INSERT INTO empleados (
        empresa_id, codigo, nombres, apellidos, documento, fecha_nacimiento, sexo,
        estado_civil, nacionalidad, direccion, ciudad, telefono, celular, correo,
        fecha_ingreso, sector_id, departamento_id, cargo_id, tipo_contrato_id,
        salario_base, horario_id, jefe_id, estado,
        interno, correo_corporativo, contacto_emergencia_nombre,
        contacto_emergencia_telefono, contacto_emergencia_parentesco,
        observaciones, avatar_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22, $23,
        $24, $25, $26,
        $27, $28,
        $29, $30
      ) RETURNING *
    `;

    const resultado = await pool.query(consulta, [
      req.empresaId,
      codigo.trim(),
      nombres.trim(),
      apellidos.trim(),
      documento.trim(),
      fecha_nacimiento || null,
      sexo || 'No especificado',
      estado_civil || 'Soltero/a',
      nacionalidad || 'Paraguaya',
      direccion || null,
      ciudad || null,
      telefono || null,
      celular || null,
      correo || null,
      fecha_ingreso,
      sector_id || null,
      departamento_id || null,
      cargo_id || null,
      tipo_contrato_id || null,
      Number(salario_base) || 0,
      horario_id || null,
      jefe_id || null,
      estado || 'Activo',
      interno || null,
      correo_corporativo || null,
      contacto_emergencia_nombre || null,
      contacto_emergencia_telefono || null,
      contacto_emergencia_parentesco || null,
      observaciones || null,
      avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nombres + ' ' + apellidos)}`,
    ]);

    const nuevoEmpleado = resultado.rows[0];

    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: 'ALTA_EMPLEADO',
      entidad: 'empleados',
      entidadId: nuevoEmpleado.id,
      detalles: { codigo, nombres, apellidos, documento, salario_base },
      ip: req.ip,
    });

    return res.status(201).json({
      exito: true,
      mensaje: 'Empleado registrado exitosamente.',
      datos: nuevoEmpleado,
    });
  } catch (error: any) {
    console.error('Error al crear empleado:', error);
    if (error.code === '23505') {
      if (error.constraint?.includes('codigo')) {
        return res.status(400).json({ exito: false, mensaje: 'Ya existe un empleado con este código en la empresa.' });
      }
      if (error.constraint?.includes('documento')) {
        return res.status(400).json({ exito: false, mensaje: 'Ya existe un empleado con este número de documento en la empresa.' });
      }
    }
    return res.status(500).json({ exito: false, mensaje: 'Ocurrió un error al guardar el empleado.' });
  }
}

export async function actualizarEmpleado(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    const {
      codigo, nombres, apellidos, documento, fecha_nacimiento, sexo, estado_civil,
      nacionalidad, direccion, ciudad, telefono, celular, correo,
      fecha_ingreso, fecha_salida, sector_id, departamento_id, cargo_id, tipo_contrato_id,
      salario_base, horario_id, jefe_id, estado,
      interno, correo_corporativo, contacto_emergencia_nombre,
      contacto_emergencia_telefono, contacto_emergencia_parentesco,
      observaciones, avatar_url
    } = req.body;

    const consulta = `
      UPDATE empleados
      SET codigo = COALESCE($1, codigo),
          nombres = COALESCE($2, nombres),
          apellidos = COALESCE($3, apellidos),
          documento = COALESCE($4, documento),
          fecha_nacimiento = $5,
          sexo = COALESCE($6, sexo),
          estado_civil = COALESCE($7, estado_civil),
          nacionalidad = COALESCE($8, nacionalidad),
          direccion = $9,
          ciudad = $10,
          telefono = $11,
          celular = $12,
          correo = $13,
          fecha_ingreso = COALESCE($14, fecha_ingreso),
          fecha_salida = $15,
          sector_id = $16,
          departamento_id = $17,
          cargo_id = $18,
          tipo_contrato_id = $19,
          salario_base = COALESCE($20, salario_base),
          horario_id = $21,
          jefe_id = $22,
          estado = COALESCE($23, estado),
          interno = $24,
          correo_corporativo = $25,
          contacto_emergencia_nombre = $26,
          contacto_emergencia_telefono = $27,
          contacto_emergencia_parentesco = $28,
          observaciones = $29,
          avatar_url = COALESCE($30, avatar_url),
          actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $31 AND empresa_id = $32
      RETURNING *
    `;

    const resultado = await pool.query(consulta, [
      codigo, nombres, apellidos, documento, fecha_nacimiento || null, sexo, estado_civil,
      nacionalidad, direccion || null, ciudad || null, telefono || null, celular || null, correo || null,
      fecha_ingreso, fecha_salida || null, sector_id || null, departamento_id || null, cargo_id || null, tipo_contrato_id || null,
      salario_base !== undefined ? Number(salario_base) : null, horario_id || null, jefe_id || null, estado,
      interno || null, correo_corporativo || null, contacto_emergencia_nombre || null,
      contacto_emergencia_telefono || null, contacto_emergencia_parentesco || null,
      observaciones || null, avatar_url,
      id, req.empresaId
    ]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Empleado no encontrado.' });
    }

    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: 'MODIFICACION_EMPLEADO',
      entidad: 'empleados',
      entidadId: id,
      detalles: { nombres, apellidos, cargo_id, salario_base, estado },
      ip: req.ip,
    });

    return res.json({
      exito: true,
      mensaje: 'Datos del empleado actualizados correctamente.',
      datos: resultado.rows[0],
    });
  } catch (error: any) {
    console.error('Error al actualizar empleado:', error);
    if (error.code === '23505') {
      return res.status(400).json({ exito: false, mensaje: 'El código o documento ya está en uso por otro empleado.' });
    }
    return res.status(500).json({ exito: false, mensaje: 'No pudimos guardar los cambios. Verifique los datos e intente nuevamente.' });
  }
}

export async function cambiarEstadoEmpleado(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    const { estado, fecha_salida } = req.body;

    if (!estado) {
      return res.status(400).json({ exito: false, mensaje: 'Debe especificar el nuevo estado.' });
    }

    const consulta = `
      UPDATE empleados
      SET estado = $1,
          fecha_salida = CASE WHEN $1 = 'Baja' THEN COALESCE($2, CURRENT_DATE) ELSE NULL END,
          actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $3 AND empresa_id = $4
      RETURNING id, nombres, apellidos, estado, fecha_salida
    `;

    const resultado = await pool.query(consulta, [estado, fecha_salida || null, id, req.empresaId]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Empleado no encontrado.' });
    }

    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: estado === 'Baja' ? 'BAJA_EMPLEADO' : 'CAMBIO_ESTADO_EMPLEADO',
      entidad: 'empleados',
      entidadId: id,
      detalles: { estado, fecha_salida },
      ip: req.ip,
    });

    return res.json({
      exito: true,
      mensaje: `El estado del empleado se actualizó a "${estado}".`,
      datos: resultado.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al cambiar estado del empleado.' });
  }
}

export async function agregarDocumentoEmpleado(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    const { tipo_documento, nombre_archivo, url_archivo, tamano_bytes, notas } = req.body;

    if (!tipo_documento || !nombre_archivo) {
      return res.status(400).json({ exito: false, mensaje: 'Complete los datos del documento.' });
    }

    const consulta = `
      INSERT INTO documentos_empleado (empresa_id, empleado_id, tipo_documento, nombre_archivo, url_archivo, tamano_bytes, notas)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const resultado = await pool.query(consulta, [
      req.empresaId,
      id,
      tipo_documento,
      nombre_archivo,
      url_archivo || '/documentos/archivo_adjunto.pdf',
      tamano_bytes || 102400,
      notas || null,
    ]);

    return res.status(201).json({
      exito: true,
      mensaje: 'Documento registrado con éxito.',
      datos: resultado.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al registrar documento.' });
  }
}
