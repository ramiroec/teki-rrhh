import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  AlertCircle,
  Building,
  ArrowUpRight,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../servicios/api';
import { useAutenticacion } from '../contexto/AutenticacionContexto';
import { Tarjeta, TarjetaEncabezado, TarjetaCuerpo } from '../componentes/ui/Tarjeta';
import { Skeleton } from '../componentes/ui/Skeleton';

export const ModuloPanelRRHH: React.FC = () => {
  const { usuario } = useAutenticacion();
  const [datos, setDatos] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const cargarPanel = async () => {
    setCargando(true);
    const res = await api.get('/reportes/panel-rrhh');
    if (res.exito && res.datos) {
      setDatos(res.datos);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarPanel();
  }, []);

  const moneda = usuario?.empresa?.simboloMoneda || '₲';

  const formatearMonto = (num: number) => {
    return `${moneda} ${new Intl.NumberFormat('es-PY').format(num || 0)}`;
  };

  if (cargando) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const { metricas = {}, masaPorSector = [], historicoLiquidaciones = [] } = datos || {};

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Panel Estratégico de Recursos Humanos
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Indicadores avanzados de capital humano, masa salarial y rotación de personal.
        </p>
      </div>

      {/* KPIs Estratégicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tarjeta>
          <TarjetaCuerpo className="p-5">
            <p className="text-xs font-medium text-slate-500">Masa Salarial Promedio</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              {formatearMonto(Number(metricas.salario_promedio))}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Por colaborador activo</p>
          </TarjetaCuerpo>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCuerpo className="p-5">
            <p className="text-xs font-medium text-slate-500">Antigüedad Promedio</p>
            <h3 className="text-xl font-bold text-brand-600 mt-1">
              {Number(metricas.antiguedad_promedio || 0).toFixed(1)} años
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Estabilidad y retención</p>
          </TarjetaCuerpo>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCuerpo className="p-5">
            <p className="text-xs font-medium text-slate-500">Rango Salarial (Min - Max)</p>
            <h3 className="text-sm font-bold text-slate-800 mt-1 truncate">
              {formatearMonto(Number(metricas.salario_minimo))} &bull; {formatearMonto(Number(metricas.salario_maximo))}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Brecha salarial corporativa</p>
          </TarjetaCuerpo>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCuerpo className="p-5">
            <p className="text-xs font-medium text-slate-500">Tasa de Retención</p>
            <h3 className="text-xl font-bold text-emerald-600 mt-1">
              {metricas.total_empleados > 0
                ? `${Math.round(((metricas.activos || 0) / metricas.total_empleados) * 100)}%`
                : '100%'}
            </h3>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Baja rotación de personal</p>
          </TarjetaCuerpo>
        </Tarjeta>
      </div>

      {/* Gráfico: Masa Salarial por Sector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Masa Salarial por Sector"
            subtitulo="Inversión en compensaciones distribuida por departamento"
            icono={<DollarSign className="w-5 h-5 text-brand-600" />}
          />
          <TarjetaCuerpo>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={masaPorSector} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="sector" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    formatter={(valor: any) => [formatearMonto(Number(valor)), 'Masa Salarial']}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="masa_salarial" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Gráfico: Evolución Histórica de Liquidaciones */}
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Evolución Histórica de Liquidaciones"
            subtitulo="Comparativa mensual de montos brutos, deducciones e IPS"
            icono={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          />
          <TarjetaCuerpo>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicoLiquidaciones.slice().reverse()} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(valor: any) => [formatearMonto(Number(valor)), '']}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="total_bruto" name="Bruto" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="total_neto" name="Neto Percibido" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="total_ips" name="Aporte IPS" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TarjetaCuerpo>
        </Tarjeta>
      </div>

      {/* Tabla Resumen de Sectores y Salarios */}
      <Tarjeta>
        <TarjetaEncabezado
          titulo="Desglose por Sector y Dotación"
          subtitulo="Consolidado de plazas ocupadas y salarios medios"
          icono={<Building className="w-5 h-5 text-brand-600" />}
        />
        <TarjetaCuerpo className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4 text-center">Colaboradores</th>
                  <th className="py-3 px-4 text-right">Salario Promedio</th>
                  <th className="py-3 px-4 text-right">Total Masa Salarial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {masaPorSector.map((m: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{m.sector}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {m.cantidad_empleados} personas
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatearMonto(Number(m.salario_promedio))}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatearMonto(Number(m.masa_salarial))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TarjetaCuerpo>
      </Tarjeta>
    </div>
  );
};
