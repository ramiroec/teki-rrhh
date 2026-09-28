import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  UserX,
  UserCheck,
  Building,
  Briefcase,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MoreVertical,
  CheckCircle,
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
import { Tabla, ColumnaTabla } from '../componentes/ui/Tabla';
import { Modal } from '../componentes/ui/Modal';

export const ModuloEmpleados: React.FC = () => {
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const { usuario, esRRHH } = useAutenticacion();
  const { notificarExito, notificarError } = useNotificaciones();

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroSector, setFiltroSector] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Catálogos para formularios y filtros
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [tiposContrato, setTiposContrato] = useState<TipoContrato[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);

  // Modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(ubicacion.pathname === '/empleados/nuevo');
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<'Activo' | 'Inactivo' | 'Vacaciones' | 'Baja'>('Activo');

  // Formulario nuevo empleado
  const [pestañaFormulario, setPestañaFormulario] = useState<'personal' | 'laboral' | 'adicional'>('personal');
  const [formulario, setFormulario] = useState({
    codigo: '',
    nombres: '',
    apellidos: '',
    documento: '',
    fecha_nacimiento: '',
    sexo: 'Masculino',
    estado_civil: 'Soltero/a',
    nacionalidad: 'Paraguaya',
    direccion: '',
    ciudad: 'Asunción',
    telefono: '',
    celular: '',
    correo: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    sector_id: '',
    departamento_id: '',
    cargo_id: '',
    tipo_contrato_id: '',
    salario_base: '',
    horario_id: '',
    estado: 'Activo',
    interno: '',
    correo_corporativo: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    contacto_emergencia_parentesco: '',
    observaciones: '',
  });

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    const [resEmp, resSec, resDep, resCar, resCon, resHor] = await Promise.all([
      api.get<Empleado[]>('/empleados', {
        busqueda,
        sectorId: filtroSector,
        estado: filtroEstado,
      }),
      api.get<Sector[]>('/catalogos/sectores', { soloActivos: true }),
      api.get<Departamento[]>('/catalogos/departamentos', { soloActivos: true }),
      api.get<Cargo[]>('/catalogos/cargos', { soloActivos: true }),
      api.get<TipoContrato[]>('/catalogos/tipos-contrato'),
      api.get<Horario[]>('/catalogos/horarios'),
    ]);

    if (resEmp.exito && resEmp.datos) setEmpleados(resEmp.datos);
    if (resSec.exito && resSec.datos) setSectores(resSec.datos);
    if (resDep.exito && resDep.datos) setDepartamentos(resDep.datos);
    if (resCar.exito && resCar.datos) setCargos(resCar.datos);
    if (resCon.exito && resCon.datos) setTiposContrato(resCon.datos);
    if (resHor.exito && resHor.datos) setHorarios(resHor.datos);

    setCargando(false);
  }, [busqueda, filtroEstado, filtroSector]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (ubicacion.pathname === '/empleados/nuevo') {
      setModalNuevoAbierto(true);
    }
  }, [ubicacion.pathname]);

  const cerrarModalNuevo = () => {
    setModalNuevoAbierto(false);
    if (ubicacion.pathname === '/empleados/nuevo') {
      navigate('/empleados');
    }
  };

  const moneda = usuario?.empresa?.simboloMoneda || '₲';

  const manejarCrearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulario.codigo || !formulario.nombres || !formulario.apellidos || !formulario.documento || !formulario.salario_base) {
      notificarError('Por favor complete los campos obligatorios marcados con asterisco (*).');
      return;
    }

    const res = await api.post('/empleados', {
      ...formulario,
      salario_base: Number(formulario.salario_base),
    });

    if (res.exito) {
      notificarExito('Empleado registrado exitosamente.');
      cerrarModalNuevo();
      cargarDatos();
      // Reset form
      setFormulario({
        codigo: '',
        nombres: '',
        apellidos: '',
        documento: '',
        fecha_nacimiento: '',
        sexo: 'Masculino',
        estado_civil: 'Soltero/a',
        nacionalidad: 'Paraguaya',
        direccion: '',
        ciudad: 'Asunción',
        telefono: '',
        celular: '',
        correo: '',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        sector_id: '',
        departamento_id: '',
        cargo_id: '',
        tipo_contrato_id: '',
        salario_base: '',
        horario_id: '',
        estado: 'Activo',
        interno: '',
        correo_corporativo: '',
        contacto_emergencia_nombre: '',
        contacto_emergencia_telefono: '',
        contacto_emergencia_parentesco: '',
        observaciones: '',
      });
    } else {
      notificarError(res.mensaje || 'Error al guardar empleado');
    }
  };

  const manejarCambioEstado = async () => {
    if (!empleadoSeleccionado) return;
    const res = await api.patch(`/empleados/${empleadoSeleccionado.id}/estado`, {
      estado: nuevoEstado,
    });
    if (res.exito) {
      notificarExito(`Estado actualizado a "${nuevoEstado}" correctamente.`);
      setModalEstadoAbierto(false);
      cargarDatos();
    } else {
      notificarError(res.mensaje || 'Error al cambiar estado.');
    }
  };

  const columnas: ColumnaTabla<Empleado>[] = [
    {
      clave: 'colaborador',
      encabezado: 'Colaborador',
      render: (emp) => (
        <div className="flex items-center gap-3">
          <img
            src={emp.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${emp.nombres}`}
            alt={emp.nombres}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              {emp.nombres} {emp.apellidos}
            </p>
            <p className="text-xs text-slate-500 font-mono">{emp.codigo}</p>
          </div>
        </div>
      ),
    },
    {
      clave: 'documento',
      encabezado: 'Documento / Cédula',
      render: (emp) => <span className="font-mono text-xs text-slate-700">{emp.documento}</span>,
    },
    {
      clave: 'cargo',
      encabezado: 'Cargo y Área',
      render: (emp) => (
        <div>
          <p className="font-medium text-slate-800">{emp.cargo_nombre || 'Sin cargo asignado'}</p>
          <p className="text-[11px] text-slate-500">{emp.sector_nombre || 'General'}</p>
        </div>
      ),
    },
    {
      clave: 'salario_base',
      encabezado: 'Salario Base',
      alineacion: 'derecha',
      render: (emp) => (
        <span className="font-semibold text-slate-900">
          {moneda} {new Intl.NumberFormat('es-PY').format(Number(emp.salario_base) || 0)}
        </span>
      ),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      alineacion: 'centro',
      render: (emp) => <Badge>{emp.estado}</Badge>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alineacion: 'derecha',
      render: (emp) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Boton
            variante="fantasma"
            tamano="sm"
            onClick={() => navigate(`/empleados/${emp.id}`)}
            title="Ver Ficha Completa"
          >
            <Eye className="w-4 h-4 text-brand-600" />
          </Boton>
          {esRRHH && (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => {
                setEmpleadoSeleccionado(emp);
                setNuevoEstado(emp.estado as any);
                setModalEstadoAbierto(true);
              }}
              title="Cambiar Estado"
            >
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </Boton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Gestión de Colaboradores
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Administre la nómina, legajos digitales y fichas laborales de la empresa.
          </p>
        </div>
        {esRRHH && (
          <Boton
            variante="primario"
            onClick={() => setModalNuevoAbierto(true)}
            icono={<Plus className="w-4 h-4" />}
          >
            Nuevo Colaborador
          </Boton>
        )}
      </div>

      {/* Barra de Filtros */}
      <Tarjeta>
        <TarjetaCuerpo className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <Input
                placeholder="Buscar por nombre, documento o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                icono={<Search className="w-4 h-4" />}
              />
            </div>

            <Select
              value={filtroSector}
              onChange={(e) => setFiltroSector(e.target.value)}
              opciones={[
                { valor: '', texto: 'Todos los sectores' },
                ...sectores.map((s) => ({ valor: s.id, texto: s.nombre })),
              ]}
            />

            <Select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              opciones={[
                { valor: '', texto: 'Todos los estados' },
                { valor: 'Activo', texto: 'Activos' },
                { valor: 'Vacaciones', texto: 'De vacaciones' },
                { valor: 'Inactivo', texto: 'Inactivos' },
                { valor: 'Baja', texto: 'Bajas' },
              ]}
            />
          </div>
        </TarjetaCuerpo>
      </Tarjeta>

      {/* Tabla de Empleados */}
      <Tabla
        columnas={columnas}
        datos={empleados}
        cargando={cargando}
        alHacerClicFila={(emp) => navigate(`/empleados/${emp.id}`)}
        mensajeVacio="No se encontraron colaboradores"
        subtituloVacio="Modifique los filtros o registre un nuevo colaborador con el botón superior."
      />

      {/* MODAL: NUEVO EMPLEADO */}
      <Modal
        abierto={modalNuevoAbierto}
        alCerrar={cerrarModalNuevo}
        titulo="Alta de Nuevo Colaborador"
        subtitulo="Complete las secciones para dar de alta al colaborador en el sistema"
        tamano="xl"
      >
        <form onSubmit={manejarCrearEmpleado} className="space-y-6">
          {/* Navegación por pestañas del formulario */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setPestañaFormulario('personal')}
              className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                pestañaFormulario === 'personal'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              1. Información Personal
            </button>
            <button
              type="button"
              onClick={() => setPestañaFormulario('laboral')}
              className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                pestañaFormulario === 'laboral'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              2. Información Laboral
            </button>
            <button
              type="button"
              onClick={() => setPestañaFormulario('adicional')}
              className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                pestañaFormulario === 'adicional'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              3. Información Adicional y Emergencia
            </button>
          </div>

          {/* Pestaña 1: Personal */}
          {pestañaFormulario === 'personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                etiqueta="Nombres"
                required
                value={formulario.nombres}
                onChange={(e) => setFormulario({ ...formulario, nombres: e.target.value })}
                placeholder="Ej. Juan Carlos"
              />
              <Input
                etiqueta="Apellidos"
                required
                value={formulario.apellidos}
                onChange={(e) => setFormulario({ ...formulario, apellidos: e.target.value })}
                placeholder="Ej. Pérez Gómez"
              />
              <Input
                etiqueta="Documento de Identidad / C.I."
                required
                value={formulario.documento}
                onChange={(e) => setFormulario({ ...formulario, documento: e.target.value })}
                placeholder="Ej. 4.123.456"
              />
              <Input
                etiqueta="Fecha de Nacimiento"
                type="date"
                value={formulario.fecha_nacimiento}
                onChange={(e) => setFormulario({ ...formulario, fecha_nacimiento: e.target.value })}
              />
              <Select
                etiqueta="Sexo"
                value={formulario.sexo}
                onChange={(e) => setFormulario({ ...formulario, sexo: e.target.value })}
                opciones={[
                  { valor: 'Masculino', texto: 'Masculino' },
                  { valor: 'Femenino', texto: 'Femenino' },
                  { valor: 'No especificado', texto: 'No especificado' },
                ]}
              />
              <Select
                etiqueta="Estado Civil"
                value={formulario.estado_civil}
                onChange={(e) => setFormulario({ ...formulario, estado_civil: e.target.value })}
                opciones={[
                  { valor: 'Soltero/a', texto: 'Soltero/a' },
                  { valor: 'Casado/a', texto: 'Casado/a' },
                  { valor: 'Divorciado/a', texto: 'Divorciado/a' },
                  { valor: 'Viudo/a', texto: 'Viudo/a' },
                ]}
              />
              <Input
                etiqueta="Nacionalidad"
                value={formulario.nacionalidad}
                onChange={(e) => setFormulario({ ...formulario, nacionalidad: e.target.value })}
              />
              <Input
                etiqueta="Teléfono Móvil / Celular"
                value={formulario.celular}
                onChange={(e) => setFormulario({ ...formulario, celular: e.target.value })}
                placeholder="0981 123456"
              />
              <Input
                etiqueta="Correo Personal"
                type="email"
                value={formulario.correo}
                onChange={(e) => setFormulario({ ...formulario, correo: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
              <Input
                etiqueta="Ciudad de Residencia"
                value={formulario.ciudad}
                onChange={(e) => setFormulario({ ...formulario, ciudad: e.target.value })}
                placeholder="Asunción"
              />
              <div className="sm:col-span-2">
                <Input
                  etiqueta="Dirección Domiciliaria"
                  value={formulario.direccion}
                  onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
                  placeholder="Calle, número de casa, barrio"
                />
              </div>
            </div>
          )}

          {/* Pestaña 2: Laboral */}
          {pestañaFormulario === 'laboral' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                etiqueta="Código de Empleado"
                required
                value={formulario.codigo}
                onChange={(e) => setFormulario({ ...formulario, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej. TEKI-011"
              />
              <Input
                etiqueta="Fecha de Ingreso"
                type="date"
                required
                value={formulario.fecha_ingreso}
                onChange={(e) => setFormulario({ ...formulario, fecha_ingreso: e.target.value })}
              />
              <Select
                etiqueta="Sector"
                value={formulario.sector_id}
                onChange={(e) => setFormulario({ ...formulario, sector_id: e.target.value })}
                opciones={[
                  { valor: '', texto: 'Seleccione un sector' },
                  ...sectores.map((s) => ({ valor: s.id, texto: s.nombre })),
                ]}
              />
              <Select
                etiqueta="Departamento"
                value={formulario.departamento_id}
                onChange={(e) => setFormulario({ ...formulario, departamento_id: e.target.value })}
                opciones={[
                  { valor: '', texto: 'Seleccione un departamento' },
                  ...departamentos.map((d) => ({ valor: d.id, texto: d.nombre })),
                ]}
              />
              <Select
                etiqueta="Cargo"
                value={formulario.cargo_id}
                onChange={(e) => setFormulario({ ...formulario, cargo_id: e.target.value })}
                opciones={[
                  { valor: '', texto: 'Seleccione un cargo' },
                  ...cargos.map((c) => ({ valor: c.id, texto: `${c.nombre} (${c.nivel})` })),
                ]}
              />
              <Select
                etiqueta="Tipo de Contrato"
                value={formulario.tipo_contrato_id}
                onChange={(e) => setFormulario({ ...formulario, tipo_contrato_id: e.target.value })}
                opciones={[
                  { valor: '', texto: 'Seleccione contrato' },
                  ...tiposContrato.map((t) => ({ valor: t.id, texto: t.nombre })),
                ]}
              />
              <Input
                etiqueta={`Salario Base Mensual (${moneda})`}
                type="number"
                required
                value={formulario.salario_base}
                onChange={(e) => setFormulario({ ...formulario, salario_base: e.target.value })}
                placeholder="Ej. 7500000"
              />
              <Select
                etiqueta="Horario Laboral Asignado"
                value={formulario.horario_id}
                onChange={(e) => setFormulario({ ...formulario, horario_id: e.target.value })}
                opciones={[
                  { valor: '', texto: 'Seleccione horario' },
                  ...horarios.map((h) => ({ valor: h.id, texto: `${h.nombre} (${h.hora_entrada} a ${h.hora_salida})` })),
                ]}
              />
            </div>
          )}

          {/* Pestaña 3: Adicional */}
          {pestañaFormulario === 'adicional' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                etiqueta="Correo Electrónico Corporativo"
                type="email"
                value={formulario.correo_corporativo}
                onChange={(e) => setFormulario({ ...formulario, correo_corporativo: e.target.value })}
                placeholder="nombre@teki.com.py"
              />
              <Input
                etiqueta="Número de Interno Telefónico"
                value={formulario.interno}
                onChange={(e) => setFormulario({ ...formulario, interno: e.target.value })}
                placeholder="Ej. 104"
              />
              <Input
                etiqueta="Contacto de Emergencia (Nombre Completo)"
                value={formulario.contacto_emergencia_nombre}
                onChange={(e) => setFormulario({ ...formulario, contacto_emergencia_nombre: e.target.value })}
                placeholder="Nombre de familiar"
              />
              <Input
                etiqueta="Teléfono de Emergencia"
                value={formulario.contacto_emergencia_telefono}
                onChange={(e) => setFormulario({ ...formulario, contacto_emergencia_telefono: e.target.value })}
                placeholder="0981 000000"
              />
              <Input
                etiqueta="Parentesco de Emergencia"
                value={formulario.contacto_emergencia_parentesco}
                onChange={(e) => setFormulario({ ...formulario, contacto_emergencia_parentesco: e.target.value })}
                placeholder="Ej. Cónyuge, Madre, Hermano/a"
              />
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Observaciones Generales
                </label>
                <textarea
                  rows={3}
                  value={formulario.observaciones}
                  onChange={(e) => setFormulario({ ...formulario, observaciones: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  placeholder="Detalles sobre habilidades, historial o condiciones especiales..."
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Boton
              type="button"
              variante="fantasma"
              onClick={cerrarModalNuevo}
            >
              Cancelar
            </Boton>
            <div className="flex items-center gap-2">
              {pestañaFormulario !== 'adicional' && (
                <Boton
                  type="button"
                  variante="secundario"
                  onClick={() => {
                    if (pestañaFormulario === 'personal') setPestañaFormulario('laboral');
                    else if (pestañaFormulario === 'laboral') setPestañaFormulario('adicional');
                  }}
                >
                  Siguiente
                </Boton>
              )}
              <Boton type="submit" variante="primario">
                Guardar y Crear Colaborador
              </Boton>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: CAMBIAR ESTADO */}
      <Modal
        abierto={modalEstadoAbierto}
        alCerrar={() => setModalEstadoAbierto(false)}
        titulo="Actualizar Estado del Colaborador"
        subtitulo={`Colaborador: ${empleadoSeleccionado?.nombres} ${empleadoSeleccionado?.apellidos}`}
        tamano="sm"
        pie={
          <>
            <Boton variante="fantasma" onClick={() => setModalEstadoAbierto(false)}>
              Cancelar
            </Boton>
            <Boton variante="primario" onClick={manejarCambioEstado}>
              Guardar Cambios
            </Boton>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            etiqueta="Seleccionar nuevo estado"
            value={nuevoEstado}
            onChange={(e) => setNuevoEstado(e.target.value as any)}
            opciones={[
              { valor: 'Activo', texto: 'Activo (En funciones normales)' },
              { valor: 'Vacaciones', texto: 'De Vacaciones (Licencia temporal)' },
              { valor: 'Inactivo', texto: 'Inactivo (Pausa laboral)' },
              { valor: 'Baja', texto: 'Baja Definitiva (Desvinculado)' },
            ]}
          />
          {nuevoEstado === 'Baja' && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              Al marcar como Baja, el colaborador ya no se incluirá en las liquidaciones mensuales activas.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
