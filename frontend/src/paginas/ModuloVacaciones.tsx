import React, { useEffect, useState } from 'react';
import {
  Palmtree,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  AlertTriangle,
  User,
  Info,
} from 'lucide-react';
import { api } from '../servicios/api';
import { SolicitudVacacion, SaldoVacaciones, Empleado } from '../tipos';
import { useAutenticacion } from '../contexto/AutenticacionContexto';
import { useNotificaciones } from '../contexto/NotificacionesContexto';
import { Tarjeta, TarjetaEncabezado, TarjetaCuerpo } from '../componentes/ui/Tarjeta';
import { Boton } from '../componentes/ui/Boton';
import { Badge } from '../componentes/ui/Badge';
import { Input } from '../componentes/ui/Input';
import { Select } from '../componentes/ui/Select';
import { Tabla, ColumnaTabla } from '../componentes/ui/Tabla';
import { Modal } from '../componentes/ui/Modal';

export const ModuloVacaciones: React.FC = () => {
  const { usuario, esRRHH, esColaborador } = useAutenticacion();
  const { notificarExito, notificarError } = useNotificaciones();

  const [solicitudes, setSolicitudes] = useState<SolicitudVacacion[]>([]);
  const [saldo, setSaldo] = useState<SaldoVacaciones | null>(null);
  const [calendario, setCalendario] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  // Modales
  const [modalSolicitudAbierto, setModalSolicitudAbierto] = useState(false);
  const [modalResolucionAbierto, setModalResolucionAbierto] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudVacacion | null>(null);
  const [resolucionEstado, setResolucionEstado] = useState<'Aprobada' | 'Rechazada'>('Aprobada');
  const [respuestaMotivo, setRespuestaMotivo] = useState('');

  // Formulario de nueva solicitud
  const [formSolicitud, setFormSolicitud] = useState({
    empleado_id: usuario?.empleadoId || '',
    fecha_inicio: '',
    fecha_fin: '',
    dias_solicitados: 5,
    motivo: '',
  });

  const cargarDatos = async () => {
    setCargando(true);
    const [resSol, resSaldo, resCal, resEmp] = await Promise.all([
      api.get<SolicitudVacacion[]>('/vacaciones/solicitudes', {
        estado: filtroEstado || undefined,
        empleadoId: esColaborador ? usuario?.empleadoId : undefined,
      }),
      api.get<SaldoVacaciones>('/vacaciones/saldo', {
        empleadoId: usuario?.empleadoId || undefined,
      }),
      api.get('/vacaciones/calendario'),
      esRRHH ? api.get<Empleado[]>('/empleados', { estado: 'Activo' }) : Promise.resolve({ exito: true, datos: [] }),
    ]);

    if (resSol.exito && resSol.datos) setSolicitudes(resSol.datos);
    if (resSaldo.exito && resSaldo.datos) setSaldo(resSaldo.datos);
    if (resCal.exito && resCal.datos) setCalendario(resCal.datos);
    if (resEmp.exito && resEmp.datos) setEmpleados(resEmp.datos);

    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado]);

  // Cálculo automático de días según fechas seleccionadas
  useEffect(() => {
    if (formSolicitud.fecha_inicio && formSolicitud.fecha_fin) {
      const f1 = new Date(formSolicitud.fecha_inicio);
      const f2 = new Date(formSolicitud.fecha_fin);
      if (f2 >= f1) {
        let diasHabiles = 0;
        const cur = new Date(f1);
        while (cur <= f2) {
          const diaSemana = cur.getDay();
          if (diaSemana !== 0 && diaSemana !== 6) {
            diasHabiles++;
          }
          cur.setDate(cur.getDate() + 1);
        }
        setFormSolicitud((prev) => ({ ...prev, dias_solicitados: Math.max(1, diasHabiles) }));
      }
    }
  }, [formSolicitud.fecha_inicio, formSolicitud.fecha_fin]);

  const manejarCrearSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSolicitud.fecha_inicio || !formSolicitud.fecha_fin) {
      notificarError('Por favor seleccione las fechas de inicio y fin.');
      return;
    }

    const empId = esColaborador ? usuario?.empleadoId : (formSolicitud.empleado_id || usuario?.empleadoId);

    const res = await api.post('/vacaciones/solicitudes', {
      ...formSolicitud,
      empleado_id: empId,
    });

    if (res.exito) {
      notificarExito('Solicitud de vacaciones registrada con éxito.');
      setModalSolicitudAbierto(false);
      setFormSolicitud({
        empleado_id: usuario?.empleadoId || '',
        fecha_inicio: '',
        fecha_fin: '',
        dias_solicitados: 5,
        motivo: '',
      });
      cargarDatos();
    } else {
      notificarError(res.mensaje || 'Error al enviar solicitud.');
    }
  };

  const manejarResolverSolicitud = async () => {
    if (!solicitudSeleccionada) return;
    const res = await api.patch(`/vacaciones/solicitudes/${solicitudSeleccionada.id}/responder`, {
      estado: resolucionEstado,
      respuesta_motivo: respuestaMotivo,
    });

    if (res.exito) {
      notificarExito(`Solicitud ${resolucionEstado.toLowerCase()} exitosamente.`);
      setModalResolucionAbierto(false);
      setRespuestaMotivo('');
      cargarDatos();
    } else {
      notificarError(res.mensaje || 'Error al responder solicitud.');
    }
  };

  const manejarCancelarSolicitud = async (solicitudId: string) => {
    if (!window.confirm('¿Está seguro de que desea cancelar esta solicitud de vacaciones?')) {
      return;
    }
    const res = await api.patch(`/vacaciones/solicitudes/${solicitudId}/cancelar`, {
      motivo: 'Cancelada por solicitud del usuario',
    });

    if (res.exito) {
      notificarExito('Solicitud de vacaciones cancelada exitosamente.');
      cargarDatos();
    } else {
      notificarError(res.mensaje || 'No pudimos cancelar la solicitud.');
    }
  };

  const columnas: ColumnaTabla<SolicitudVacacion>[] = [
    {
      clave: 'colaborador',
      encabezado: 'Colaborador',
      render: (v) => (
        <div className="flex items-center gap-2.5">
          <img
            src={v.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${v.nombres}`}
            alt={v.nombres}
            className="w-8 h-8 rounded-full border object-cover shrink-0"
          />
          <div>
            <p className="font-semibold text-slate-800">
              {v.nombres} {v.apellidos}
            </p>
            <p className="text-[11px] text-slate-500">{v.sector_nombre || 'General'}</p>
          </div>
        </div>
      ),
    },
    {
      clave: 'periodo',
      encabezado: 'Período Solicitado',
      render: (v) => (
        <div>
          <p className="font-medium text-slate-800">
            {new Date(v.fecha_inicio).toLocaleDateString('es-PY')} al {new Date(v.fecha_fin).toLocaleDateString('es-PY')}
          </p>
          <p className="text-[11px] text-slate-500">
            Reincorporación: {new Date(v.fecha_reincorporacion).toLocaleDateString('es-PY')}
          </p>
        </div>
      ),
    },
    {
      clave: 'dias_solicitados',
      encabezado: 'Días Hábiles',
      alineacion: 'centro',
      render: (v) => <span className="font-bold text-slate-900">{v.dias_solicitados} días</span>,
    },
    {
      clave: 'motivo',
      encabezado: 'Motivo / Comentarios',
      render: (v) => <span className="text-xs text-slate-600 line-clamp-1">{v.motivo || 'Licencia reglamentaria'}</span>,
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      alineacion: 'centro',
      render: (v) => <Badge>{v.estado}</Badge>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alineacion: 'derecha',
      render: (v) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {esRRHH && v.estado === 'Pendiente' && (
            <Boton
              variante="primario"
              tamano="sm"
              onClick={() => {
                setSolicitudSeleccionada(v);
                setResolucionEstado('Aprobada');
                setModalResolucionAbierto(true);
              }}
            >
              Resolver
            </Boton>
          )}

          {v.estado === 'Pendiente' && (esRRHH || v.empleado_id === usuario?.empleadoId) && (
            <Boton
              variante="peligro"
              tamano="sm"
              onClick={() => manejarCancelarSolicitud(v.id)}
            >
              Cancelar
            </Boton>
          )}

          {v.estado !== 'Pendiente' && (
            <span className="text-xs text-slate-400">
              {v.aprobado_por_nombre ? `Por: ${v.aprobado_por_nombre}` : '-'}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Gestión de Vacaciones
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cálculo de saldos por antigüedad, solicitudes en línea y calendario de ausencias.
          </p>
        </div>
        <Boton
          variante="primario"
          onClick={() => setModalSolicitudAbierto(true)}
          icono={<Plus className="w-4 h-4" />}
        >
          Solicitar Vacaciones
        </Boton>
      </div>

      {/* Tarjetas de Saldo de Vacaciones */}
      {saldo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Tarjeta>
            <TarjetaCuerpo className="p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">Antigüedad</p>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {saldo.antiguedadAnios} {saldo.antiguedadAnios === 1 ? 'año' : 'años'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Desde {new Date(saldo.fechaIngreso).toLocaleDateString('es-PY')}</p>
            </TarjetaCuerpo>
          </Tarjeta>

          <Tarjeta>
            <TarjetaCuerpo className="p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">Días Totales Anuales</p>
              <p className="text-xl font-bold text-indigo-600 mt-1">{saldo.diasCorrespondientes} días</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Por escala laboral</p>
            </TarjetaCuerpo>
          </Tarjeta>

          <Tarjeta>
            <TarjetaCuerpo className="p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">Días Utilizados / Solicitados</p>
              <p className="text-xl font-bold text-amber-600 mt-1">
                {saldo.diasUtilizados + saldo.diasPendientes} días
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{saldo.diasPendientes} en revisión</p>
            </TarjetaCuerpo>
          </Tarjeta>

          <Tarjeta className="bg-emerald-50/50 border-emerald-200">
            <TarjetaCuerpo className="p-4 text-center">
              <p className="text-xs text-emerald-700 font-semibold">Saldo Disponible</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{saldo.diasDisponibles} días</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Listos para solicitar</p>
            </TarjetaCuerpo>
          </Tarjeta>
        </div>
      )}

      {/* Calendario Resumen de Quién Está o Estará de Vacaciones */}
      <Tarjeta>
        <TarjetaEncabezado
          titulo="Calendario de Vacaciones y Ausencias Programadas"
          subtitulo="Detección de solapamiento de fechas y planificación de equipos"
          icono={<Calendar className="w-5 h-5 text-brand-600" />}
        />
        <TarjetaCuerpo className="p-4">
          {calendario.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No hay vacaciones agendadas en este período.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {calendario.map((c) => (
                <div key={c.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={c.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.nombres}`}
                      alt={c.nombres}
                      className="w-8 h-8 rounded-full border object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {c.nombres} {c.apellidos}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {new Date(c.fecha_inicio).toLocaleDateString('es-PY')} &rarr; {new Date(c.fecha_fin).toLocaleDateString('es-PY')}
                      </p>
                    </div>
                  </div>
                  <Badge tamano="sm">{c.estado}</Badge>
                </div>
              ))}
            </div>
          )}
        </TarjetaCuerpo>
      </Tarjeta>

      {/* Filtros de Solicitudes */}
      <Tarjeta>
        <TarjetaCuerpo className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex gap-2 w-full sm:w-auto">
            {['', 'Pendiente', 'Aprobada', 'Rechazada'].map((est) => (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filtroEstado === est
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {est === '' ? 'Todas' : est}
              </button>
            ))}
          </div>
        </TarjetaCuerpo>
      </Tarjeta>

      {/* Tabla de Solicitudes */}
      <Tabla
        columnas={columnas}
        datos={solicitudes}
        cargando={cargando}
        mensajeVacio="No hay solicitudes para mostrar"
        subtituloVacio="Inicie una solicitud utilizando el botón de arriba."
      />

      {/* MODAL: SOLICITAR VACACIONES */}
      <Modal
        abierto={modalSolicitudAbierto}
        alCerrar={() => setModalSolicitudAbierto(false)}
        titulo="Solicitud de Vacaciones"
        subtitulo="Seleccione el rango de fechas deseadas para su descanso anual"
        tamano="md"
      >
        <form onSubmit={manejarCrearSolicitud} className="space-y-4">
          {esRRHH && (
            <Select
              etiqueta="Colaborador Solicitante"
              required
              value={formSolicitud.empleado_id}
              onChange={(e) => setFormSolicitud({ ...formSolicitud, empleado_id: e.target.value })}
              opciones={[
                { valor: '', texto: 'Seleccione colaborador' },
                ...empleados.map((e) => ({ valor: e.id, texto: `${e.nombres} ${e.apellidos}` })),
              ]}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              etiqueta="Fecha de Inicio"
              type="date"
              required
              value={formSolicitud.fecha_inicio}
              onChange={(e) => setFormSolicitud({ ...formSolicitud, fecha_inicio: e.target.value })}
            />
            <Input
              etiqueta="Fecha de Fin"
              type="date"
              required
              value={formSolicitud.fecha_fin}
              onChange={(e) => setFormSolicitud({ ...formSolicitud, fecha_fin: e.target.value })}
            />
          </div>

          <div className="p-3 bg-brand-50/70 border border-brand-100 rounded-xl text-xs text-brand-900 flex items-center justify-between">
            <span className="font-medium">Total de días hábiles calculados:</span>
            <span className="text-base font-bold text-brand-700">{formSolicitud.dias_solicitados} días</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Motivo / Notas</label>
            <textarea
              rows={2}
              value={formSolicitud.motivo}
              onChange={(e) => setFormSolicitud({ ...formSolicitud, motivo: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              placeholder="Ej. Vacaciones anuales reglamentarias de verano..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Boton type="button" variante="fantasma" onClick={() => setModalSolicitudAbierto(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario">
              Enviar Solicitud
            </Boton>
          </div>
        </form>
      </Modal>

      {/* MODAL: RESOLVER SOLICITUD (RRHH/ADMIN) */}
      <Modal
        abierto={modalResolucionAbierto}
        alCerrar={() => setModalResolucionAbierto(false)}
        titulo="Resolver Solicitud de Vacaciones"
        subtitulo={`Solicitante: ${solicitudSeleccionada?.nombres} ${solicitudSeleccionada?.apellidos} (${solicitudSeleccionada?.dias_solicitados} días)`}
        tamano="sm"
        pie={
          <>
            <Boton variante="fantasma" onClick={() => setModalResolucionAbierto(false)}>
              Cancelar
            </Boton>
            <Boton
              variante={resolucionEstado === 'Aprobada' ? 'primario' : 'peligro'}
              onClick={manejarResolverSolicitud}
            >
              Confirmar {resolucionEstado}
            </Boton>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            etiqueta="Resolución"
            value={resolucionEstado}
            onChange={(e) => setResolucionEstado(e.target.value as any)}
            opciones={[
              { valor: 'Aprobada', texto: 'Aprobar Solicitud' },
              { valor: 'Rechazada', texto: 'Rechazar Solicitud' },
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Comentarios de respuesta</label>
            <textarea
              rows={3}
              value={respuestaMotivo}
              onChange={(e) => setRespuestaMotivo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              placeholder="Indique la justificación o condiciones de aprobación..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
