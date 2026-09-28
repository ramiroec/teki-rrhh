import { Response } from 'express';
import { pool } from '../config/db';
import { SolicitudAutenticada } from '../modelos/tipos';
import { registrarAuditoria } from '../servicios/auditoria';

// SECTORES
export async function listarSectores(req: SolicitudAutenticada, res: Response) {
  try {
    const { busqueda, soloActivos } = req.query;
    let consulta = `
      SELECT s.*,
        COUNT(DISTINCT d.id) as total_departamentos,
        COUNT(DISTINCT e.id) as total_empleados
      FROM sectores s
      LEFT JOIN departamentos d ON d.sector_id = s.id AND d.activo = true
      LEFT JOIN empleados e ON e.sector_id = s.id AND e.estado = 'Activo'
      WHERE s.empresa_id = $1
    `;
    const params: any[] = [req.empresaId];

    if (soloActivos === 'true') {
      consulta += ` AND s.activo = true`;
    }
    if (busqueda) {
      params.push(`%${busqueda}%`);
      consulta += ` AND (s.nombre ILIKE $${params.length} OR s.codigo ILIKE $${params.length})`;
    }

    consulta += ` GROUP BY s.id ORDER BY s.nombre ASC`;
    const resultado = await pool.query(consulta, params);
    return res.json({ exito: true, datos: resultado.rows });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al listar sectores.' });
  }
}

export async function crearSector(req: SolicitudAutenticada, res: Response) {
  try {
    const { nombre, codigo, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ exito: false, mensaje: 'El nombre del sector es requerido.' });
    }

    const consulta = `
      INSERT INTO sectores (empresa_id, nombre, codigo, descripcion)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [req.empresaId, nombre, codigo || null, descripcion || null]);

    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: 'CREAR_SECTOR',
      entidad: 'sectores',
      entidadId: resultado.rows[0].id,
      detalles: { nombre, codigo },
    });

    return res.status(201).json({ exito: true, mensaje: 'Sector creado con éxito.', datos: resultado.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ exito: false, mensaje: 'Ya existe un sector con este código en la empresa.' });
    }
    return res.status(500).json({ exito: false, mensaje: 'Error al crear sector.' });
  }
}

export async function actualizarSector(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    const { nombre, codigo, descripcion, activo } = req.body;

    const consulta = `
      UPDATE sectores
      SET nombre = COALESCE($1, nombre),
          codigo = COALESCE($2, codigo),
          descripcion = COALESCE($3, descripcion),
          activo = COALESCE($4, activo)
      WHERE id = $5 AND empresa_id = $6
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [nombre, codigo, descripcion, activo, id, req.empresaId]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Sector no encontrado.' });
    }

    return res.json({ exito: true, mensaje: 'Sector actualizado.', datos: resultado.rows[0] });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al actualizar sector.' });
  }
}

export async function desactivarSector(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      `UPDATE sectores SET activo = false WHERE id = $1 AND empresa_id = $2 RETURNING *`,
      [id, req.empresaId]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Sector no encontrado.' });
    }
    return res.json({ exito: true, mensaje: 'Sector desactivado.', datos: resultado.rows[0] });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al desactivar sector.' });
  }
}

// DEPARTAMENTOS
export async function listarDepartamentos(req: SolicitudAutenticada, res: Response) {
  try {
    const { sectorId, soloActivos, busqueda } = req.query;
    let consulta = `
      SELECT d.*, s.nombre as sector_nombre,
        COUNT(DISTINCT c.id) as total_cargos,
        COUNT(DISTINCT e.id) as total_empleados
      FROM departamentos d
      LEFT JOIN sectores s ON s.id = d.sector_id
      LEFT JOIN cargos c ON c.departamento_id = d.id AND c.activo = true
      LEFT JOIN empleados e ON e.departamento_id = d.id AND e.estado = 'Activo'
      WHERE d.empresa_id = $1
    `;
    const params: any[] = [req.empresaId];

    if (sectorId) {
      params.push(sectorId);
      consulta += ` AND d.sector_id = $${params.length}`;
    }
    if (soloActivos === 'true') {
      consulta += ` AND d.activo = true`;
    }
    if (busqueda) {
      params.push(`%${busqueda}%`);
      consulta += ` AND (d.nombre ILIKE $${params.length} OR d.codigo ILIKE $${params.length})`;
    }

    consulta += ` GROUP BY d.id, s.nombre ORDER BY d.nombre ASC`;
    const resultado = await pool.query(consulta, params);
    return res.json({ exito: true, datos: resultado.rows });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al listar departamentos.' });
  }
}

