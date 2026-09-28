import { Response } from 'express';
import { pool } from '../config/db';
import { SolicitudAutenticada } from '../modelos/tipos';
import { registrarAuditoria } from '../servicios/auditoria';
import { obtenerReglasEmpresa } from '../config/reglas_negocio';

export async function obtenerEmpresaActual(req: SolicitudAutenticada, res: Response) {
  try {
    const consulta = `
      SELECT id, nombre, ruc, email, telefono, direccion, ciudad, pais, moneda,
             simbolo_moneda, logo_url, configuracion, creado_en
      FROM empresas
      WHERE id = $1
    `;
    const resultado = await pool.query(consulta, [req.empresaId]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Empresa no encontrada.' });
    }

    const empresa = resultado.rows[0];
    const reglas = obtenerReglasEmpresa(empresa.configuracion);

    return res.json({
      exito: true,
      datos: {
        ...empresa,
        reglasNegocio: reglas,
      },
    });
  } catch (error) {
    console.error('Error al obtener datos de la empresa:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al consultar empresa.' });
  }
}

export async function actualizarConfiguracionEmpresa(req: SolicitudAutenticada, res: Response) {
  try {
    const { nombre, telefono, direccion, ciudad, configuracion } = req.body;

    const consultaActual = `SELECT configuracion FROM empresas WHERE id = $1`;
    const resActual = await pool.query(consultaActual, [req.empresaId]);
    const configActual = resActual.rows[0]?.configuracion || {};

    const nuevaConfiguracion = {
      ...configActual,
      ...(configuracion || {}),
    };

    const consulta = `
      UPDATE empresas
      SET nombre = COALESCE($1, nombre),
          telefono = COALESCE($2, telefono),
          direccion = COALESCE($3, direccion),
          ciudad = COALESCE($4, ciudad),
          configuracion = $5,
          actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, nombre, ruc, email, telefono, direccion, ciudad, configuracion
    `;

    const resultado = await pool.query(consulta, [
      nombre,
      telefono,
      direccion,
      ciudad,
      JSON.stringify(nuevaConfiguracion),
      req.empresaId,
    ]);

    await registrarAuditoria({
      empresaId: req.empresaId!,
      usuarioId: req.usuario?.id,
      usuarioNombre: `${req.usuario?.nombre} ${req.usuario?.apellido}`,
      accion: 'ACTUALIZAR_CONFIGURACION',
      entidad: 'empresas',
      entidadId: req.empresaId,
      detalles: nuevaConfiguracion,
      ip: req.ip,
    });

    return res.json({
      exito: true,
      mensaje: 'Configuración actualizada exitosamente.',
      datos: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar configuración de empresa:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al guardar los cambios.' });
  }
}
