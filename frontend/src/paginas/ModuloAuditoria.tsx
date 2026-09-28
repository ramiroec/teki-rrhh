import React, { useEffect, useState } from 'react';
import { History, Search, Shield, Filter, Calendar } from 'lucide-react';
import { api } from '../servicios/api';
import { RegistroAuditoria } from '../tipos';
import { Tarjeta, TarjetaEncabezado, TarjetaCuerpo } from '../componentes/ui/Tarjeta';
import { Badge } from '../componentes/ui/Badge';
import { Input } from '../componentes/ui/Input';
import { Select } from '../componentes/ui/Select';
import { Tabla, ColumnaTabla } from '../componentes/ui/Tabla';

export const ModuloAuditoria: React.FC = () => {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [busquedaUsuario, setBusquedaUsuario] = useState('');

  const cargarAuditoria = async () => {
    setCargando(true);
    const res = await api.get<RegistroAuditoria[]>('/auditoria', {
      entidad: filtroEntidad || undefined,
      accion: filtroAccion || undefined,
      usuario: busquedaUsuario || undefined,
    });
    if (res.exito && res.datos) {
      setRegistros(res.datos);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarAuditoria();
  }, [filtroEntidad, filtroAccion, busquedaUsuario]);

  const columnas: ColumnaTabla<RegistroAuditoria>[] = [
    {
      clave: 'creado_en',
      encabezado: 'Fecha y Hora',
      render: (a) => (
        <span className="font-mono text-xs text-slate-700">
          {new Date(a.creado_en).toLocaleString('es-PY')}
        </span>
      ),
    },
    {
      clave: 'usuario_nombre',
      encabezado: 'Usuario Responsable',
      render: (a) => (
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-brand-600 shrink-0" />
          <span className="font-semibold text-slate-800">{a.usuario_nombre}</span>
        </div>
      ),
    },
    {
      clave: 'accion',
      encabezado: 'Acción Ejecutada',
      render: (a) => (
        <Badge
          variante={
            a.accion.includes('CREAC') || a.accion.includes('ALTA')
              ? 'exito'
              : a.accion.includes('BAJA') || a.accion.includes('RECHAZ')
              ? 'peligro'
              : a.accion.includes('APROB') || a.accion.includes('CONFIRM')
              ? 'marca'
              : 'alerta'
          }
        >
          {a.accion}
        </Badge>
      ),
    },
    {
      clave: 'entidad',
      encabezado: 'Entidad / Módulo',
      render: (a) => <span className="font-mono text-xs uppercase bg-slate-100 px-2 py-0.5 rounded">{a.entidad}</span>,
    },
    {
      clave: 'detalles',
      encabezado: 'Detalles / Información Relevante',
      render: (a) => {
        let texto = '';
        try {
          texto = typeof a.detalles === 'object' ? JSON.stringify(a.detalles) : String(a.detalles || '');
        } catch {
          texto = '-';
        }
        return <span className="text-xs text-slate-600 font-mono line-clamp-1">{texto}</span>;
      },
    },
    {
      clave: 'ip',
      encabezado: 'Dirección IP',
      render: (a) => <span className="font-mono text-[11px] text-slate-400">{a.ip || '127.0.0.1'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Logs de Auditoría y Trazabilidad
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Registro inmutable de acciones críticas realizadas en el sistema para cumplimiento y seguridad.
        </p>
      </div>

      {/* Filtros */}
      <Tarjeta>
        <TarjetaCuerpo className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Buscar por usuario..."
              value={busquedaUsuario}
              onChange={(e) => setBusquedaUsuario(e.target.value)}
              icono={<Search className="w-4 h-4" />}
            />
            <Select
              value={filtroEntidad}
              onChange={(e) => setFiltroEntidad(e.target.value)}
              opciones={[
                { valor: '', texto: 'Todas las entidades' },
                { valor: 'empleados', texto: 'Empleados' },
                { valor: 'solicitudes_vacaciones', texto: 'Vacaciones' },
                { valor: 'marcaciones', texto: 'Asistencia' },
                { valor: 'periodos_liquidacion', texto: 'Liquidaciones' },
                { valor: 'usuarios', texto: 'Usuarios' },
                { valor: 'empresas', texto: 'Configuración Empresa' },
              ]}
            />
            <Select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              opciones={[
                { valor: '', texto: 'Todas las acciones' },
                { valor: 'INICIO_SESION', texto: 'Inicios de sesión' },
                { valor: 'ALTA_EMPLEADO', texto: 'Altas de empleado' },
                { valor: 'BAJA_EMPLEADO', texto: 'Bajas de empleado' },
                { valor: 'APROBACION_VACACIONES', texto: 'Aprobaciones de vacaciones' },
                { valor: 'CALCULO_LIQUIDACION', texto: 'Cálculo de liquidaciones' },
                { valor: 'CONFIRMACION_LIQUIDACION', texto: 'Cierre de liquidaciones' },
              ]}
            />
          </div>
        </TarjetaCuerpo>
      </Tarjeta>

      {/* Tabla de Auditoría */}
      <Tabla
        columnas={columnas}
        datos={registros}
        cargando={cargando}
        mensajeVacio="No se encontraron eventos de auditoría"
      />
    </div>
  );
};
