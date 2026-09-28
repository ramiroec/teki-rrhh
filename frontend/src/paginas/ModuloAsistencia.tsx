import React, { useEffect, useState } from 'react';
import {
  Clock,
  Calendar,
  UserCheck,
  AlertTriangle,
  UserX,
  Plus,
  Search,
  Filter,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../servicios/api';
import { Marcacion, Empleado, Sector } from '../tipos';
import { useAutenticacion } from '../contexto/AutenticacionContexto';
import { useNotificaciones } from '../contexto/NotificacionesContexto';
import { Tarjeta, TarjetaEncabezado, TarjetaCuerpo } from '../componentes/ui/Tarjeta';
import { Boton } from '../componentes/ui/Boton';
import { Badge } from '../componentes/ui/Badge';
import { Input } from '../componentes/ui/Input';
import { Select } from '../componentes/ui/Select';
import { Tabla, ColumnaTabla } from '../componentes/ui/Tabla';
import { Modal } from '../componentes/ui/Modal';

export const ModuloAsistencia: React.FC = () => {
  const { usuario, esRRHH } = useAutenticacion();
  const { notificarExito, notificarError } = useNotificaciones();

  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('2026-09-25'); // Fecha demo con registros
  const [filtroSector, setFiltroSector] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Catálogos
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);

  // Modal registrar marcación
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [formMarcacion, setFormMarcacion] = useState({
    empleado_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_entrada: '08:30',
    hora_salida: '17:30',
    estado: 'Presente',
    tipo_origen: 'Manual',
    observaciones: '',
  });

  const cargarDatos = async () => {
    setCargando(true);
    const [resMarc, resRes, resEmp, resSec] = await Promise.all([
      api.get<Marcacion[]>('/asistencia/marcaciones', {
        fecha: fechaSeleccionada || undefined,
        sectorId: filtroSector || undefined,
        estado: filtroEstado || undefined,
      }),
      api.get('/asistencia/resumen', { fecha: fechaSeleccionada }),
      api.get<Empleado[]>('/empleados', { estado: 'Activo' }),
      api.get<Sector[]>('/catalogos/sectores', { soloActivos: true }),
    ]);

    if (resMarc.exito && resMarc.datos) setMarcaciones(resMarc.datos);
    if (resRes.exito && resRes.datos) setResumen(resRes.datos);
    if (resEmp.exito && resEmp.datos) setEmpleados(resEmp.datos);
    if (resSec.exito && resSec.datos) setSectores(resSec.datos);

    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [fechaSeleccionada, filtroSector, filtroEstado]);

  const manejarGuardarMarcacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMarcacion.empleado_id || !formMarcacion.fecha) {
      notificarError('Seleccione el colaborador y la fecha.');
      return;
    }

    const res = await api.post('/asistencia/marcaciones', formMarcacion);
    if (res.exito) {
      notificarExito('Marcación registrada correctamente.');
      setModalRegistroAbierto(false);
      cargarDatos();
    } else {
      notificarError(res.mensaje || 'Error al registrar marcación.');
    }
  };

  const columnas: ColumnaTabla<Marcacion>[] = [
    {
      clave: 'empleado',
      encabezado: 'Colaborador',
      render: (m) => (
        <div className="flex items-center gap-3">
          <img
            src={m.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${m.nombres}`}
            alt={m.nombres}
            className="w-8 h-8 rounded-full border object-cover shrink-0"
          />
          <div>
            <p className="font-semibold text-slate-800">
              {m.nombres} {m.apellidos}
            </p>
            <p className="text-[11px] text-slate-500">{m.cargo_nombre || m.sector_nombre || 'Colaborador'}</p>
          </div>
        </div>
      ),
    },
    {
      clave: 'fecha',
      encabezado: 'Fecha',
      render: (m) => <span className="font-mono text-xs text-slate-700">{new Date(m.fecha).toLocaleDateString('es-PY')}</span>,
    },
    {
      clave: 'entrada',
      encabezado: 'Entrada',
      render: (m) => (
        <span className="font-mono text-xs font-medium text-slate-800">
          {m.hora_entrada ? m.hora_entrada.slice(0, 5) : '--:--'}
        </span>
      ),
    },
    {
      clave: 'salida',
      encabezado: 'Salida',
      render: (m) => (
        <span className="font-mono text-xs font-medium text-slate-800">
          {m.hora_salida ? m.hora_salida.slice(0, 5) : '--:--'}
        </span>
      ),
    },
    {
      clave: 'horas_trabajadas',
      encabezado: 'Hs Trabajadas',
      alineacion: 'centro',
      render: (m) => (
        <span className="font-semibold text-slate-900">
          {m.horas_trabajadas ? `${m.horas_trabajadas} hs` : '-'}
        </span>
      ),
    },
    {
      clave: 'horas_extra',
      encabezado: 'Hs Extra',
      alineacion: 'centro',
      render: (m) =>
        m.horas_extra > 0 ? (
          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            +{m.horas_extra} hs
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      clave: 'minutos_retraso',
      encabezado: 'Retraso',
      alineacion: 'centro',
      render: (m) =>
        m.minutos_retraso > 0 ? (
          <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">
            {m.minutos_retraso} min
          </span>
        ) : (
          <span className="text-emerald-600 text-xs">Puntual</span>
        ),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      alineacion: 'centro',
      render: (m) => <Badge>{m.estado}</Badge>,
    },
    {
      clave: 'tipo_origen',
      encabezado: 'Origen',
      render: (m) => <span className="text-xs text-slate-500">{m.tipo_origen}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Control de Asistencia y Marcaciones
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registro diario, cómputo de horas extraordinarias y control de puntualidad.
          </p>
        </div>
        {esRRHH && (
          <Boton
            variante="primario"
            onClick={() => setModalRegistroAbierto(true)}
            icono={<Plus className="w-4 h-4" />}
          >
            Carga Manual de Marcación
          </Boton>
        )}
      </div>

      {/* Tarjetas Indicadoras del Día */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Tarjeta>
          <TarjetaCuerpo className="p-4 text-center">
            <p className="text-xs text-slate-500 font-medium">Presentes</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{resumen?.presentes ?? 0}</p>
          </TarjetaCuerpo>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCuerpo className="p-4 text-center">
            <p className="text-xs text-slate-500 font-medium">Llegadas Tardías</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{resumen?.tardias ?? 0}</p>
          </TarjetaCuerpo>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCuerpo className="p-4 text-center">
            <p className="text-xs text-slate-500 font-medium">Ausencias / Permisos</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{(resumen?.ausentes ?? 0) + (resumen?.permisos ?? 0)}</p>
          </TarjetaCuerpo>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCuerpo className="p-4 text-center">
            <p className="text-xs text-slate-500 font-medium">En Vacaciones</p>
            <p className="text-2xl font-bold text-sky-600 mt-1">{resumen?.vacaciones ?? 0}</p>
          </TarjetaCuerpo>
        </Tarjeta>

        <Tarjeta className="col-span-2 sm:col-span-1">
          <TarjetaCuerpo className="p-4 text-center">
            <p className="text-xs text-slate-500 font-medium">Total Hs Extra</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{resumen?.totalHorasExtra ?? 0} hs</p>
          </TarjetaCuerpo>
        </Tarjeta>
      </div>

      {/* Barra de Filtros */}
      <Tarjeta>
        <TarjetaCuerpo className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <Input
              etiqueta="Fecha de marcación"
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
            />

            <Select
              etiqueta="Sector"
              value={filtroSector}
              onChange={(e) => setFiltroSector(e.target.value)}
              opciones={[
                { valor: '', texto: 'Todos los sectores' },
                ...sectores.map((s) => ({ valor: s.id, texto: s.nombre })),
              ]}
            />

            <Select
              etiqueta="Estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              opciones={[
                { valor: '', texto: 'Todos los estados' },
                { valor: 'Presente', texto: 'Presente' },
                { valor: 'Llegada tardía', texto: 'Llegada tardía' },
                { valor: 'Ausente', texto: 'Ausente' },
                { valor: 'Vacaciones', texto: 'Vacaciones' },
                { valor: 'Permiso', texto: 'Permiso' },
              ]}
            />

            <div className="flex items-end">
              <Boton
                variante="secundario"
                className="w-full"
                onClick={() => {
                  setFechaSeleccionada('2026-09-25');
                  setFiltroSector('');
                  setFiltroEstado('');
                }}
              >
                Restablecer Filtros
              </Boton>
            </div>
          </div>
        </TarjetaCuerpo>
      </Tarjeta>

      {/* Tabla de Marcaciones */}
      <Tabla
        columnas={columnas}
        datos={marcaciones}
        cargando={cargando}
        mensajeVacio="No hay marcaciones para los filtros seleccionados"
        subtituloVacio="Seleccione otra fecha o registre una nueva marcación con el botón superior."
      />

      {/* MODAL: CARGA MANUAL DE MARCACIÓN */}
      <Modal
        abierto={modalRegistroAbierto}
        alCerrar={() => setModalRegistroAbierto(false)}
        titulo="Registro Manual de Marcación"
        subtitulo="Ingrese la hora de entrada y salida para calcular horas trabajadas y extras"
        tamano="md"
      >
        <form onSubmit={manejarGuardarMarcacion} className="space-y-4">
          <Select
            etiqueta="Colaborador"
            required
            value={formMarcacion.empleado_id}
            onChange={(e) => setFormMarcacion({ ...formMarcacion, empleado_id: e.target.value })}
            opciones={[
              { valor: '', texto: 'Seleccione un colaborador' },
              ...empleados.map((e) => ({ valor: e.id, texto: `${e.nombres} ${e.apellidos} (${e.codigo})` })),
            ]}
          />

          <Input
            etiqueta="Fecha"
            type="date"
            required
            value={formMarcacion.fecha}
            onChange={(e) => setFormMarcacion({ ...formMarcacion, fecha: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              etiqueta="Hora de Entrada"
              type="time"
              value={formMarcacion.hora_entrada}
              onChange={(e) => setFormMarcacion({ ...formMarcacion, hora_entrada: e.target.value })}
            />
            <Input
              etiqueta="Hora de Salida"
              type="time"
              value={formMarcacion.hora_salida}
              onChange={(e) => setFormMarcacion({ ...formMarcacion, hora_salida: e.target.value })}
            />
          </div>

          <Select
            etiqueta="Estado"
            value={formMarcacion.estado}
            onChange={(e) => setFormMarcacion({ ...formMarcacion, estado: e.target.value })}
            opciones={[
              { valor: 'Presente', texto: 'Presente (Jornada regular)' },
              { valor: 'Llegada tardía', texto: 'Llegada tardía' },
              { valor: 'Permiso', texto: 'Permiso justificado' },
              { valor: 'Ausente', texto: 'Ausente injustificado' },
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Observaciones</label>
            <textarea
              rows={2}
              value={formMarcacion.observaciones}
              onChange={(e) => setFormMarcacion({ ...formMarcacion, observaciones: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              placeholder="Motivo de retraso o detalle de la jornada..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Boton type="button" variante="fantasma" onClick={() => setModalRegistroAbierto(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario">
              Guardar Marcación
            </Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
