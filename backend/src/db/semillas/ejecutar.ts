import { pool } from '../../config/db';
import bcrypt from 'bcryptjs';

// Función auxiliar para convertir números a palabras en español para los recibos
function numeroALetras(monto: number): string {
  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales = ['once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const entero = Math.floor(monto);
  if (entero === 0) return 'Cero guaraníes';

  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const resto = entero % 1000;

  let resultado = '';

  function convertirCentena(num: number): string {
    if (num === 100) return 'cien';
    let s = '';
    const c = Math.floor(num / 100);
    const d = Math.floor((num % 100) / 10);
    const u = num % 10;

    if (c > 0) s += centenas[c] + ' ';
    if (d === 1 && u > 0) {
      s += especiales[u - 1];
    } else if (d > 0) {
      s += decenas[d];
      if (u > 0) s += ' y ' + unidades[u];
    } else if (u > 0) {
      s += unidades[u];
    }
    return s.trim();
  }

  if (millones > 0) {
    if (millones === 1) resultado += 'un millón ';
    else resultado += convertirCentena(millones) + ' millones ';
  }

  if (miles > 0) {
    if (miles === 1) resultado += 'mil ';
    else resultado += convertirCentena(miles) + ' mil ';
  }

  if (resto > 0) {
    resultado += convertirCentena(resto);
  }

  const texto = resultado.trim() + ' guaraníes';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export async function semillarDatos() {
  console.log('--- Iniciando siembra de datos de prueba TEKI RRHH SaaS ---');
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    // 1. Limpiar datos existentes respetando integridad referencial
    await cliente.query(`
      TRUNCATE TABLE 
        noticias_intranet,
        asistentes_reunion,
        reuniones,
        salas,
        auditoria,
        recibos,
        detalle_liquidaciones,
        liquidaciones,
        periodos_liquidacion,
        conceptos_salariales,
        solicitudes_vacaciones,
        marcaciones,
        documentos_empleado,
        usuarios,
        empleados,
        horarios,
        tipos_contrato,
        cargos,
        departamentos,
        sectores,
        empresas
      CASCADE;
    `);

    console.log('Limpieza previa completada.');

    // Contraseñas encriptadas
    const passHashAdmin = await bcrypt.hash('Admin123!', 10);
    const passHashRRHH = await bcrypt.hash('RRHH123!', 10);
    const passHashColab = await bcrypt.hash('Colab123!', 10);

    // ==========================================
    // EMPRESA 1: TEKI Soluciones Tecnológicas
    // ==========================================
    const resEmpresa1 = await cliente.query(`
      INSERT INTO empresas (nombre, ruc, email, telefono, direccion, ciudad, pais, moneda, simbolo_moneda, configuracion)
      VALUES (
        'TEKI Soluciones Tecnológicas S.A.',
        '80092341-2',
        'contacto@teki.com.py',
        '+595 21 610 200',
        'Avda. Santa Teresa 2106 c/ Aviadores del Chaco',
        'Asunción',
        'Paraguay',
        'PYG',
        '₲',
        '{"recargoHoraExtraPorcentaje": 0.50, "porcentajeIpsObrero": 9.0, "porcentajeIpsPatronal": 16.5, "diasMesEstandar": 30, "horasMesEstandar": 240}'::jsonb
      ) RETURNING id;
    `);
    const tekiId = resEmpresa1.rows[0].id;

    // EMPRESA 2: Innovar Retail & Logística S.A. (Para demostración de aislamiento Multi-tenant)
    const resEmpresa2 = await cliente.query(`
      INSERT INTO empresas (nombre, ruc, email, telefono, direccion, ciudad, pais, moneda, simbolo_moneda, configuracion)
      VALUES (
        'Innovar Retail & Logística S.A.',
        '80115432-8',
        'contacto@innovar.com.py',
        '+595 21 550 800',
        'Ruta Mcal. Estigarribia Km 9.5',
        'San Lorenzo',
        'Paraguay',
        'PYG',
        '₲',
        '{"recargoHoraExtraPorcentaje": 0.50, "porcentajeIpsObrero": 9.0, "porcentajeIpsPatronal": 16.5, "diasMesEstandar": 30, "horasMesEstandar": 240}'::jsonb
      ) RETURNING id;
    `);
    const innovarId = resEmpresa2.rows[0].id;

    console.log(`Empresas creadas: TEKI (${tekiId}), Innovar (${innovarId})`);

    // ==========================================
    // CATÁLOGOS TEKI
    // ==========================================
    // Sectores
    const secTecnologia = (await cliente.query(`
      INSERT INTO sectores (empresa_id, nombre, codigo, descripcion)
      VALUES ($1, 'Tecnología e Innovación', 'SEC-TEC', 'Ingeniería de software, arquitectura cloud y ciberseguridad') RETURNING id;
    `, [tekiId])).rows[0].id;

    const secProducto = (await cliente.query(`
      INSERT INTO sectores (empresa_id, nombre, codigo, descripcion)
      VALUES ($1, 'Producto y Diseño', 'SEC-PRD', 'Diseño UX/UI, gestión de producto y experiencia del cliente') RETURNING id;
    `, [tekiId])).rows[0].id;

    const secOperaciones = (await cliente.query(`
      INSERT INTO sectores (empresa_id, nombre, codigo, descripcion)
      VALUES ($1, 'Operaciones y Soporte', 'SEC-OPS', 'Infraestructura, DevOps y soporte técnico a usuarios') RETURNING id;
    `, [tekiId])).rows[0].id;

    const secGestion = (await cliente.query(`
      INSERT INTO sectores (empresa_id, nombre, codigo, descripcion)
      VALUES ($1, 'Talento y Gestión Humana', 'SEC-RRHH', 'Atracción de talento, bienestar laboral, compensaciones') RETURNING id;
    `, [tekiId])).rows[0].id;

    // Departamentos TEKI
    const depDesarrollo = (await cliente.query(`
      INSERT INTO departamentos (empresa_id, sector_id, nombre, codigo, descripcion)
      VALUES ($1, $2, 'Desarrollo de Software', 'DEP-DEV', 'Desarrollo Frontend, Backend y Móvil') RETURNING id;
    `, [tekiId, secTecnologia])).rows[0].id;

    const depInfra = (await cliente.query(`
      INSERT INTO departamentos (empresa_id, sector_id, nombre, codigo, descripcion)
      VALUES ($1, $2, 'Infraestructura y DevOps', 'DEP-OPS', 'Sistemas cloud, CI/CD y confiabilidad') RETURNING id;
    `, [tekiId, secOperaciones])).rows[0].id;

    const depUX = (await cliente.query(`
      INSERT INTO departamentos (empresa_id, sector_id, nombre, codigo, descripcion)
      VALUES ($1, $2, 'Diseño de Producto UX/UI', 'DEP-UX', 'Investigación de usuarios y diseño de interfaz') RETURNING id;
    `, [tekiId, secProducto])).rows[0].id;

    const depRRHH = (await cliente.query(`
      INSERT INTO departamentos (empresa_id, sector_id, nombre, codigo, descripcion)
      VALUES ($1, $2, 'Recursos Humanos', 'DEP-RRHH', 'Administración de personal y desarrollo') RETURNING id;
    `, [tekiId, secGestion])).rows[0].id;

    // Cargos TEKI
    const cargoTechLead = (await cliente.query(`
      INSERT INTO cargos (empresa_id, departamento_id, nombre, nivel, salario_referencia, descripcion)
      VALUES ($1, $2, 'Tech Lead / Arquitecto', 'Liderazgo', 16500000, 'Liderazgo técnico de proyectos y arquitectura de software') RETURNING id;
    `, [tekiId, depDesarrollo])).rows[0].id;

    const cargoSeniorDev = (await cliente.query(`
      INSERT INTO cargos (empresa_id, departamento_id, nombre, nivel, salario_referencia, descripcion)
      VALUES ($1, $2, 'Desarrollador Fullstack Senior', 'Senior', 13500000, 'Desarrollo de microservicios y frontend con React') RETURNING id;
    `, [tekiId, depDesarrollo])).rows[0].id;

    const cargoFrontendDev = (await cliente.query(`
      INSERT INTO cargos (empresa_id, departamento_id, nombre, nivel, salario_referencia, descripcion)
      VALUES ($1, $2, 'Desarrollador Frontend React', 'Semi-Senior', 8500000, 'Construcción de interfaces web modernas y componentes reutilizables') RETURNING id;
    `, [tekiId, depDesarrollo])).rows[0].id;

    const cargoDevOps = (await cliente.query(`
      INSERT INTO cargos (empresa_id, departamento_id, nombre, nivel, salario_referencia, descripcion)
      VALUES ($1, $2, 'Ingeniero DevOps & Cloud', 'Senior', 12000000, 'Gestión de clusters Kubernetes, pipelines y AWS') RETURNING id;
    `, [tekiId, depInfra])).rows[0].id;

    const cargoUX = (await cliente.query(`
      INSERT INTO cargos (empresa_id, departamento_id, nombre, nivel, salario_referencia, descripcion)
      VALUES ($1, $2, 'Diseñador UX/UI Product Lead', 'Senior', 9500000, 'Diseño de experiencias digitales y sistemas de diseño') RETURNING id;
    `, [tekiId, depUX])).rows[0].id;

    const cargoGerenteRRHH = (await cliente.query(`
      INSERT INTO cargos (empresa_id, departamento_id, nombre, nivel, salario_referencia, descripcion)
      VALUES ($1, $2, 'Gerente de Gestión del Talento', 'Gerencial', 14000000, 'Liderazgo de estrategia humana y relaciones laborales') RETURNING id;
    `, [tekiId, depRRHH])).rows[0].id;

    const cargoAnalistaRRHH = (await cliente.query(`
      INSERT INTO cargos (empresa_id, departamento_id, nombre, nivel, salario_referencia, descripcion)
      VALUES ($1, $2, 'Analista de Compensaciones y RRHH', 'Semi-Senior', 7500000, 'Liquidación salarial, control de asistencia y legajos') RETURNING id;
    `, [tekiId, depRRHH])).rows[0].id;

    // Tipos de Contrato
    const conIndefinido = (await cliente.query(`
      INSERT INTO tipos_contrato (empresa_id, nombre, descripcion)
      VALUES ($1, 'Tiempo Indefinido', 'Contrato laboral estándar permanente') RETURNING id;
    `, [tekiId])).rows[0].id;

    const conPrueba = (await cliente.query(`
      INSERT INTO tipos_contrato (empresa_id, nombre, descripcion)
      VALUES ($1, 'Periodo de Prueba', 'Periodo inicial de evaluación laboral de 90 días') RETURNING id;
    `, [tekiId])).rows[0].id;

    const conPasantia = (await cliente.query(`
      INSERT INTO tipos_contrato (empresa_id, nombre, descripcion)
      VALUES ($1, 'Pasantía Universitaria', 'Convenio universitario de formación práctica') RETURNING id;
    `, [tekiId])).rows[0].id;

    // Horarios
    const horAdmin = (await cliente.query(`
      INSERT INTO horarios (empresa_id, nombre, hora_entrada, hora_salida, tolerancia_minutos, dias_semana)
      VALUES ($1, 'Horario Central Flexible', '08:30:00', '17:30:00', 15, 'Lunes a Viernes') RETURNING id;
    `, [tekiId])).rows[0].id;

    const horDevs = (await cliente.query(`
      INSERT INTO horarios (empresa_id, nombre, hora_entrada, hora_salida, tolerancia_minutos, dias_semana)
      VALUES ($1, 'Horario Desarrollo Tech', '09:00:00', '18:00:00', 20, 'Lunes a Viernes') RETURNING id;
    `, [tekiId])).rows[0].id;

    // Conceptos Salariales TEKI
    await cliente.query(`
      INSERT INTO conceptos_salariales (empresa_id, codigo, nombre, tipo, porcentaje, es_fijo)
      VALUES 
        ($1, 'HAB-001', 'Salario Base Mensual', 'HABER', NULL, true),
        ($1, 'HAB-002', 'Horas Extraordinarias 50%', 'HABER', 50.00, false),
        ($1, 'HAB-003', 'Bono por Objetivos y Desempeño', 'HABER', NULL, false),
        ($1, 'HAB-004', 'Asignación Familiar por Hijos', 'HABER', 5.00, false),
        ($1, 'HAB-005', 'Plus por Guardia Técnica', 'HABER', NULL, false),
        ($1, 'DED-001', 'Aporte Obrero IPS (9%)', 'DEDUCCION', 9.00, true),
        ($1, 'DED-002', 'Descuento por Ausencias', 'DEDUCCION', NULL, false),
        ($1, 'DED-003', 'Descuento por Llegadas Tardías', 'DEDUCCION', NULL, false),
        ($1, 'DED-004', 'Anticipo Quincenal de Salario', 'DEDUCCION', NULL, false),
        ($1, 'DED-005', 'Préstamo Corporativo TEKI', 'DEDUCCION', NULL, false);
    `, [tekiId]);

    // ==========================================
    // EMPLEADOS TEKI (10 colaboradores con datos reales y variados)
    // ==========================================
    const empData = [
      {
        codigo: 'TEKI-001',
        nombres: 'Alejandro Gabriel',
        apellidos: 'Valdez Morales',
        documento: '3.456.789',
        fecha_nacimiento: '1989-10-04', // Cumpleaños próximo en Octubre
        sexo: 'Masculino',
        estado_civil: 'Casado/a',
        nacionalidad: 'Paraguaya',
        direccion: 'Dr. Morra 450 esq. Andrade',
        ciudad: 'Asunción',
        telefono: '021 602341',
        celular: '0981 123456',
        correo: 'alejandro.valdez@gmail.com',
        fecha_ingreso: '2020-09-15', // Aniversario laboral en Septiembre (6 años)
        sector_id: secTecnologia,
        departamento_id: depDesarrollo,
        cargo_id: cargoTechLead,
        tipo_contrato_id: conIndefinido,
        salario_base: 16500000,
        horario_id: horDevs,
        estado: 'Activo',
        interno: '101',
        correo_corporativo: 'alejandro.valdez@teki.com.py',
        contacto_emergencia_nombre: 'Mariana Duarte (Cónyuge)',
        contacto_emergencia_telefono: '0981 987654',
        contacto_emergencia_parentesco: 'Cónyuge',
        observaciones: 'Líder técnico clave de la plataforma principal. Evaluado con desempeño sobresaliente.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      },
      {
        codigo: 'TEKI-002',
        nombres: 'María Claudia',
        apellidos: 'Fernández Duarte',
        documento: '4.120.355',
        fecha_nacimiento: '1992-09-29', // Cumpleaños muy próximo (29 de Septiembre)
        sexo: 'Femenino',
        estado_civil: 'Soltero/a',
        nacionalidad: 'Paraguaya',
        direccion: 'Boggiani 5520 e/ R.I. 6 Boquerón',
        ciudad: 'Asunción',
        telefono: '021 510444',
        celular: '0982 456789',
        correo: 'claudia.fernandez@gmail.com',
        fecha_ingreso: '2021-03-01',
        sector_id: secGestion,
        departamento_id: depRRHH,
        cargo_id: cargoGerenteRRHH,
        tipo_contrato_id: conIndefinido,
        salario_base: 14000000,
        horario_id: horAdmin,
        estado: 'Activo',
        interno: '200',
        correo_corporativo: 'claudia.fernandez@teki.com.py',
        contacto_emergencia_nombre: 'Esteban Fernández (Padre)',
        contacto_emergencia_telefono: '0981 333444',
        contacto_emergencia_parentesco: 'Padre',
        observaciones: 'Responsable de la gestión del talento y cultura corporativa.',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      },
      {
        codigo: 'TEKI-003',
        nombres: 'Carlos Alberto',
        apellidos: 'Mendoza Rivas',
        documento: '4.678.910',
        fecha_nacimiento: '1994-11-18',
        sexo: 'Masculino',
        estado_civil: 'Soltero/a',
        nacionalidad: 'Paraguaya',
        direccion: 'Avda. Molas López 1280',
        ciudad: 'Asunción',
        telefono: '021 662890',
        celular: '0983 234567',
        correo: 'carlos.mendoza@gmail.com',
        fecha_ingreso: '2022-09-10', // Aniversario laboral Septiembre (4 años)
        sector_id: secTecnologia,
        departamento_id: depDesarrollo,
        cargo_id: cargoSeniorDev,
        tipo_contrato_id: conIndefinido,
        salario_base: 13500000,
        horario_id: horDevs,
        estado: 'Activo',
        interno: '102',
        correo_corporativo: 'carlos.mendoza@teki.com.py',
        contacto_emergencia_nombre: 'Rosa Rivas (Madre)',
        contacto_emergencia_telefono: '0982 777888',
        contacto_emergencia_parentesco: 'Madre',
        observaciones: 'Desarrollador backend experto en Node.js, TypeScript y PostgreSQL.',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      },
      {
        codigo: 'TEKI-004',
        nombres: 'Sofía Belén',
        apellidos: 'Benítez Galeano',
        documento: '4.981.234',
        fecha_nacimiento: '1996-05-12',
        sexo: 'Femenino',
        estado_civil: 'Soltero/a',
        nacionalidad: 'Paraguaya',
        direccion: 'Avda. España 890',
        ciudad: 'Asunción',
        telefono: '021 201122',
        celular: '0984 567890',
        correo: 'sofia.benitez@gmail.com',
        fecha_ingreso: '2023-01-15',
        sector_id: secProducto,
        departamento_id: depUX,
        cargo_id: cargoUX,
        tipo_contrato_id: conIndefinido,
        salario_base: 9500000,
        horario_id: horAdmin,
        estado: 'Activo',
        interno: '301',
        correo_corporativo: 'sofia.benitez@teki.com.py',
        contacto_emergencia_nombre: 'Camila Benítez (Hermana)',
        contacto_emergencia_telefono: '0981 112233',
        contacto_emergencia_parentesco: 'Hermana',
        observaciones: 'Diseñadora principal de la UI de TEKI RRHH y librerías de diseño.',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
      },
      {
        codigo: 'TEKI-005',
        nombres: 'Diego Martín',
        apellidos: 'Ayala Rojas',
        documento: '5.102.394',
        fecha_nacimiento: '1997-09-30', // Cumpleaños en 3 días (30 de Septiembre)
        sexo: 'Masculino',
        estado_civil: 'Soltero/a',
        nacionalidad: 'Paraguaya',
        direccion: 'Palma 640 c/ 14 de Mayo',
        ciudad: 'Asunción',
        telefono: '021 445566',
        celular: '0985 678901',
        correo: 'diego.ayala@gmail.com',
        fecha_ingreso: '2023-06-01',
        sector_id: secTecnologia,
        departamento_id: depDesarrollo,
        cargo_id: cargoFrontendDev,
        tipo_contrato_id: conIndefinido,
        salario_base: 8500000,
        horario_id: horDevs,
        estado: 'Activo',
        interno: '103',
        correo_corporativo: 'diego.ayala@teki.com.py',
        contacto_emergencia_nombre: 'Marta Rojas (Madre)',
        contacto_emergencia_telefono: '0983 445566',
        contacto_emergencia_parentesco: 'Madre',
        observaciones: 'Frontend developer enfocado en React, Vite y Tailwind.',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      },
      {
        codigo: 'TEKI-006',
        nombres: 'Fernando José',
        apellidos: 'Ortiz Franco',
        documento: '3.890.112',
        fecha_nacimiento: '1991-07-22',
        sexo: 'Masculino',
        estado_civil: 'Casado/a',
        nacionalidad: 'Paraguaya',
        direccion: 'Avda. Mariscal López 3400',
        ciudad: 'Fernando de la Mora',
        telefono: '021 680011',
        celular: '0981 889900',
        correo: 'fernando.ortiz@gmail.com',
        fecha_ingreso: '2022-02-15',
        sector_id: secOperaciones,
        departamento_id: depInfra,
        cargo_id: cargoDevOps,
        tipo_contrato_id: conIndefinido,
        salario_base: 12000000,
        horario_id: horDevs,
        estado: 'Activo',
        interno: '105',
        correo_corporativo: 'fernando.ortiz@teki.com.py',
        contacto_emergencia_nombre: 'Andrea Vera (Esposa)',
        contacto_emergencia_telefono: '0982 990011',
        contacto_emergencia_parentesco: 'Cónyuge',
        observaciones: 'Encargado de la infraestructura cloud de TEKI y monitoreo 24/7.',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
      },
      {
        codigo: 'TEKI-007',
        nombres: 'Valeria Inés',
        apellidos: 'Gómez Bogado',
        documento: '5.340.890',
        fecha_nacimiento: '1999-10-15', // Cumpleaños próximo en Octubre
        sexo: 'Femenino',
        estado_civil: 'Soltero/a',
        nacionalidad: 'Paraguaya',
        direccion: 'Santísima Trinidad 120',
        ciudad: 'Asunción',
        telefono: '021 290111',
        celular: '0984 123789',
        correo: 'valeria.gomez@gmail.com',
        fecha_ingreso: '2024-02-01',
        sector_id: secGestion,
        departamento_id: depRRHH,
        cargo_id: cargoAnalistaRRHH,
        tipo_contrato_id: conIndefinido,
        salario_base: 7500000,
        horario_id: horAdmin,
        estado: 'Activo',
        interno: '202',
        correo_corporativo: 'valeria.gomez@teki.com.py',
        contacto_emergencia_nombre: 'Jorge Gómez (Hermano)',
        contacto_emergencia_telefono: '0981 776655',
        contacto_emergencia_parentesco: 'Hermano',
        observaciones: 'Encargada de liquidaciones, legajos y altas en el sistema.',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
      },
      {
        codigo: 'TEKI-008',
        nombres: 'Mateo Nicolás',
        apellidos: 'Caballero Paredes',
        documento: '5.890.123',
        fecha_nacimiento: '2001-08-05',
        sexo: 'Masculino',
        estado_civil: 'Soltero/a',
        nacionalidad: 'Paraguaya',
        direccion: 'Fulgencio Yegros 780',
        ciudad: 'San Lorenzo',
        telefono: '021 582100',
        celular: '0986 456123',
        correo: 'mateo.caballero@gmail.com',
        fecha_ingreso: '2026-08-01', // Nuevo ingreso reciente (menos de 2 meses)
        sector_id: secTecnologia,
        departamento_id: depDesarrollo,
        cargo_id: cargoFrontendDev,
        tipo_contrato_id: conPrueba,
        salario_base: 6000000,
        horario_id: horDevs,
        estado: 'Activo',
        interno: '107',
        correo_corporativo: 'mateo.caballero@teki.com.py',
        contacto_emergencia_nombre: 'Silvia Paredes (Madre)',
        contacto_emergencia_telefono: '0985 112244',
        contacto_emergencia_parentesco: 'Madre',
        observaciones: 'Nuevo ingreso en periodo de prueba con gran potencial técnico.',
        avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
      },
      {
        codigo: 'TEKI-009',
        nombres: 'Lucía Natalia',
        apellidos: 'Villalba Acosta',
        documento: '4.502.990',
        fecha_nacimiento: '1995-02-14',
        sexo: 'Femenino',
        estado_civil: 'Soltero/a',
        nacionalidad: 'Paraguaya',
        direccion: 'Capitán Lombardo 320',
        ciudad: 'Asunción',
        telefono: '021 289456',
        celular: '0981 789123',
        correo: 'lucia.villalba@gmail.com',
        fecha_ingreso: '2023-08-15',
        sector_id: secProducto,
        departamento_id: depUX,
        cargo_id: cargoUX,
        tipo_contrato_id: conIndefinido,
        salario_base: 8800000,
        horario_id: horAdmin,
        estado: 'Vacaciones', // De vacaciones actualmente
        interno: '302',
        correo_corporativo: 'lucia.villalba@teki.com.py',
        contacto_emergencia_nombre: 'Marcos Villalba (Padre)',
        contacto_emergencia_telefono: '0982 334455',
        contacto_emergencia_parentesco: 'Padre',
        observaciones: 'De vacaciones autorizadas del 22 al 29 de septiembre de 2026.',
        avatar_url: 'https://images.unsplash.com/photo-1534751516642-a171edd272b5?auto=format&fit=crop&q=80&w=250',
      },
      {
        codigo: 'TEKI-010',
        nombres: 'Lucas Daniel',
        apellidos: 'Ríos Giménez',
        documento: '5.201.884',
        fecha_nacimiento: '1998-12-03',
        sexo: 'Masculino',
        estado_civil: 'Soltero/a',
        nacionalidad: 'Paraguaya',
        direccion: 'Defensores del Chaco 1450',
        ciudad: 'Lambaré',
        telefono: '021 905120',
        celular: '0983 998877',
        correo: 'lucas.rios@gmail.com',
        fecha_ingreso: '2024-05-10',
        sector_id: secOperaciones,
        departamento_id: depInfra,
        cargo_id: cargoDevOps,
        tipo_contrato_id: conIndefinido,
        salario_base: 8000000,
        horario_id: horDevs,
        estado: 'Activo',
        interno: '108',
        correo_corporativo: 'lucas.rios@teki.com.py',
        contacto_emergencia_nombre: 'Mirta Giménez (Madre)',
        contacto_emergencia_telefono: '0984 667788',
        contacto_emergencia_parentesco: 'Madre',
        observaciones: 'Especialista en observabilidad y monitoreo con Prometheus y Grafana.',
        avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
      }
    ];

    const mapaEmpleadosTeki: Record<string, string> = {};

    for (const e of empData) {
      const res = await cliente.query(`
        INSERT INTO empleados (
          empresa_id, codigo, nombres, apellidos, documento, fecha_nacimiento, sexo,
          estado_civil, nacionalidad, direccion, ciudad, telefono, celular, correo,
          fecha_ingreso, sector_id, departamento_id, cargo_id, tipo_contrato_id,
          salario_base, horario_id, estado, interno, correo_corporativo,
          contacto_emergencia_nombre, contacto_emergencia_telefono, contacto_emergencia_parentesco,
          observaciones, avatar_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
        ) RETURNING id;
      `, [
        tekiId, e.codigo, e.nombres, e.apellidos, e.documento, e.fecha_nacimiento, e.sexo,
        e.estado_civil, e.nacionalidad, e.direccion, e.ciudad, e.telefono, e.celular, e.correo,
        e.fecha_ingreso, e.sector_id, e.departamento_id, e.cargo_id, e.tipo_contrato_id,
        e.salario_base, e.horario_id, e.estado, e.interno, e.correo_corporativo,
        e.contacto_emergencia_nombre, e.contacto_emergencia_telefono, e.contacto_emergencia_parentesco,
        e.observaciones, e.avatar_url
      ]);
      mapaEmpleadosTeki[e.codigo] = res.rows[0].id;
    }

    // Configurar jerarquía de jefes
    await cliente.query(`UPDATE empleados SET jefe_id = $1 WHERE id IN ($2, $3, $4)`, [
      mapaEmpleadosTeki['TEKI-001'], // Alejandro Valdez es jefe de los devs
      mapaEmpleadosTeki['TEKI-003'],
      mapaEmpleadosTeki['TEKI-005'],
      mapaEmpleadosTeki['TEKI-008']
    ]);

    await cliente.query(`UPDATE empleados SET jefe_id = $1 WHERE id = $2`, [
      mapaEmpleadosTeki['TEKI-002'], // Claudia Fernández jefa de Valeria Gómez en RRHH
      mapaEmpleadosTeki['TEKI-007']
    ]);

    // ==========================================
    // USUARIOS DE TEKI
    // ==========================================
    await cliente.query(`
      INSERT INTO usuarios (empresa_id, empleado_id, email, password_hash, nombre, apellido, rol, avatar_url, activo)
      VALUES 
        ($1, $2, 'admin@teki.com.py', $3, 'Alejandro', 'Valdez', 'Administrador', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250', true),
        ($1, $4, 'rrhh@teki.com.py', $5, 'Claudia', 'Fernández', 'RRHH', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250', true),
        ($1, $6, 'carlos.mendoza@teki.com.py', $7, 'Carlos', 'Mendoza', 'Colaborador', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250', true),
        ($1, $8, 'sofia.benitez@teki.com.py', $7, 'Sofía', 'Benítez', 'Colaborador', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250', true);
    `, [
      tekiId,
      mapaEmpleadosTeki['TEKI-001'],
      passHashAdmin,
      mapaEmpleadosTeki['TEKI-002'],
      passHashRRHH,
      mapaEmpleadosTeki['TEKI-003'],
      passHashColab,
      mapaEmpleadosTeki['TEKI-004']
    ]);

    // ==========================================
    // DOCUMENTOS DE PRUEBA DE EMPLEADOS
    // ==========================================
    await cliente.query(`
      INSERT INTO documentos_empleado (empresa_id, empleado_id, tipo_documento, nombre_archivo, url_archivo, tamano_bytes, notas)
      VALUES 
        ($1, $2, 'Cédula de Identidad', 'cedula_alejandro_valdez.pdf', '/documentos/demo/cedula.pdf', 1048576, 'Copia autenticada de cédula'),
        ($1, $2, 'Contrato Laboral', 'contrato_indefinido_valdez.pdf', '/documentos/demo/contrato.pdf', 2097152, 'Contrato firmado por las partes'),
        ($1, $3, 'Certificado de Título', 'titulo_licenciatura_claudia.pdf', '/documentos/demo/titulo.pdf', 3145728, 'Título de Lic. en Psicología Laboral');
    `, [
      tekiId,
      mapaEmpleadosTeki['TEKI-001'],
      mapaEmpleadosTeki['TEKI-002']
    ]);

    // ==========================================
    // MARCACIONES / ASISTENCIA (Septiembre 2026)
    // ==========================================
    // Días recientes de septiembre (2026-09-21 al 2026-09-27)
    const fechasMarcaciones = [
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27'
    ];

    for (const fecha of fechasMarcaciones) {
      for (const [cod, empId] of Object.entries(mapaEmpleadosTeki)) {
        if (cod === 'TEKI-009') {
          // Lucía Villalba está de vacaciones
          await cliente.query(`
            INSERT INTO marcaciones (empresa_id, empleado_id, fecha, estado, observaciones)
            VALUES ($1, $2, $3, 'Vacaciones', 'Licencia anual reglamentaria')
            ON CONFLICT DO NOTHING;
          `, [tekiId, empId, fecha]);
          continue;
        }

        // Variedad de marcaciones
        let estado = 'Presente';
        let entrada = '08:25:00';
        let salida = '17:35:00';
        let horasTrabajadas = 8.5;
        let horasExtra = 0.5;
        let minutosRetraso = 0;

        if (cod === 'TEKI-005' && fecha === '2026-09-24') {
          // Diego Ayala llegó tarde
          estado = 'Llegada tardía';
          entrada = '09:42:00';
          minutosRetraso = 42;
          horasTrabajadas = 7.8;
          horasExtra = 0;
        } else if (cod === 'TEKI-008' && fecha === '2026-09-25') {
          // Mateo Caballero con horas extra
          entrada = '08:50:00';
          salida = '20:30:00';
          horasTrabajadas = 11.5;
          horasExtra = 2.5;
        } else if (cod === 'TEKI-006' && fecha === '2026-09-27') {
          // Fernando Ortiz ausente con aviso
          estado = 'Permiso';
          entrada = null as any;
          salida = null as any;
          horasTrabajadas = 0;
          horasExtra = 0;
        }

        await cliente.query(`
          INSERT INTO marcaciones (
            empresa_id, empleado_id, fecha, hora_entrada, hora_salida,
            horas_trabajadas, horas_extra, minutos_retraso, estado, tipo_origen
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Manual')
          ON CONFLICT DO NOTHING;
        `, [tekiId, empId, fecha, entrada, salida, horasTrabajadas, horasExtra, minutosRetraso, estado]);
      }
    }

    // ==========================================
    // VACACIONES (Solicitudes y estados variados)
    // ==========================================
    // Lucía Villalba: Aprobada (vigente ahora)
    await cliente.query(`
      INSERT INTO solicitudes_vacaciones (
        empresa_id, empleado_id, fecha_solicitud, fecha_inicio, fecha_fin,
        fecha_reincorporacion, dias_solicitados, estado, motivo, respuesta_motivo,
        fecha_respuesta
      ) VALUES (
        $1, $2, '2026-09-01', '2026-09-22', '2026-09-29',
        '2026-09-30', 6, 'Aprobada', 'Vacaciones anuales reglamentarias', 'Aprobadas conforme a planificación del equipo UX',
        '2026-09-02 10:30:00'
      );
    `, [tekiId, mapaEmpleadosTeki['TEKI-009']]);

    // Carlos Mendoza: Pendiente (para que aparezca en solicitudes pendientes del dashboard)
    await cliente.query(`
      INSERT INTO solicitudes_vacaciones (
        empresa_id, empleado_id, fecha_solicitud, fecha_inicio, fecha_fin,
        fecha_reincorporacion, dias_solicitados, estado, motivo
      ) VALUES (
        $1, $2, '2026-09-25', '2026-10-12', '2026-10-23',
        '2026-10-26', 10, 'Pendiente', 'Descanso familiar programado de primavera'
      );
    `, [tekiId, mapaEmpleadosTeki['TEKI-003']]);

    // Diego Ayala: Pendiente (otra solicitud pendiente)
    await cliente.query(`
      INSERT INTO solicitudes_vacaciones (
        empresa_id, empleado_id, fecha_solicitud, fecha_inicio, fecha_fin,
        fecha_reincorporacion, dias_solicitados, estado, motivo
      ) VALUES (
        $1, $2, '2026-09-26', '2026-11-02', '2026-11-06',
        '2026-11-09', 5, 'Pendiente', 'Trámites personales y descanso'
      );
    `, [tekiId, mapaEmpleadosTeki['TEKI-005']]);

    // Alejandro Valdez: Historial aprobada en marzo
    await cliente.query(`
      INSERT INTO solicitudes_vacaciones (
        empresa_id, empleado_id, fecha_solicitud, fecha_inicio, fecha_fin,
        fecha_reincorporacion, dias_solicitados, estado, motivo, respuesta_motivo,
        fecha_respuesta
      ) VALUES (
        $1, $2, '2026-02-10', '2026-03-02', '2026-03-13',
        '2026-03-16', 10, 'Aprobada', 'Vacaciones de verano 2026', 'Aprobado sin objeciones',
        '2026-02-12 14:00:00'
      );
    `, [tekiId, mapaEmpleadosTeki['TEKI-001']]);

    // ==========================================
    // LIQUIDACIONES Y RECIBOS
    // ==========================================
    // Periodo 1: Agosto 2026 (Confirmado con recibos emitidos)
    const resPerAgosto = await cliente.query(`
      INSERT INTO periodos_liquidacion (
        empresa_id, anio, mes, nombre, fecha_inicio, fecha_fin, estado
      ) VALUES (
        $1, 2026, 8, 'Agosto 2026', '2026-08-01', '2026-08-31', 'Confirmado'
      ) RETURNING id;
    `, [tekiId]);
    const perAgostoId = resPerAgosto.rows[0].id;

    // Periodo 2: Septiembre 2026 (En borrador / activo para liquidar en vivo)
    await cliente.query(`
      INSERT INTO periodos_liquidacion (
        empresa_id, anio, mes, nombre, fecha_inicio, fecha_fin, estado
      ) VALUES (
        $1, 2026, 9, 'Septiembre 2026', '2026-09-01', '2026-09-30', 'Borrador'
      );
    `, [tekiId]);

    // Generar liquidaciones y recibos de Agosto 2026 para los empleados clave de TEKI
    let totalBrutoAgosto = 0;
    let totalDescuentosAgosto = 0;
    let totalIpsAgosto = 0;
    let totalNetoAgosto = 0;
    let reciboIndex = 1;

    for (const [cod, empId] of Object.entries(mapaEmpleadosTeki)) {
      if (cod === 'TEKI-008') continue; // Ingresó en agosto, omitir para simular nuevo ingreso
      const emp = empData.find(e => e.codigo === cod)!;
      const base = emp.salario_base;
      const horasExtraCant = cod === 'TEKI-003' ? 10 : (cod === 'TEKI-005' ? 5 : 0);
      
      // Valor hora base = salario / 240
      const valorHora = base / 240;
      // 50% de recargo = valorHora * 1.5 * cantidad
      const montoHorasExtra = Math.round(valorHora * 1.5 * horasExtraCant);
      const bonos = cod === 'TEKI-001' ? 1500000 : 0;
      const salarioBruto = base + montoHorasExtra + bonos;
      const ipsObrero = Math.round(salarioBruto * 0.09); // 9%
      const ipsPatronal = Math.round(salarioBruto * 0.165); // 16.5%
      const totalDescuentos = ipsObrero;
      const salarioNeto = salarioBruto - totalDescuentos;

      totalBrutoAgosto += salarioBruto;
      totalDescuentosAgosto += totalDescuentos;
      totalIpsAgosto += ipsObrero;
      totalNetoAgosto += salarioNeto;

      const resLiq = await cliente.query(`
        INSERT INTO liquidaciones (
          empresa_id, periodo_id, empleado_id, dias_trabajados, horas_extra_cantidad,
          salario_base, monto_horas_extra, monto_bonos, monto_ips_obrero, monto_ips_patronal,
          salario_bruto, total_descuentos, salario_neto, estado, observaciones
        ) VALUES (
          $1, $2, $3, 30, $4,
          $5, $6, $7, $8, $9,
          $10, $11, $12, 'Confirmado', 'Liquidación regular mensual sin incidencias'
        ) RETURNING id;
      `, [
        tekiId, perAgostoId, empId, horasExtraCant,
        base, montoHorasExtra, bonos, ipsObrero, ipsPatronal,
        salarioBruto, totalDescuentos, salarioNeto
      ]);
      const liqId = resLiq.rows[0].id;

      // Detalle de liquidación
      await cliente.query(`
        INSERT INTO detalle_liquidaciones (empresa_id, liquidacion_id, tipo, concepto, cantidad, monto)
        VALUES 
          ($1, $2, 'HABER', 'Salario Base Mensual', 30, $3),
          ($1, $2, 'DEDUCCION', 'Aporte Obrero IPS (9%)', 1, $4);
      `, [tekiId, liqId, base, ipsObrero]);

      if (montoHorasExtra > 0) {
        await cliente.query(`
          INSERT INTO detalle_liquidaciones (empresa_id, liquidacion_id, tipo, concepto, cantidad, monto)
          VALUES ($1, $2, 'HABER', 'Horas Extraordinarias (50%)', $3, $4);
        `, [tekiId, liqId, horasExtraCant, montoHorasExtra]);
      }
      if (bonos > 0) {
        await cliente.query(`
          INSERT INTO detalle_liquidaciones (empresa_id, liquidacion_id, tipo, concepto, cantidad, monto)
          VALUES ($1, $2, 'HABER', 'Bono por Desempeño y Cumplimiento de Metas', 1, $3);
        `, [tekiId, liqId, bonos]);
      }

      // Recibo de salario
      const numRecibo = `REC-2026-08-${String(reciboIndex).padStart(4, '0')}`;
      reciboIndex++;
      const letras = numeroALetras(salarioNeto);

      await cliente.query(`
        INSERT INTO recibos (
          empresa_id, liquidacion_id, empleado_id, numero_recibo,
          periodo_nombre, fecha_emision, salario_bruto, total_descuentos,
          salario_neto, salario_neto_letras, estado
        ) VALUES (
          $1, $2, $3, $4,
          'Agosto 2026', '2026-08-31', $5, $6,
          $7, $8, 'Emitido'
        );
      `, [
        tekiId, liqId, empId, numRecibo,
        salarioBruto, totalDescuentos, salarioNeto, letras
      ]);
    }

    // Actualizar totales del periodo Agosto
    await cliente.query(`
      UPDATE periodos_liquidacion
      SET total_bruto = $1, total_descuentos = $2, total_ips = $3, total_neto = $4
      WHERE id = $5;
    `, [totalBrutoAgosto, totalDescuentosAgosto, totalIpsAgosto, totalNetoAgosto, perAgostoId]);

    // ==========================================
    // AUDITORÍA INICIAL TEKI
    // ==========================================
    await cliente.query(`
      INSERT INTO auditoria (empresa_id, usuario_nombre, accion, entidad, entidad_id, detalles)
      VALUES 
        ($1::uuid, 'Sistema', 'CONFIGURACION_INICIAL', 'empresas', $1::text, '{"mensaje": "Empresa TEKI configurada en plataforma SaaS"}'),
        ($1::uuid, 'Claudia Fernández', 'CREACION', 'empleados', $2::text, '{"empleado": "Mateo Caballero", "cargo": "Desarrollador Frontend"}'),
        ($1::uuid, 'Claudia Fernández', 'APROBACION', 'solicitudes_vacaciones', 'vac-001', '{"empleado": "Lucía Villalba", "dias": 6}'),
        ($1::uuid, 'Claudia Fernández', 'CONFIRMACION_LIQUIDACION', 'periodos_liquidacion', $3::text, '{"periodo": "Agosto 2026", "recibos_generados": 9}');
    `, [tekiId, mapaEmpleadosTeki['TEKI-008'], perAgostoId]);

    // ==========================================
    // PREPARACIÓN DE FUTURAS FUNCIONALIDADES
    // Salas de reuniones y Noticias para TEKI
    // ==========================================
    const resSala1 = await cliente.query(`
      INSERT INTO salas (empresa_id, nombre, tipo, capacidad, ubicacion, equipamiento)
      VALUES ($1, 'Sala Innovación y Scrum', 'FISICA', 12, 'Piso 3 - Ala Norte', ARRAY['Proyector 4K', 'Pizarra Inteligente', 'Sistema de Videoconferencia Poly'])
      RETURNING id;
    `, [tekiId]);

    const resSala2 = await cliente.query(`
      INSERT INTO salas (empresa_id, nombre, tipo, capacidad, ubicacion, equipamiento, enlace_virtual)
      VALUES ($1, 'Sala Virtual Google Meet Directiva', 'VIRTUAL', 50, 'Online', ARRAY['Grabación en la nube', 'Subtítulos en tiempo real'], 'https://meet.google.com/tek-hrsaas-demo')
      RETURNING id;
    `, [tekiId]);

    await cliente.query(`
      INSERT INTO reuniones (empresa_id, titulo, descripcion, modalidad, sala_id, fecha_inicio, fecha_fin, enlace_reunion, plataforma)
      VALUES 
        ($1, 'Planificación Sprint Q4 - Plataforma RRHH', 'Reunión de alineación de producto y lanzamientos clave de fin de año', 'HIBRIDA', $2, '2026-09-28 09:30:00+00', '2026-09-28 11:00:00+00', 'https://meet.google.com/tek-hrsaas-demo', 'MEET'),
        ($1, 'Comité de Clima Laboral y Beneficios', 'Revisión trimestral de encuestas de satisfacción de colaboradores', 'PRESENCIAL', $2, '2026-09-30 15:00:00+00', '2026-09-30 16:30:00+00', NULL, 'MEET');
    `, [tekiId, resSala1.rows[0].id]);

    await cliente.query(`
      INSERT INTO noticias_intranet (empresa_id, titulo, contenido, categoria, fijado)
      VALUES 
        ($1, '¡Bienvenidos a la nueva plataforma de RRHH de TEKI!', 'Nos complace presentar la nueva experiencia digital de gestión del talento. Podrán consultar sus recibos de salario, solicitar vacaciones y revisar asistencias de forma ágil y moderna.', 'Institucional', true),
        ($1, 'Programa de Bienestar: Talleres de Ergonomía y Pausas Activas', 'A partir del próximo lunes contaremos con sesiones semanales de pausas activas guiadas para todos los equipos en modalidad presencial y remota.', 'Bienestar', false);
    `, [tekiId]);

    // ==========================================
    // EMPRESA 2: INNOVAR RETAIL & LOGÍSTICA
    // (Para comprobar aislamiento de datos SaaS)
    // ==========================================
    const secRetail = (await cliente.query(`
      INSERT INTO sectores (empresa_id, nombre, codigo, descripcion)
      VALUES ($1, 'Logística y Centro de Distribución', 'SEC-LOG', 'Operaciones de almacén y despacho') RETURNING id;
    `, [innovarId])).rows[0].id;

    const depAlmacen = (await cliente.query(`
      INSERT INTO departamentos (empresa_id, sector_id, nombre, codigo, descripcion)
      VALUES ($1, $2, 'Operaciones de Depósito', 'DEP-ALM', 'Recepción y preparación de pedidos') RETURNING id;
    `, [innovarId, secRetail])).rows[0].id;

    const cargoSupervisor = (await cliente.query(`
      INSERT INTO cargos (empresa_id, departamento_id, nombre, nivel, salario_referencia)
      VALUES ($1, $2, 'Supervisor de Logística', 'Liderazgo', 6500000) RETURNING id;
    `, [innovarId, depAlmacen])).rows[0].id;

    const horTurno = (await cliente.query(`
      INSERT INTO horarios (empresa_id, nombre, hora_entrada, hora_salida, tolerancia_minutos, dias_semana)
      VALUES ($1, 'Turno Mañana Retail', '06:00:00', '15:00:00', 10, 'Lunes a Sábado') RETURNING id;
    `, [innovarId])).rows[0].id;

    const empInnovar = (await cliente.query(`
      INSERT INTO empleados (
        empresa_id, codigo, nombres, apellidos, documento, fecha_nacimiento,
        fecha_ingreso, sector_id, departamento_id, cargo_id, salario_base,
        horario_id, estado, correo_corporativo
      ) VALUES (
        $1, 'INN-001', 'Rodrigo', 'Giménez Benítez', '3.890.444', '1987-04-18',
        '2021-05-10', $2, $3, $4, 6500000,
        $5, 'Activo', 'rodrigo.gimenez@innovar.com.py'
      ) RETURNING id;
    `, [innovarId, secRetail, depAlmacen, cargoSupervisor, horTurno])).rows[0].id;

    await cliente.query(`
      INSERT INTO usuarios (empresa_id, empleado_id, email, password_hash, nombre, apellido, rol, activo)
      VALUES 
        ($1, $2, 'admin@innovar.com.py', $3, 'Rodrigo', 'Giménez', 'Administrador', true);
    `, [innovarId, empInnovar, passHashAdmin]);

    await cliente.query('COMMIT');
    console.log('✅ Semillas cargadas exitosamente. Datos multi-tenant listos.');
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('❌ Error cargando semillas:', error);
    throw error;
  } finally {
    cliente.release();
  }
}

// Ejecución directa
if (require.main === module) {
  semillarDatos()
    .then(() => {
      console.log('Proceso de siembra finalizado.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fallo en siembra:', err);
      process.exit(1);
    });
}
