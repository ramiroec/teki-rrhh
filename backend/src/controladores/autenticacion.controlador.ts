import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { SolicitudAutenticada, RolUsuario } from '../modelos/tipos';
import { registrarAuditoria } from '../servicios/auditoria';

const JWT_SECRET = process.env.JWT_SECRET || 'teki_rrhh_super_secreto_seguro_2027_production_key_saas';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function iniciarSesion(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Por favor complete el correo y la contraseña.',
      });
    }

    const consulta = `
      SELECT u.id, u.empresa_id, u.empleado_id, u.email, u.password_hash, u.nombre, u.apellido,
             u.rol, u.avatar_url, u.activo,
             e.nombre as empresa_nombre, e.ruc as empresa_ruc, e.simbolo_moneda as empresa_simbolo_moneda,
             e.moneda as empresa_moneda
      FROM usuarios u
      JOIN empresas e ON e.id = u.empresa_id
      WHERE LOWER(u.email) = LOWER($1) AND u.activo = true AND e.activo = true
    `;

    const resultado = await pool.query(consulta, [email.trim()]);

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Las credenciales ingresadas son incorrectas.',
      });
    }

    const usuario = resultado.rows[0];
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Las credenciales ingresadas son incorrectas.',
      });
    }

    // Actualizar último acceso
    await pool.query('UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1', [usuario.id]);

    const payload = {
      id: usuario.id,
      empresaId: usuario.empresa_id,
      empleadoId: usuario.empleado_id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol as RolUsuario,
      empresaNombre: usuario.empresa_nombre,
      empresaSimboloMoneda: usuario.empresa_simbolo_moneda,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });

    await registrarAuditoria({
      empresaId: usuario.empresa_id,
      usuarioId: usuario.id,
      usuarioNombre: `${usuario.nombre} ${usuario.apellido}`,
      accion: 'INICIO_SESION',
      entidad: 'usuarios',
      entidadId: usuario.id,
      detalles: { email: usuario.email },
      ip: req.ip,
    });

    return res.json({
      exito: true,
      mensaje: 'Bienvenido/a al sistema',
      datos: {
        token,
        usuario: {
          id: usuario.id,
          empresaId: usuario.empresa_id,
          empleadoId: usuario.empleado_id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          rol: usuario.rol,
          avatarUrl: usuario.avatar_url,
          empresa: {
            id: usuario.empresa_id,
            nombre: usuario.empresa_nombre,
            ruc: usuario.empresa_ruc,
            moneda: usuario.empresa_moneda,
            simboloMoneda: usuario.empresa_simbolo_moneda,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Ocurrió un error al procesar la solicitud. Por favor intente más tarde.',
    });
  }
}

export async function obtenerUsuarioActual(req: SolicitudAutenticada, res: Response) {
  try {
    if (!req.usuario) {
      return res.status(401).json({ exito: false, mensaje: 'No autenticado' });
    }

    const consulta = `
      SELECT u.id, u.empresa_id, u.empleado_id, u.email, u.nombre, u.apellido,
             u.rol, u.avatar_url, u.activo, u.ultimo_acceso,
             e.nombre as empresa_nombre, e.ruc as empresa_ruc, e.simbolo_moneda as empresa_simbolo_moneda,
             e.moneda as empresa_moneda, e.configuracion as empresa_configuracion,
             emp.codigo as empleado_codigo, emp.cargo_id
      FROM usuarios u
      JOIN empresas e ON e.id = u.empresa_id
      LEFT JOIN empleados emp ON emp.id = u.empleado_id
      WHERE u.id = $1 AND u.empresa_id = $2
    `;

    const resultado = await pool.query(consulta, [req.usuario.id, req.empresaId]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    const u = resultado.rows[0];

    return res.json({
      exito: true,
      datos: {
        id: u.id,
        empresaId: u.empresa_id,
        empleadoId: u.empleado_id,
        empleadoCodigo: u.empleado_codigo,
        email: u.email,
        nombre: u.nombre,
        apellido: u.apellido,
        rol: u.rol,
        avatarUrl: u.avatar_url,
        ultimoAcceso: u.ultimo_acceso,
        empresa: {
          id: u.empresa_id,
          nombre: u.empresa_nombre,
          ruc: u.empresa_ruc,
          moneda: u.empresa_moneda,
          simboloMoneda: u.empresa_simbolo_moneda,
          configuracion: u.empresa_configuracion,
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al consultar la información del usuario.',
    });
  }
}

export async function listarEmpresasDemo(req: Request, res: Response) {
  try {
    const consulta = `
      SELECT id, nombre, ruc, email, ciudad, simbolo_moneda
      FROM empresas
      WHERE activo = true
      ORDER BY nombre ASC
    `;
    const resultado = await pool.query(consulta);
    return res.json({
      exito: true,
      datos: resultado.rows,
    });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al listar empresas demo.' });
  }
}
