export type RolUsuario = 'Administrador' | 'RRHH' | 'Colaborador' | 'Comunicaciones';

export interface Empresa {
  id: string;
  nombre: string;
  ruc: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  moneda: string;
  simboloMoneda: string;
  logo_url?: string;
  configuracion?: any;
  reglasNegocio?: ReglasLiquidacion;
}

export interface ReglasLiquidacion {
  recargoHoraExtraPorcentaje: number;
  porcentajeIpsObrero: number;
  porcentajeIpsPatronal: number;
  diasMesEstandar: number;
  horasMesEstandar: number;
  toleranciaLlegadaTardiaMinutos: number;
  escalasVacaciones?: { aniosMinimos: number; aniosMaximos: number; diasVacaciones: number }[];
}

export interface Usuario {
  id: string;
  empresaId: string;
  empleadoId?: string | null;
  empleadoCodigo?: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  avatarUrl?: string;
  activo?: boolean;
  ultimoAcceso?: string;
  empresa?: Empresa;
}

export interface Sector {
  id: string;
  empresa_id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  activo: boolean;
  total_departamentos?: number;
  total_empleados?: number;
}

export interface Departamento {
  id: string;
  empresa_id: string;
  sector_id?: string;
  sector_nombre?: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  activo: boolean;
  total_cargos?: number;
  total_empleados?: number;
}

export interface Cargo {
  id: string;
  empresa_id: string;
  departamento_id?: string;
  departamento_nombre?: string;
  sector_nombre?: string;
  nombre: string;
  nivel: string;
  descripcion?: string;
  salario_referencia: number;
  activo: boolean;
  total_empleados?: number;
}

export interface TipoContrato {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  total_empleados?: number;
}

export interface Horario {
  id: string;
  empresa_id: string;
  nombre: string;
  hora_entrada: string;
  hora_salida: string;
  tolerancia_minutos: number;
  dias_semana: string;
  activo: boolean;
  total_empleados?: number;
}

export interface ConceptoSalarial {
  id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  tipo: 'HABER' | 'DEDUCCION';
  porcentaje?: number;
  es_fijo: boolean;
  activo: boolean;
}

export interface DocumentoEmpleado {
  id: string;
  tipo_documento: string;
  nombre_archivo: string;
  url_archivo: string;
  tamano_bytes: number;
  fecha_subida: string;
  notas?: string;
}

export interface Empleado {
  id: string;
  empresa_id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  documento: string;
  fecha_nacimiento?: string;
  sexo?: string;
  estado_civil?: string;
  nacionalidad?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  celular?: string;
  correo?: string;
  fecha_ingreso: string;
  fecha_salida?: string;
  sector_id?: string;
  sector_nombre?: string;
  departamento_id?: string;
  departamento_nombre?: string;
  cargo_id?: string;
  cargo_nombre?: string;
  tipo_contrato_id?: string;
  tipo_contrato_nombre?: string;
  salario_base: number;
  horario_id?: string;
  horario_nombre?: string;
  hora_entrada?: string;
  hora_salida?: string;
  jefe_id?: string;
  jefe_nombre?: string;
  estado: 'Activo' | 'Inactivo' | 'Vacaciones' | 'Baja';
  interno?: string;
  correo_corporativo?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  contacto_emergencia_parentesco?: string;
  observaciones?: string;
  avatar_url?: string;
  documentos?: DocumentoEmpleado[];
  marcacionesRecientes?: Marcacion[];
  solicitudesVacaciones?: SolicitudVacacion[];
}

export interface Marcacion {
  id: string;
  empresa_id: string;
  empleado_id: string;
  fecha: string;
  hora_entrada?: string;
  hora_salida?: string;
  horas_trabajadas: number;
  horas_extra: number;
  minutos_retraso: number;
  estado: 'Presente' | 'Llegada tardía' | 'Ausente' | 'Vacaciones' | 'Permiso';
  tipo_origen: string;
  observaciones?: string;
  nombres?: string;
  apellidos?: string;
  empleado_codigo?: string;
  avatar_url?: string;
  sector_nombre?: string;
  cargo_nombre?: string;
  horario_nombre?: string;
  horario_entrada?: string;
  horario_salida?: string;
}

