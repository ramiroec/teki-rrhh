import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Palmtree,
  DollarSign,
  Cake,
  Award,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Calendar,
  Building,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../servicios/api';
import { useAutenticacion } from '../contexto/AutenticacionContexto';
import { Tarjeta, TarjetaEncabezado, TarjetaCuerpo } from '../componentes/ui/Tarjeta';
import { Boton } from '../componentes/ui/Boton';
import { Badge } from '../componentes/ui/Badge';
import { Skeleton } from '../componentes/ui/Skeleton';

const COLORES_GRAFICOS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const DashboardPrincipal: React.FC = () => {
  const navigate = useNavigate();
  const { usuario, esRRHH } = useAutenticacion();

  const [datosDashboard, setDatosDashboard] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);
    const res = await api.get('/reportes/dashboard');
    if (res.exito && res.datos) {
      setDatosDashboard(res.datos);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const moneda = usuario?.empresa?.simboloMoneda || '₲';

  const formatearMonto = (num: number) => {
    return `${moneda} ${new Intl.NumberFormat('es-PY').format(num || 0)}`;
  };

  if (cargando) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const {
    totales,
    asistenciaResumen,
    ausentesHoy = [],
    vacacionesPendientes = [],
    proximosCumpleanos = [],
    proximosAniversarios = [],
    distribucionSectores = [],
    distribucionContratos = [],
    evolucionEmpleados = [],
  } = datosDashboard || {};

  return (
    <div className="space-y-6">
      {/* Banner de bienvenida y accesos rápidos */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-700 rounded-2xl p-6 text-white shadow-elevation flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-semibold">
              Panel Principal
            </span>
            <span className="text-xs text-white/80">
              {new Date().toLocaleDateString('es-PY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            ¡Hola, {usuario?.nombre}!
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
            Bienvenido al sistema de RRHH de {usuario?.empresa?.nombre}. Aquí tienes el resumen actualizado de la jornada.
          </p>
        </div>

        {/* Accesos rápidos */}
        <div className="flex flex-wrap gap-2.5">
          {esRRHH && (
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() => navigate('/empleados')}
              icono={<UserPlus className="w-4 h-4 text-brand-600" />}
              className="bg-white text-brand-900 hover:bg-slate-50 font-semibold"
            >
              Nuevo Empleado
            </Boton>
          )}
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => navigate('/asistencia')}
            icono={<Clock className="w-4 h-4 text-brand-600" />}
            className="bg-white text-brand-900 hover:bg-slate-50 font-semibold"
          >
            Registrar Asistencia
          </Boton>
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => navigate('/vacaciones')}
            icono={<Palmtree className="w-4 h-4 text-brand-600" />}
            className="bg-white text-brand-900 hover:bg-slate-50 font-semibold"
          >
            Solicitar Vacaciones
          </Boton>
          {esRRHH && (
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() => navigate('/liquidaciones')}
              icono={<DollarSign className="w-4 h-4 text-brand-600" />}
              className="bg-white text-brand-900 hover:bg-slate-50 font-semibold"
            >
              Generar Liquidación
            </Boton>
          )}
        </div>
      </div>

      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Colaboradores */}
        <Tarjeta>
          <TarjetaCuerpo className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium text-slate-500">Colaboradores Activos</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {totales?.empleadosActivos ?? 0}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Total registrados: {totales?.totalEmpleados ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Nuevos Ingresos */}
        <Tarjeta>
          <TarjetaCuerpo className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium text-slate-500">Nuevos Ingresos (60d)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {totales?.nuevosIngresos ?? 0}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-brand-600" /> Crecimiento de equipo
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Vacaciones Pendientes */}
        <Tarjeta>
          <TarjetaCuerpo className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium text-slate-500">Vacaciones Pendientes</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {totales?.solicitudesVacacionesPendientes ?? 0}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                <Palmtree className="w-3.5 h-3.5 text-amber-500" /> Solicitudes por revisar
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Palmtree className="w-6 h-6" />
            </div>
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Horas Extra del Mes */}
        <Tarjeta>
          <TarjetaCuerpo className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium text-slate-500">Horas Extra (Últimos 30d)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {totales?.horasExtraMes ?? 0} hs
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Computadas con recargo
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </TarjetaCuerpo>
        </Tarjeta>
      </div>

      {/* Gráficos y Distribuciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución por Sector (Gráfico de Barras) */}
        <Tarjeta className="lg:col-span-2">
          <TarjetaEncabezado
            titulo="Colaboradores por Sector"
            subtitulo="Distribución de talento humano en las distintas áreas"
            icono={<Building className="w-5 h-5 text-brand-600" />}
            accion={
              <Boton
                variante="fantasma"
                tamano="sm"
                onClick={() => navigate('/empleados')}
                iconoDerecha={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Ver empleados
              </Boton>
            }
          />
          <TarjetaCuerpo>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribucionSectores} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="sector" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(valor) => [`${valor} personas`, 'Colaboradores']}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                    {distribucionSectores.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORES_GRAFICOS[index % COLORES_GRAFICOS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Tipos de Contrato (Gráfico de Dona) */}
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Tipos de Contrato"
            subtitulo="Modalidad de vinculación laboral"
          />
          <TarjetaCuerpo>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucionContratos}
                    dataKey="cantidad"
                    nameKey="tipo_contrato"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {distribucionContratos.map((_: any, index: number) => (
                      <Cell key={`cell-pie-${index}`} fill={COLORES_GRAFICOS[index % COLORES_GRAFICOS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(valor) => [`${valor} contratos`, 'Cantidad']}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {distribucionContratos.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORES_GRAFICOS[i % COLORES_GRAFICOS.length] }}
                    />
                    <span className="truncate max-w-[150px]">{item.tipo_contrato}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{item.cantidad}</span>
                </div>
              ))}
            </div>
          </TarjetaCuerpo>
        </Tarjeta>
      </div>

      {/* Sección Inferior: Cumpleaños, Aniversarios y Ausentes Hoy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ausentes y Licencias Hoy */}
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Ausencias / Licencias Hoy"
            subtitulo={`${ausentesHoy.length} personas no disponibles hoy`}
            icono={<AlertCircle className="w-5 h-5 text-amber-500" />}
          />
          <TarjetaCuerpo className="p-4 space-y-3">
            {ausentesHoy.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No se registran ausencias en la fecha.
              </p>
            ) : (
              ausentesHoy.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={a.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${a.nombres}`}
                      alt={a.nombres}
                      className="w-8 h-8 rounded-full border object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {a.nombres} {a.apellidos}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{a.observaciones || 'Sin observaciones'}</p>
                    </div>
                  </div>
                  <Badge tamano="sm">{a.estado}</Badge>
                </div>
              ))
            )}
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Próximos Cumpleaños */}
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Próximos Cumpleaños"
            subtitulo="Celebraciones en las próximas semanas"
            icono={<Cake className="w-5 h-5 text-rose-500" />}
          />
          <TarjetaCuerpo className="p-4 space-y-3">
            {proximosCumpleanos.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No hay cumpleaños próximos en este periodo.
              </p>
            ) : (
              proximosCumpleanos.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
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
                      <p className="text-[11px] text-rose-600 font-medium">{c.fecha_cumple_formato}</p>
                    </div>
                  </div>
                  <span className="text-sm">🎂</span>
                </div>
              ))
            )}
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Próximos Aniversarios Laborales */}
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Aniversarios Laborales"
            subtitulo="Reconocimiento por trayectoria en TEKI"
            icono={<Award className="w-5 h-5 text-amber-500" />}
          />
          <TarjetaCuerpo className="p-4 space-y-3">
            {proximosAniversarios.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No hay aniversarios registrados en estas fechas.
              </p>
            ) : (
              proximosAniversarios.map((an: any) => (
                <div key={an.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={an.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${an.nombres}`}
                      alt={an.nombres}
                      className="w-8 h-8 rounded-full border object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {an.nombres} {an.apellidos}
                      </p>
                      <p className="text-[11px] text-slate-500">Ingreso: {an.fecha_ingreso_formato}</p>
                    </div>
                  </div>
                  <Badge variante="marca" tamano="sm">
                    {an.anios_cumplidos} {an.anios_cumplidos === 1 ? 'año' : 'años'}
                  </Badge>
                </div>
              ))
            )}
          </TarjetaCuerpo>
        </Tarjeta>
      </div>

      {/* Solicitudes de vacaciones pendientes de aprobación */}
      {esRRHH && vacacionesPendientes.length > 0 && (
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Solicitudes de Vacaciones Pendientes de Aprobación"
            subtitulo="Requieren resolución de Gestión Humana"
            icono={<Palmtree className="w-5 h-5 text-brand-600" />}
            accion={
              <Boton
                variante="esquema"
                tamano="sm"
                onClick={() => navigate('/vacaciones')}
                iconoDerecha={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Gestionar todas
              </Boton>
            }
          />
          <TarjetaCuerpo className="p-0">
            <div className="divide-y divide-slate-100">
              {vacacionesPendientes.map((v: any) => (
                <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={v.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${v.nombres}`}
                      alt={v.nombres}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {v.nombres} {v.apellidos} <span className="text-slate-400 font-normal">({v.sector_nombre || 'General'})</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Del {new Date(v.fecha_inicio).toLocaleDateString('es-PY')} al {new Date(v.fecha_fin).toLocaleDateString('es-PY')} &bull;{' '}
                        <span className="font-semibold text-brand-700">{v.dias_solicitados} días hábiles</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Boton
                      variante="esquema"
                      tamano="sm"
                      onClick={() => navigate('/vacaciones')}
                    >
                      Revisar Solicitud
                    </Boton>
                  </div>
                </div>
              ))}
            </div>
          </TarjetaCuerpo>
        </Tarjeta>
      )}
    </div>
  );
};
