import { pool } from '../config/db';

export async function ejecutarMigraciones() {
  console.log('--- Iniciando migraciones de la base de datos TEKI RRHH SaaS ---');
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    // Habilitar extensión para UUIDs si no está habilitada
    await cliente.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 1. Empresas (Multi-tenant)
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(255) NOT NULL,
        ruc VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255),
        telefono VARCHAR(50),
        direccion TEXT,
        ciudad VARCHAR(100),
        pais VARCHAR(100) DEFAULT 'Paraguay',
        moneda VARCHAR(10) DEFAULT 'PYG',
        simbolo_moneda VARCHAR(5) DEFAULT '₲',
        logo_url TEXT,
        configuracion JSONB DEFAULT '{}'::jsonb,
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_empresas_ruc ON empresas(ruc);
      CREATE INDEX IF NOT EXISTS idx_empresas_activo ON empresas(activo);
    `);

    // 2. Sectores
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS sectores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL,
        codigo VARCHAR(50),
        descripcion TEXT,
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_sector_empresa_codigo UNIQUE (empresa_id, codigo)
      );
      CREATE INDEX IF NOT EXISTS idx_sectores_empresa ON sectores(empresa_id);
    `);

    // 3. Departamentos
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS departamentos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        sector_id UUID REFERENCES sectores(id) ON DELETE SET NULL,
        nombre VARCHAR(100) NOT NULL,
        codigo VARCHAR(50),
        descripcion TEXT,
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_departamentos_empresa ON departamentos(empresa_id);
    `);

    // 4. Cargos
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS cargos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        departamento_id UUID REFERENCES departamentos(id) ON DELETE SET NULL,
        nombre VARCHAR(150) NOT NULL,
        nivel VARCHAR(50) DEFAULT 'Intermedio',
        descripcion TEXT,
        salario_referencia NUMERIC(14,2) DEFAULT 0,
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_cargos_empresa ON cargos(empresa_id);
    `);

    // 5. Tipos de Contrato
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS tipos_contrato (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_tipos_contrato_empresa ON tipos_contrato(empresa_id);
    `);

    // 6. Horarios
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS horarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL,
        hora_entrada TIME NOT NULL DEFAULT '08:00',
        hora_salida TIME NOT NULL DEFAULT '17:00',
        tolerancia_minutos INT DEFAULT 15,
        dias_semana VARCHAR(100) DEFAULT 'Lunes a Viernes',
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_horarios_empresa ON horarios(empresa_id);
    `);

    // 7. Empleados
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS empleados (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        codigo VARCHAR(50) NOT NULL,
        -- Datos personales
        nombres VARCHAR(100) NOT NULL,
        apellidos VARCHAR(100) NOT NULL,
        documento VARCHAR(50) NOT NULL,
        fecha_nacimiento DATE,
        sexo VARCHAR(20) DEFAULT 'No especificado',
        estado_civil VARCHAR(50) DEFAULT 'Soltero/a',
        nacionalidad VARCHAR(50) DEFAULT 'Paraguaya',
        direccion TEXT,
        ciudad VARCHAR(100),
        telefono VARCHAR(50),
        celular VARCHAR(50),
        correo VARCHAR(150),
        -- Datos laborales
        fecha_ingreso DATE NOT NULL,
        fecha_salida DATE,
        sector_id UUID REFERENCES sectores(id) ON DELETE SET NULL,
        departamento_id UUID REFERENCES departamentos(id) ON DELETE SET NULL,
        cargo_id UUID REFERENCES cargos(id) ON DELETE SET NULL,
        tipo_contrato_id UUID REFERENCES tipos_contrato(id) ON DELETE SET NULL,
        salario_base NUMERIC(14,2) NOT NULL DEFAULT 0,
        horario_id UUID REFERENCES horarios(id) ON DELETE SET NULL,
        jefe_id UUID REFERENCES empleados(id) ON DELETE SET NULL,
        estado VARCHAR(50) DEFAULT 'Activo',
        -- Datos adicionales
        interno VARCHAR(50),
        correo_corporativo VARCHAR(150),
        contacto_emergencia_nombre VARCHAR(150),
        contacto_emergencia_telefono VARCHAR(50),
        contacto_emergencia_parentesco VARCHAR(50),
        observaciones TEXT,
        avatar_url TEXT,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_empleado_empresa_codigo UNIQUE (empresa_id, codigo),
        CONSTRAINT uq_empleado_empresa_documento UNIQUE (empresa_id, documento)
      );
      CREATE INDEX IF NOT EXISTS idx_empleados_empresa ON empleados(empresa_id);
      CREATE INDEX IF NOT EXISTS idx_empleados_estado ON empleados(estado);
      CREATE INDEX IF NOT EXISTS idx_empleados_sector ON empleados(sector_id);
      CREATE INDEX IF NOT EXISTS idx_empleados_cargo ON empleados(cargo_id);
    `);

    // 8. Usuarios
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        empleado_id UUID REFERENCES empleados(id) ON DELETE SET NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'Colaborador',
        avatar_url TEXT,
        activo BOOLEAN DEFAULT true,
        ultimo_acceso TIMESTAMP WITH TIME ZONE,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_usuario_empresa_email UNIQUE (empresa_id, email)
      );
      CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
    `);

    // 9. Documentos del Empleado
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS documentos_empleado (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
        tipo_documento VARCHAR(100) NOT NULL,
        nombre_archivo VARCHAR(255) NOT NULL,
        url_archivo TEXT,
        tamano_bytes INT DEFAULT 0,
        fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        notas TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_docs_empleado ON documentos_empleado(empleado_id);
    `);

    // 10. Marcaciones y Asistencia
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS marcaciones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
        fecha DATE NOT NULL,
        hora_entrada TIME,
        hora_salida TIME,
        horas_trabajadas NUMERIC(5,2) DEFAULT 0,
        horas_extra NUMERIC(5,2) DEFAULT 0,
        minutos_retraso INT DEFAULT 0,
        estado VARCHAR(50) DEFAULT 'Presente',
        tipo_origen VARCHAR(50) DEFAULT 'Manual',
        observaciones TEXT,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_marcacion_empleado_fecha UNIQUE (empleado_id, fecha)
      );
      CREATE INDEX IF NOT EXISTS idx_marcaciones_empresa_fecha ON marcaciones(empresa_id, fecha);
      CREATE INDEX IF NOT EXISTS idx_marcaciones_empleado ON marcaciones(empleado_id);
    `);

    // 11. Solicitudes de Vacaciones
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS solicitudes_vacaciones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
        fecha_solicitud DATE DEFAULT CURRENT_DATE,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        fecha_reincorporacion DATE NOT NULL,
        dias_solicitados INT NOT NULL,
        estado VARCHAR(50) DEFAULT 'Pendiente',
        motivo TEXT,
        respuesta_motivo TEXT,
        aprobado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
        fecha_respuesta TIMESTAMP WITH TIME ZONE,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_vacaciones_empresa ON solicitudes_vacaciones(empresa_id);
      CREATE INDEX IF NOT EXISTS idx_vacaciones_empleado ON solicitudes_vacaciones(empleado_id);
      CREATE INDEX IF NOT EXISTS idx_vacaciones_estado ON solicitudes_vacaciones(estado);
    `);

    // 12. Periodos de Liquidación
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS periodos_liquidacion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        anio INT NOT NULL,
        mes INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        estado VARCHAR(50) DEFAULT 'Borrador',
        total_bruto NUMERIC(15,2) DEFAULT 0,
        total_adicionales NUMERIC(15,2) DEFAULT 0,
        total_descuentos NUMERIC(15,2) DEFAULT 0,
        total_ips NUMERIC(15,2) DEFAULT 0,
        total_neto NUMERIC(15,2) DEFAULT 0,
        creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_periodo_empresa_anio_mes UNIQUE (empresa_id, anio, mes)
      );
      CREATE INDEX IF NOT EXISTS idx_periodos_empresa ON periodos_liquidacion(empresa_id);
    `);

    // 13. Conceptos Salariales (Catálogo)
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS conceptos_salariales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        codigo VARCHAR(50) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        tipo VARCHAR(20) NOT NULL,
        porcentaje NUMERIC(5,2),
        es_fijo BOOLEAN DEFAULT false,
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_conceptos_empresa ON conceptos_salariales(empresa_id);
    `);

    // 14. Liquidaciones
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS liquidaciones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        periodo_id UUID NOT NULL REFERENCES periodos_liquidacion(id) ON DELETE CASCADE,
        empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
        dias_trabajados INT DEFAULT 30,
        horas_extra_cantidad NUMERIC(5,2) DEFAULT 0,
        salario_base NUMERIC(14,2) NOT NULL,
        monto_horas_extra NUMERIC(14,2) DEFAULT 0,
        monto_bonos NUMERIC(14,2) DEFAULT 0,
        monto_otros_haberes NUMERIC(14,2) DEFAULT 0,
        monto_ausencias NUMERIC(14,2) DEFAULT 0,
        monto_otros_descuentos NUMERIC(14,2) DEFAULT 0,
        monto_ips_obrero NUMERIC(14,2) DEFAULT 0,
        monto_ips_patronal NUMERIC(14,2) DEFAULT 0,
        salario_bruto NUMERIC(14,2) NOT NULL,
        total_descuentos NUMERIC(14,2) NOT NULL,
        salario_neto NUMERIC(14,2) NOT NULL,
        estado VARCHAR(50) DEFAULT 'Borrador',
        observaciones TEXT,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_liquidacion_periodo_empleado UNIQUE (periodo_id, empleado_id)
      );
      CREATE INDEX IF NOT EXISTS idx_liquidaciones_empresa ON liquidaciones(empresa_id);
      CREATE INDEX IF NOT EXISTS idx_liquidaciones_periodo ON liquidaciones(periodo_id);
      CREATE INDEX IF NOT EXISTS idx_liquidaciones_empleado ON liquidaciones(empleado_id);
    `);

    // 15. Detalle de Liquidaciones
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS detalle_liquidaciones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        liquidacion_id UUID NOT NULL REFERENCES liquidaciones(id) ON DELETE CASCADE,
        concepto_id UUID,
        tipo VARCHAR(20) NOT NULL,
        concepto VARCHAR(150) NOT NULL,
        cantidad NUMERIC(5,2) DEFAULT 1,
        porcentaje NUMERIC(5,2),
        monto NUMERIC(14,2) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_detalle_liq ON detalle_liquidaciones(liquidacion_id);
    `);

    // 16. Recibos de Salario
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS recibos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        liquidacion_id UUID NOT NULL REFERENCES liquidaciones(id) ON DELETE CASCADE,
        empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
        numero_recibo VARCHAR(50) NOT NULL,
        periodo_nombre VARCHAR(100) NOT NULL,
        fecha_emision DATE DEFAULT CURRENT_DATE,
        salario_bruto NUMERIC(14,2) NOT NULL,
        total_descuentos NUMERIC(14,2) NOT NULL,
        salario_neto NUMERIC(14,2) NOT NULL,
        salario_neto_letras TEXT,
        estado VARCHAR(50) DEFAULT 'Emitido',
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_recibo_numero_empresa UNIQUE (empresa_id, numero_recibo)
      );
      CREATE INDEX IF NOT EXISTS idx_recibos_empresa ON recibos(empresa_id);
      CREATE INDEX IF NOT EXISTS idx_recibos_empleado ON recibos(empleado_id);
    `);

    // 17. Auditoría
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS auditoria (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        usuario_id UUID,
        usuario_nombre VARCHAR(150),
        accion VARCHAR(100) NOT NULL,
        entidad VARCHAR(100) NOT NULL,
        entidad_id VARCHAR(100),
        detalles JSONB,
        ip VARCHAR(50),
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON auditoria(empresa_id);
      CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria(entidad);
      CREATE INDEX IF NOT EXISTS idx_auditoria_creado ON auditoria(creado_en DESC);
    `);

    // 18. Módulos Preparados para el Futuro: Salas de Reuniones, Reuniones e Intranet
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS salas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL,
        tipo VARCHAR(50) DEFAULT 'FISICA', -- FISICA, VIRTUAL
        capacidad INT DEFAULT 10,
        ubicacion VARCHAR(150),
        equipamiento TEXT[],
        enlace_virtual VARCHAR(255),
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reuniones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT,
        modalidad VARCHAR(50) DEFAULT 'PRESENCIAL', -- PRESENCIAL, VIRTUAL, HIBRIDA
        sala_id UUID REFERENCES salas(id) ON DELETE SET NULL,
        organizador_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
        fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
        fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
        enlace_reunion VARCHAR(255),
        plataforma VARCHAR(50) DEFAULT 'MEET', -- MEET, TEAMS, ZOOM
        estado VARCHAR(50) DEFAULT 'PROGRAMADA', -- PROGRAMADA, EN_CURSO, FINALIZADA, CANCELADA
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS asistentes_reunion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reunion_id UUID NOT NULL REFERENCES reuniones(id) ON DELETE CASCADE,
        usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
        email_externo VARCHAR(255),
        nombre_externo VARCHAR(150),
        es_externo BOOLEAN DEFAULT false,
        estado_confirmacion VARCHAR(50) DEFAULT 'PENDIENTE' -- PENDIENTE, ACEPTADA, RECHAZADA
      );

      CREATE TABLE IF NOT EXISTS noticias_intranet (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        titulo VARCHAR(255) NOT NULL,
        contenido TEXT NOT NULL,
        categoria VARCHAR(100) DEFAULT 'General',
        imagen_url TEXT,
        publicado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
        fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        fijado BOOLEAN DEFAULT false
      );
    `);

    await cliente.query('COMMIT');
    console.log('✅ Migraciones ejecutadas con éxito.');
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('❌ Error durante la ejecución de las migraciones:', error);
    throw error;
  } finally {
    cliente.release();
  }
}

// Ejecución directa si se invoca por comando
if (require.main === module) {
  ejecutarMigraciones()
    .then(() => {
      console.log('Proceso de migración finalizado.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fallo de migración:', err);
      process.exit(1);
    });
}