export async function crearDepartamento(req: SolicitudAutenticada, res: Response) {
  try {
    const { sector_id, nombre, codigo, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ exito: false, mensaje: 'El nombre del departamento es requerido.' });
    }

    const consulta = `
      INSERT INTO departamentos (empresa_id, sector_id, nombre, codigo, descripcion)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [req.empresaId, sector_id || null, nombre, codigo || null, descripcion || null]);
    return res.status(201).json({ exito: true, mensaje: 'Departamento creado.', datos: resultado.rows[0] });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al crear departamento.' });
  }
}

export async function actualizarDepartamento(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    const { sector_id, nombre, codigo, descripcion, activo } = req.body;

    const consulta = `
      UPDATE departamentos
      SET sector_id = COALESCE($1, sector_id),
          nombre = COALESCE($2, nombre),
          codigo = COALESCE($3, codigo),
          descripcion = COALESCE($4, descripcion),
          activo = COALESCE($5, activo)
      WHERE id = $6 AND empresa_id = $7
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [sector_id, nombre, codigo, descripcion, activo, id, req.empresaId]);
    return res.json({ exito: true, mensaje: 'Departamento actualizado.', datos: resultado.rows[0] });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al actualizar departamento.' });
  }
}

export async function desactivarDepartamento(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE departamentos SET activo = false WHERE id = $1 AND empresa_id = $2', [id, req.empresaId]);
    return res.json({ exito: true, mensaje: 'Departamento desactivado.' });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al desactivar departamento.' });
  }
}

// CARGOS
export async function listarCargos(req: SolicitudAutenticada, res: Response) {
  try {
    const { departamentoId, soloActivos, busqueda } = req.query;
    let consulta = `
      SELECT c.*, d.nombre as departamento_nombre, s.nombre as sector_nombre,
        COUNT(e.id) as total_empleados
      FROM cargos c
      LEFT JOIN departamentos d ON d.id = c.departamento_id
      LEFT JOIN sectores s ON s.id = d.sector_id
      LEFT JOIN empleados e ON e.cargo_id = c.id AND e.estado = 'Activo'
      WHERE c.empresa_id = $1
    `;
    const params: any[] = [req.empresaId];

    if (departamentoId) {
      params.push(departamentoId);
      consulta += ` AND c.departamento_id = $${params.length}`;
    }
    if (soloActivos === 'true') {
      consulta += ` AND c.activo = true`;
    }
    if (busqueda) {
      params.push(`%${busqueda}%`);
      consulta += ` AND c.nombre ILIKE $${params.length}`;
    }

    consulta += ` GROUP BY c.id, d.nombre, s.nombre ORDER BY c.nombre ASC`;
    const resultado = await pool.query(consulta, params);
    return res.json({ exito: true, datos: resultado.rows });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al listar cargos.' });
  }
}

export async function crearCargo(req: SolicitudAutenticada, res: Response) {
  try {
    const { departamento_id, nombre, nivel, descripcion, salario_referencia } = req.body;
    if (!nombre) {
      return res.status(400).json({ exito: false, mensaje: 'El nombre del cargo es requerido.' });
    }

    const consulta = `
      INSERT INTO cargos (empresa_id, departamento_id, nombre, nivel, descripcion, salario_referencia)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [
      req.empresaId,
      departamento_id || null,
      nombre,
      nivel || 'Intermedio',
      descripcion || null,
      salario_referencia || 0,
    ]);
    return res.status(201).json({ exito: true, mensaje: 'Cargo creado exitosamente.', datos: resultado.rows[0] });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al crear cargo.' });
  }
}

export async function actualizarCargo(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    const { departamento_id, nombre, nivel, descripcion, salario_referencia, activo } = req.body;

    const consulta = `
      UPDATE cargos
      SET departamento_id = COALESCE($1, departamento_id),
          nombre = COALESCE($2, nombre),
          nivel = COALESCE($3, nivel),
          descripcion = COALESCE($4, descripcion),
          salario_referencia = COALESCE($5, salario_referencia),
          activo = COALESCE($6, activo)
      WHERE id = $7 AND empresa_id = $8
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [
      departamento_id,
      nombre,
      nivel,
      descripcion,
      salario_referencia,
      activo,
      id,
      req.empresaId,
    ]);
    return res.json({ exito: true, mensaje: 'Cargo actualizado.', datos: resultado.rows[0] });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al actualizar cargo.' });
  }
}