export interface SolicitudVacacion {
  id: string;
  empresa_id: string;
  empleado_id: string;
  fecha_solicitud: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_reincorporacion: string;
  dias_solicitados: number;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Cancelada';
  motivo?: string;
  respuesta_motivo?: string;
  aprobado_por?: string;
  aprobado_por_nombre?: string;
  fecha_respuesta?: string;
  nombres?: string;
  apellidos?: string;
  empleado_codigo?: string;
  avatar_url?: string;
  sector_nombre?: string;
  cargo_nombre?: string;
}

export interface SaldoVacaciones {
  empleadoId: string;
  nombreCompleto: string;
  fechaIngreso: string;
  antiguedadAnios: number;
  diasCorrespondientes: number;
  diasUtilizados: number;
  diasPendientes: number;
  diasDisponibles: number;
}

export interface PeriodoLiquidacion {
  id: string;
  empresa_id: string;
  anio: number;
  mes: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'Borrador' | 'Calculado' | 'Confirmado';
  total_bruto: number;
  total_adicionales: number;
  total_descuentos: number;
  total_ips: number;
  total_neto: number;
  creado_por_nombre?: string;
  total_liquidaciones?: number;
  liquidaciones?: Liquidacion[];
}

export interface DetalleLiquidacion {
  id: string;
  tipo: 'HABER' | 'DEDUCCION';
  concepto: string;
  cantidad?: number;
  porcentaje?: number;
  monto: number;
}

export interface Liquidacion {
  id: string;
  empresa_id: string;
  periodo_id: string;
  empleado_id: string;
  empleado_codigo?: string;
  nombres?: string;
  apellidos?: string;
  documento?: string;
  sector_nombre?: string;
  cargo_nombre?: string;
  dias_trabajados: number;
  horas_extra_cantidad: number;
  salario_base: number;
  monto_horas_extra: number;
  monto_bonos: number;
  monto_otros_haberes: number;
  monto_ausencias: number;
  monto_otros_descuentos: number;
  monto_ips_obrero: number;
  monto_ips_patronal: number;
  salario_bruto: number;
  total_descuentos: number;
  salario_neto: number;
  estado: string;
  observaciones?: string;
}

export interface Recibo {
  id: string;
  empresa_id: string;
  liquidacion_id: string;
  empleado_id: string;
  numero_recibo: string;
  periodo_nombre: string;
  fecha_emision: string;
  salario_bruto: number;
  total_descuentos: number;
  salario_neto: number;
  salario_neto_letras?: string;
  estado: string;
  nombres?: string;
  apellidos?: string;
  documento?: string;
  empleado_codigo?: string;
  avatar_url?: string;
  sector_nombre?: string;
  cargo_nombre?: string;
  departamento_nombre?: string;
  // Campos del detalle cuando se consulta por ID
  empresa_nombre?: string;
  empresa_ruc?: string;
  empresa_direccion?: string;
  empresa_ciudad?: string;
  empresa_telefono?: string;
  simbolo_moneda?: string;
  empleado_nombres?: string;
  empleado_apellidos?: string;
  empleado_documento?: string;
  empleado_fecha_ingreso?: string;
  dias_trabajados?: number;
  horas_extra_cantidad?: number;
  detalles?: DetalleLiquidacion[];
}

export interface RegistroAuditoria {
  id: string;
  empresa_id: string;
  usuario_id?: string;
  usuario_nombre: string;
  accion: string;
  entidad: string;
  entidad_id?: string;
  detalles?: any;
  ip?: string;
  creado_en: string;
}

export interface SalaReunion {
  id: string;
  empresa_id: string;
  nombre: string;
  tipo: 'FISICA' | 'VIRTUAL';
  capacidad: number;
  ubicacion?: string;
  equipamiento?: string[];
  enlace_virtual?: string;
  activo: boolean;
}

export interface Reunion {
  id: string;
  empresa_id: string;
  titulo: string;
  descripcion?: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDA';
  sala_id?: string;
  sala_nombre?: string;
  sala_ubicacion?: string;
  organizador_id?: string;
  organizador_nombre?: string;
  fecha_inicio: string;
  fecha_fin: string;
  enlace_reunion?: string;
  plataforma: 'MEET' | 'TEAMS' | 'ZOOM';
  estado: 'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA' | 'CANCELADA';
}

export interface NoticiaIntranet {
  id: string;
  empresa_id: string;
  titulo: string;
  contenido: string;
  categoria: string;
  imagen_url?: string;
  publicado_por?: string;
  autor_nombre?: string;
  fecha_publicacion: string;
  fijado: boolean;
}
