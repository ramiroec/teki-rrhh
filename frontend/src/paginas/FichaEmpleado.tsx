import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Briefcase,
  Phone,
  FileText,
  Clock,
  Palmtree,
  ArrowLeft,
  Edit2,
  Calendar,
  DollarSign,
  MapPin,
  Mail,
  Shield,
  UploadCloud,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { api } from '../servicios/api';
import { Empleado, Sector, Departamento, Cargo, TipoContrato, Horario } from '../tipos';
import { useAutenticacion } from '../contexto/AutenticacionContexto';
import { useNotificaciones } from '../contexto/NotificacionesContexto';
import { Tarjeta, TarjetaEncabezado, TarjetaCuerpo } from '../componentes/ui/Tarjeta';
import { Boton } from '../componentes/ui/Boton';
import { Badge } from '../componentes/ui/Badge';
import { Input } from '../componentes/ui/Input';
import { Select } from '../componentes/ui/Select';
import { Modal } from '../componentes/ui/Modal';
import { Skeleton } from '../componentes/ui/Skeleton';

export const FichaEmpleado: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const { usuario, esRRHH } = useAutenticacion();
  const { notificarExito, notificarError } = useNotificaciones();

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pestañaActiva, setPestañaActiva] = useState<'personal' | 'laboral' | 'adicional' | 'documentos' | 'historial'>('personal');

  // Modal para subir documento
  const [modalDocAbierto, setModalDocAbierto] = useState(false);
  const [formDoc, setFormDoc] = useState({
    tipo_documento: 'Cédula de Identidad',
    nombre_archivo: '',
    notas: '',
  });

  // Modal para editar datos laborales/personales
  const [modalEditarAbierto, setModalEditarAbierto] = useState(ubicacion.pathname.endsWith('/editar'));
  const [formEdicion, setFormEdicion] = useState<any>({});
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);

  const cargarEmpleado = async () => {
    if (!id) return;
    setCargando(true);
    const res = await api.get<Empleado>(`/empleados/${id}`);
    if (res.exito && res.datos) {
      setEmpleado(res.datos);
      setFormEdicion(res.datos);
    } else {
      notificarError('No se encontró el colaborador solicitado.');
      navigate('/empleados');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarEmpleado();
    api.get<Sector[]>('/catalogos/sectores').then((r) => r.datos && setSectores(r.datos));
    api.get<Departamento[]>('/catalogos/departamentos').then((r) => r.datos && setDepartamentos(r.datos));
    api.get<Cargo[]>('/catalogos/cargos').then((r) => r.datos && setCargos(r.datos));
  }, [id]);

  useEffect(() => {
    if (ubicacion.pathname.endsWith('/editar')) {
      setModalEditarAbierto(true);
    }
  }, [ubicacion.pathname]);

  const cerrarModalEditar = () => {
    setModalEditarAbierto(false);
    if (ubicacion.pathname.endsWith('/editar')) {
      navigate(`/empleados/${id}`);
    }
  };

  const moneda = usuario?.empresa?.simboloMoneda || '₲';

  const manejarGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const res = await api.put(`/empleados/${id}`, {
      ...formEdicion,
      salario_base: Number(formEdicion.salario_base),
    });
    if (res.exito) {
      notificarExito('Ficha del empleado actualizada exitosamente.');
      cerrarModalEditar();
      cargarEmpleado();
    } else {
      notificarError(res.mensaje || 'Error al actualizar empleado.');
    }
  };

  const manejarSubirDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formDoc.nombre_archivo) return;
    const res = await api.post(`/empleados/${id}/documentos`, formDoc);
    if (res.exito) {
      notificarExito('Documento adjuntado al legajo correctamente.');
      setModalDocAbierto(false);
      setFormDoc({ tipo_documento: 'Cédula de Identidad', nombre_archivo: '', notas: '' });
      cargarEmpleado();
    } else {
      notificarError(res.mensaje || 'Error al guardar documento.');
    }
  };

  if (cargando || !empleado) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-2xl w-full" />
        <Skeleton className="h-96 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <div>
        <Boton
          variante="fantasma"
          tamano="sm"
          onClick={() => navigate('/empleados')}
          icono={<ArrowLeft className="w-4 h-4" />}
        >
          Volver a Colaboradores
        </Boton>
      </div>

      {/* Tarjeta de Perfil / Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
        {/* Banner decorativo */}
        <div className="h-28 bg-gradient-to-r from-brand-600 via-indigo-600 to-sky-600 relative" />

        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
          <div className="flex items-end gap-4">
            <img
              src={empleado.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${empleado.nombres}`}
              alt={empleado.nombres}
              className="w-24 h-24 rounded-2xl border-4 border-white object-cover bg-white shadow-md shrink-0"
            />
            <div className="mb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {empleado.nombres} {empleado.apellidos}
                </h1>
                <Badge>{empleado.estado}</Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {empleado.cargo_nombre || 'Sin cargo'} &bull;{' '}
                <span className="text-brand-600">{empleado.sector_nombre || 'General'}</span> &bull;{' '}
                <span className="font-mono text-slate-400">{empleado.codigo}</span>
              </p>
            </div>
          </div>

          {esRRHH && (
            <div className="flex items-center gap-2 self-start sm:self-end">
              <Boton
                variante="esquema"
                tamano="sm"
                onClick={() => setModalDocAbierto(true)}
                icono={<UploadCloud className="w-4 h-4" />}
              >
                Subir Documento
              </Boton>
              <Boton
                variante="primario"
                tamano="sm"
                onClick={() => setModalEditarAbierto(true)}
                icono={<Edit2 className="w-4 h-4" />}
              >
                Editar Ficha
              </Boton>
            </div>
          )}
        </div>

        {/* Barra de pestañas */}
        <div className="px-6 border-t border-slate-100 flex gap-6 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setPestañaActiva('personal')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
              pestañaActiva === 'personal'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Información Personal
          </button>
          <button
            onClick={() => setPestañaActiva('laboral')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
              pestañaActiva === 'laboral'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Información Laboral
          </button>
          <button
            onClick={() => setPestañaActiva('adicional')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
              pestañaActiva === 'adicional'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Adicional y Emergencia
          </button>
          <button
            onClick={() => setPestañaActiva('documentos')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
              pestañaActiva === 'documentos'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Legajo y Documentos ({empleado.documentos?.length || 0})
          </button>
          <button
            onClick={() => setPestañaActiva('historial')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
              pestañaActiva === 'historial'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Asistencias y Vacaciones
          </button>
        </div>
      </div>

      {/* Contenido de la Pestaña Activa */}

      {/* 1. INFORMACIÓN PERSONAL */}
      {pestañaActiva === 'personal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Tarjeta>
            <TarjetaEncabezado titulo="Datos de Identificación" icono={<User className="w-5 h-5 text-brand-600" />} />
            <TarjetaCuerpo className="space-y-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Nombres completos</span>
                <span className="font-semibold text-slate-800">{empleado.nombres}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Apellidos completos</span>
                <span className="font-semibold text-slate-800">{empleado.apellidos}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Documento de Identidad / C.I.</span>
                <span className="font-mono font-semibold text-slate-900">{empleado.documento}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Fecha de Nacimiento</span>
                <span className="font-semibold text-slate-800">
                  {empleado.fecha_nacimiento
                    ? new Date(empleado.fecha_nacimiento).toLocaleDateString('es-PY')
                    : 'No especificada'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Sexo</span>
                <span className="font-semibold text-slate-800">{empleado.sexo}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Estado Civil</span>
                <span className="font-semibold text-slate-800">{empleado.estado_civil}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Nacionalidad</span>
                <span className="font-semibold text-slate-800">{empleado.nacionalidad}</span>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>

          <Tarjeta>
            <TarjetaEncabezado titulo="Contacto y Residencia" icono={<MapPin className="w-5 h-5 text-brand-600" />} />
            <TarjetaCuerpo className="space-y-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Teléfono Móvil</span>
                <span className="font-semibold text-slate-800">{empleado.celular || 'No registrado'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Teléfono Particular</span>
                <span className="font-semibold text-slate-800">{empleado.telefono || 'No registrado'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Correo Electrónico Personal</span>
                <span className="font-semibold text-brand-600">{empleado.correo || 'No registrado'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Ciudad de Residencia</span>
                <span className="font-semibold text-slate-800">{empleado.ciudad || 'No especificada'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Dirección Domiciliaria</span>
                <span className="font-semibold text-slate-800 text-right max-w-xs">{empleado.direccion || 'No especificada'}</span>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>
        </div>
      )}

      {/* 2. INFORMACIÓN LABORAL */}
      {pestañaActiva === 'laboral' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Tarjeta>
            <TarjetaEncabezado titulo="Condiciones Contractuales" icono={<Briefcase className="w-5 h-5 text-brand-600" />} />
            <TarjetaCuerpo className="space-y-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Código Interno</span>
                <span className="font-mono font-semibold text-brand-700">{empleado.codigo}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Fecha de Ingreso</span>
                <span className="font-semibold text-slate-800">
                  {new Date(empleado.fecha_ingreso).toLocaleDateString('es-PY')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Tipo de Contrato</span>
                <span className="font-semibold text-slate-800">{empleado.tipo_contrato_nombre || 'Indefinido'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Salario Base Mensual</span>
                <span className="text-sm font-bold text-emerald-700">
                  {moneda} {new Intl.NumberFormat('es-PY').format(Number(empleado.salario_base))}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Estado del Colaborador</span>
                <Badge>{empleado.estado}</Badge>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>

          <Tarjeta>
            <TarjetaEncabezado titulo="Puesto, Horario y Liderazgo" icono={<Clock className="w-5 h-5 text-brand-600" />} />
            <TarjetaCuerpo className="space-y-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Sector / Área</span>
                <span className="font-semibold text-slate-800">{empleado.sector_nombre || 'General'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Departamento</span>
                <span className="font-semibold text-slate-800">{empleado.departamento_nombre || 'General'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Cargo Asignado</span>
                <span className="font-semibold text-slate-800">{empleado.cargo_nombre || 'No asignado'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Horario Laboral</span>
                <span className="font-semibold text-slate-800">
                  {empleado.horario_nombre} ({empleado.hora_entrada?.slice(0, 5)} a {empleado.hora_salida?.slice(0, 5)})
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Jefe / Responsable Directo</span>
                <span className="font-semibold text-slate-800">{empleado.jefe_nombre || 'Dirección General'}</span>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>
        </div>
      )}

      {/* 3. INFORMACIÓN ADICIONAL Y EMERGENCIA */}
      {pestañaActiva === 'adicional' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Tarjeta>
            <TarjetaEncabezado titulo="Contacto de Emergencia" icono={<Shield className="w-5 h-5 text-rose-500" />} />
            <TarjetaCuerpo className="space-y-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Nombre de Contacto</span>
                <span className="font-semibold text-slate-800">
                  {empleado.contacto_emergencia_nombre || 'No especificado'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Teléfono de Emergencia</span>
                <span className="font-semibold text-rose-600">
                  {empleado.contacto_emergencia_telefono || 'No especificado'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Parentesco</span>
                <span className="font-semibold text-slate-800">
                  {empleado.contacto_emergencia_parentesco || 'No especificado'}
                </span>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>

          <Tarjeta>
            <TarjetaEncabezado titulo="Datos Corporativos y Observaciones" icono={<Mail className="w-5 h-5 text-brand-600" />} />
            <TarjetaCuerpo className="space-y-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Correo Corporativo</span>
                <span className="font-semibold text-brand-600">{empleado.correo_corporativo || 'Pendiente de alta'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Interno Telefónico</span>
                <span className="font-mono font-semibold text-slate-800">{empleado.interno || 'N/A'}</span>
              </div>
              <div className="pt-2">
                <p className="text-slate-500 font-medium mb-1">Observaciones</p>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  {empleado.observaciones || 'Sin observaciones registradas.'}
                </p>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>
        </div>
      )}

      {/* 4. DOCUMENTACIÓN */}
      {pestañaActiva === 'documentos' && (
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Legajo Digital del Colaborador"
            subtitulo="Documentación contractual, cédula, certificados y comprobantes"
            icono={<FileText className="w-5 h-5 text-brand-600" />}
            accion={
              esRRHH && (
                <Boton
                  variante="primario"
                  tamano="sm"
                  onClick={() => setModalDocAbierto(true)}
                  icono={<UploadCloud className="w-4 h-4" />}
                >
                  Adjuntar Documento
                </Boton>
              )
            }
          />
          <TarjetaCuerpo className="p-4">
            {!empleado.documentos || empleado.documentos.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                No hay documentos adjuntos al legajo actualmente.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {empleado.documentos.map((doc) => (
                  <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileCheck className="w-4 h-4 text-brand-600 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 truncate">{doc.tipo_documento}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-mono truncate">{doc.nombre_archivo}</p>
                      {doc.notas && <p className="text-[11px] text-slate-500 mt-1 italic">{doc.notas}</p>}
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(doc.fecha_subida).toLocaleDateString('es-PY')}</span>
                      <a
                        href={doc.url_archivo}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 font-semibold hover:underline"
                      >
                        Visualizar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TarjetaCuerpo>
        </Tarjeta>
      )}

      {/* 5. HISTORIAL DE ASISTENCIA Y VACACIONES */}
      {pestañaActiva === 'historial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Tarjeta>
            <TarjetaEncabezado titulo="Marcaciones Recientes" icono={<Clock className="w-5 h-5 text-brand-600" />} />
            <TarjetaCuerpo className="p-0">
              <div className="divide-y divide-slate-100 text-xs">
                {(!empleado.marcacionesRecientes || empleado.marcacionesRecientes.length === 0) ? (
                  <p className="p-6 text-center text-slate-500">No hay registros recientes.</p>
                ) : (
                  empleado.marcacionesRecientes.map((m) => (
                    <div key={m.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{new Date(m.fecha).toLocaleDateString('es-PY')}</p>
                        <p className="text-[11px] text-slate-500">
                          {m.hora_entrada ? `${m.hora_entrada.slice(0, 5)} - ${m.hora_salida?.slice(0, 5) || 'En curso'}` : 'Sin marcación'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge tamano="sm">{m.estado}</Badge>
                        <p className="text-[11px] text-slate-500 mt-0.5">{m.horas_trabajadas} hs trabajadas</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TarjetaCuerpo>
          </Tarjeta>

          <Tarjeta>
            <TarjetaEncabezado titulo="Historial de Vacaciones" icono={<Palmtree className="w-5 h-5 text-brand-600" />} />
            <TarjetaCuerpo className="p-0">
              <div className="divide-y divide-slate-100 text-xs">
                {(!empleado.solicitudesVacaciones || empleado.solicitudesVacaciones.length === 0) ? (
                  <p className="p-6 text-center text-slate-500">No hay solicitudes de vacaciones registradas.</p>
                ) : (
                  empleado.solicitudesVacaciones.map((v) => (
                    <div key={v.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {new Date(v.fecha_inicio).toLocaleDateString('es-PY')} al {new Date(v.fecha_fin).toLocaleDateString('es-PY')}
                        </p>
                        <p className="text-[11px] text-slate-500">{v.dias_solicitados} días hábiles</p>
                      </div>
                      <Badge tamano="sm">{v.estado}</Badge>
                    </div>
                  ))
                )}
              </div>
            </TarjetaCuerpo>
          </Tarjeta>
        </div>
      )}

      {/* MODAL: SUBIR DOCUMENTO */}
      <Modal
        abierto={modalDocAbierto}
        alCerrar={() => setModalDocAbierto(false)}
        titulo="Adjuntar Documento a Legajo"
        subtitulo={`Colaborador: ${empleado.nombres} ${empleado.apellidos}`}
        tamano="md"
      >
        <form onSubmit={manejarSubirDocumento} className="space-y-4">
          <Select
            etiqueta="Tipo de Documento"
            value={formDoc.tipo_documento}
            onChange={(e) => setFormDoc({ ...formDoc, tipo_documento: e.target.value })}
            opciones={[
              { valor: 'Cédula de Identidad', texto: 'Cédula de Identidad' },
              { valor: 'Contrato Laboral', texto: 'Contrato Laboral' },
              { valor: 'Certificado de Título', texto: 'Certificado de Título' },
              { valor: 'Certificado Médico', texto: 'Certificado Médico' },
              { valor: 'Constancia de Capacitación', texto: 'Constancia de Capacitación' },
              { valor: 'Otro Documento', texto: 'Otro Documento' },
            ]}
          />
          <Input
            etiqueta="Nombre del Archivo / Descripción"
            required
            value={formDoc.nombre_archivo}
            onChange={(e) => setFormDoc({ ...formDoc, nombre_archivo: e.target.value })}
            placeholder="ej. cedula_actualizada_2026.pdf"
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notas adicionales</label>
            <textarea
              rows={2}
              value={formDoc.notas}
              onChange={(e) => setFormDoc({ ...formDoc, notas: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              placeholder="Observación sobre autenticidad, vigencia..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Boton type="button" variante="fantasma" onClick={() => setModalDocAbierto(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario">
              Registrar Documento
            </Boton>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDITAR DATOS DEL EMPLEADO */}
      <Modal
        abierto={modalEditarAbierto}
        alCerrar={cerrarModalEditar}
        titulo="Editar Ficha del Colaborador"
        tamano="lg"
      >
        <form onSubmit={manejarGuardarEdicion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              etiqueta="Nombres"
              required
              value={formEdicion.nombres || ''}
              onChange={(e) => setFormEdicion({ ...formEdicion, nombres: e.target.value })}
            />
            <Input
              etiqueta="Apellidos"
              required
              value={formEdicion.apellidos || ''}
              onChange={(e) => setFormEdicion({ ...formEdicion, apellidos: e.target.value })}
            />
            <Input
              etiqueta="Documento / C.I."
              required
              value={formEdicion.documento || ''}
              onChange={(e) => setFormEdicion({ ...formEdicion, documento: e.target.value })}
            />
            <Input
              etiqueta={`Salario Base (${moneda})`}
              type="number"
              required
              value={formEdicion.salario_base || ''}
              onChange={(e) => setFormEdicion({ ...formEdicion, salario_base: e.target.value })}
            />
            <Select
              etiqueta="Sector"
              value={formEdicion.sector_id || ''}
              onChange={(e) => setFormEdicion({ ...formEdicion, sector_id: e.target.value })}
              opciones={[
                { valor: '', texto: 'Seleccione sector' },
                ...sectores.map((s) => ({ valor: s.id, texto: s.nombre })),
              ]}
            />
            <Select
              etiqueta="Cargo"
              value={formEdicion.cargo_id || ''}
              onChange={(e) => setFormEdicion({ ...formEdicion, cargo_id: e.target.value })}
              opciones={[
                { valor: '', texto: 'Seleccione cargo' },
                ...cargos.map((c) => ({ valor: c.id, texto: c.nombre })),
              ]}
            />
            <Input
              etiqueta="Celular"
              value={formEdicion.celular || ''}
              onChange={(e) => setFormEdicion({ ...formEdicion, celular: e.target.value })}
            />
            <Input
              etiqueta="Correo Corporativo"
              value={formEdicion.correo_corporativo || ''}
              onChange={(e) => setFormEdicion({ ...formEdicion, correo_corporativo: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Boton type="button" variante="fantasma" onClick={cerrarModalEditar}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario">
              Guardar Cambios
            </Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