export async function desactivarCargo(req: SolicitudAutenticada, res: Response) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE cargos SET activo = false WHERE id = $1 AND empresa_id = $2', [id, req.empresaId]);
    return res.json({ exito: true, mensaje: 'Cargo desactivado.' });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al desactivar cargo.' });
  }
}

// TIPOS DE CONTRATO
export async function listarTiposContrato(req: SolicitudAutenticada, res: Response) {
  try {
    const resu = await pool.query(
      `SELECT t.*, COUNT(e.id) as total_empleados 
       FROM tipos_contrato t 
       LEFT JOIN empleados e ON e.tipo_contrato_id = t.id AND e.estado = 'Activo'
       WHERE t.empresa_id = $1 
       GROUP BY t.id ORDER BY t.nombre ASC`,
      [req.empresaId]
    );
    return res.json({ exito: true, datos: resu.rows });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al listar tipos de contrato.' });
  }
}

export async function crearTipoContrato(req: SolicitudAutenticada, res: Response) {
  try {
    const { nombre, descripcion } = req.body;
    const resu = await pool.query(
      `INSERT INTO tipos_contrato (empresa_id, nombre, descripcion) VALUES ($1, $2, $3) RETURNING *`,
      [req.empresaId, nombre, descripcion]
    );
    return res.status(201).json({ exito: true, datos: resu.rows[0] });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al crear tipo de contrato.' });
  }
}

// HORARIOS
export async function listarHorarios(req: SolicitudAutenticada, res: Response) {
  try {
    const resu = await pool.query(
      `SELECT h.*, COUNT(e.id) as total_empleados
       FROM horarios h
       LEFT JOIN empleados e ON e.horario_id = h.id AND e.estado = 'Activo'
       WHERE h.empresa_id = $1
       GROUP BY h.id ORDER BY h.nombre ASC`,
      [req.empresaId]
    );
    return res.json({ exito: true, datos: resu.rows });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al listar horarios.' });
  }
}

export async function crearHorario(req: SolicitudAutenticada, res: Response) {
  try {
    const { nombre, hora_entrada, hora_salida, tolerancia_minutos, dias_semana } = req.body;
    const resu = await pool.query(
      `INSERT INTO horarios (empresa_id, nombre, hora_entrada, hora_salida, tolerancia_minutos, dias_semana)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.empresaId, nombre, hora_entrada || '08:00', hora_salida || '17:00', tolerancia_minutos ?? 15, dias_semana || 'Lunes a Viernes']
    );
    return res.status(201).json({ exito: true, datos: resu.rows[0] });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al crear horario.' });
  }
}

// CONCEPTOS SALARIALES
export async function listarConceptosSalariales(req: SolicitudAutenticada, res: Response) {
  try {
    const resu = await pool.query(
      `SELECT * FROM conceptos_salariales WHERE empresa_id = $1 ORDER BY tipo ASC, codigo ASC`,
      [req.empresaId]
    );
    return res.json({ exito: true, datos: resu.rows });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al listar conceptos salariales.' });
  }
}

export async function crearConceptoSalarial(req: SolicitudAutenticada, res: Response) {
  try {
    const { codigo, nombre, tipo, porcentaje, es_fijo } = req.body;
    const resu = await pool.query(
      `INSERT INTO conceptos_salariales (empresa_id, codigo, nombre, tipo, porcentaje, es_fijo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.empresaId, codigo, nombre, tipo, porcentaje || null, es_fijo ?? false]
    );
    return res.status(201).json({ exito: true, datos: resu.rows[0] });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al crear concepto salarial.' });
  }
}
