import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calculator,
  Calendar,
  CheckCircle,
  Plus,
  Play,
  FileCheck2,
  DollarSign,
  AlertCircle,
  Edit3,
  Receipt,
  Users,
  Building,
} from 'lucide-react';
import { api } from '../servicios/api';
import { PeriodoLiquidacion, Liquidacion } from '../tipos';
import { useAutenticacion } from '../contexto/AutenticacionContexto';
import { useNotificaciones } from '../contexto/NotificacionesContexto';
import { Tarjeta, TarjetaEncabezado, TarjetaCuerpo } from '../componentes/ui/Tarjeta';
import { Boton } from '../componentes/ui/Boton';
import { Badge } from '../componentes/ui/Badge';
import { Input } from '../componentes/ui/Input';
import { Select } from '../componentes/ui/Select';
import { Tabla, ColumnaTabla } from '../componentes/ui/Tabla';
import { Modal } from '../componentes/ui/Modal';

export const ModuloLiquidaciones: React.FC = () => {
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const { usuario } = useAutenticacion();
  const { notificarExito, notificarError } = useNotificaciones();

  const [periodos, setPeriodos] = useState<PeriodoLiquidacion[]>([]);
  const [periodoActivo, setPeriodoActivo] = useState<PeriodoLiquidacion | null>(null);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [calculando, setCalculando] = useState(false);

  // Modales
  const [modalNuevoPeriodo, setModalNuevoPeriodo] = useState(ubicacion.pathname === '/liquidaciones/nueva');
  const [modalAjusteAbierto, setModalAjusteAbierto] = useState(false);
  const [modalConfirmarPeriodo, setModalConfirmarPeriodo] = useState(false);
  const [liquidacionAjuste, setLiquidacionAjuste] = useState<Liquidacion | null>(null);

  // Formulario nuevo periodo
  const [formPeriodo, setFormPeriodo] = useState({
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
  });

  // Formulario ajuste concepto
  const [formAjuste, setFormAjuste] = useState({
    monto_bonos: 0,
    monto_otros_haberes: 0,
    monto_otros_descuentos: 0,
    observaciones: '',
  });

  const cargarPeriodos = async () => {
    setCargando(true);
    const res = await api.get<PeriodoLiquidacion[]>('/liquidaciones/periodos');
    if (res.exito && res.datos) {
      setPeriodos(res.datos);
      if (res.datos.length > 0 && !periodoActivo) {
        seleccionarPeriodo(res.datos[0].id);
      }
    }
    setCargando(false);
  };

  const seleccionarPeriodo = async (periodoId: string) => {
    const res = await api.get<PeriodoLiquidacion>(`/liquidaciones/periodos/${periodoId}`);
    if (res.exito && res.datos) {
      setPeriodoActivo(res.datos);
      setLiquidaciones(res.datos.liquidaciones || []);
    }
  };

  useEffect(() => {
    cargarPeriodos();
  }, []);

  useEffect(() => {
    if (ubicacion.pathname === '/liquidaciones/nueva') {
      setModalNuevoPeriodo(true);
    }
  }, [ubicacion.pathname]);

  const cerrarModalNuevoPeriodo = () => {
    setModalNuevoPeriodo(false);
    if (ubicacion.pathname === '/liquidaciones/nueva') {
      navigate('/liquidaciones');
    }
  };

  const moneda = usuario?.empresa?.simboloMoneda || '₲';

  const formatearMonto = (num: number) => {
    return `${moneda} ${new Intl.NumberFormat('es-PY').format(num || 0)}`;
  };

  const manejarCrearPeriodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPeriodo.nombre || !formPeriodo.fecha_inicio || !formPeriodo.fecha_fin) {
      notificarError('Complete todos los campos del período.');
      return;
    }

    const res = await api.post('/liquidaciones/periodos', formPeriodo);
    if (res.exito && res.datos) {
      notificarExito('Período de liquidación creado exitosamente.');
      cerrarModalNuevoPeriodo();
      await cargarPeriodos();
      seleccionarPeriodo(res.datos.id);
    } else {
      notificarError(res.mensaje || 'Error al crear período.');
    }
  };

  const manejarCalcularLiquidaciones = async () => {
    if (!periodoActivo) return;
    setCalculando(true);
    const res = await api.post(`/liquidaciones/periodos/${periodoActivo.id}/calcular`, {});
    setCalculando(false);

    if (res.exito) {
      notificarExito(res.mensaje || 'Liquidación calculada correctamente.');
      await seleccionarPeriodo(periodoActivo.id);
      await cargarPeriodos();
    } else {
      notificarError(res.mensaje || 'Error al calcular liquidación.');
    }
  };

  const abrirAjuste = (liq: Liquidacion) => {
    setLiquidacionAjuste(liq);
    setFormAjuste({
      monto_bonos: Number(liq.monto_bonos) || 0,
      monto_otros_haberes: Number(liq.monto_otros_haberes) || 0,
      monto_otros_descuentos: Number(liq.monto_otros_descuentos) || 0,
      observaciones: liq.observaciones || '',
    });
    setModalAjusteAbierto(true);
  };

  const manejarGuardarAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liquidacionAjuste) return;

    const res = await api.put(`/liquidaciones/${liquidacionAjuste.id}`, formAjuste);
    if (res.exito) {
      notificarExito('Conceptos actualizados correctamente.');
      setModalAjusteAbierto(false);
      if (periodoActivo) seleccionarPeriodo(periodoActivo.id);
    } else {
      notificarError(res.mensaje || 'Error al guardar ajustes.');
    }
  };

  const manejarConfirmarPeriodo = async () => {
    if (!periodoActivo) return;
    const res = await api.post(`/liquidaciones/periodos/${periodoActivo.id}/confirmar`, {});
    if (res.exito) {
      notificarExito(res.mensaje || 'Período confirmado y recibos generados con éxito.');
      setModalConfirmarPeriodo(false);
      await seleccionarPeriodo(periodoActivo.id);
      await cargarPeriodos();
    } else {
      notificarError(res.mensaje || 'Error al confirmar período.');
    }
  };

  const columnas: ColumnaTabla<Liquidacion>[] = [
    {
      clave: 'colaborador',
      encabezado: 'Colaborador',
      render: (l) => (
        <div>
          <p className="font-semibold text-slate-800">
            {l.nombres} {l.apellidos}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            {l.empleado_codigo} &bull; {l.cargo_nombre || 'Colaborador'}
          </p>
        </div>
      ),
    },
    {
      clave: 'salario_base',
      encabezado: 'Salario Base',
      alineacion: 'derecha',
      render: (l) => <span className="font-medium text-slate-700">{formatearMonto(Number(l.salario_base))}</span>,
    },
    {
      clave: 'adicionales',
      encabezado: 'Extras + Bonos',
      alineacion: 'derecha',
      render: (l) => {
        const totalAdic = Number(l.monto_horas_extra) + Number(l.monto_bonos) + Number(l.monto_otros_haberes);
        return totalAdic > 0 ? (
          <span className="font-semibold text-emerald-600">+{formatearMonto(totalAdic)}</span>
        ) : (
          <span className="text-slate-400">-</span>
        );
      },
    },
    {
      clave: 'salario_bruto',
      encabezado: 'Salario Bruto',
      alineacion: 'derecha',
      render: (l) => <span className="font-semibold text-slate-900">{formatearMonto(Number(l.salario_bruto))}</span>,
    },
    {
      clave: 'ips_obrero',
      encabezado: 'IPS Obrero (9%)',
      alineacion: 'derecha',
      render: (l) => <span className="text-rose-600 font-medium">-{formatearMonto(Number(l.monto_ips_obrero))}</span>,
    },
    {
      clave: 'salario_neto',
      encabezado: 'Neto a Cobrar',
      alineacion: 'derecha',
      render: (l) => (
        <span className="font-bold text-sm text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md">
          {formatearMonto(Number(l.salario_neto))}
        </span>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alineacion: 'derecha',
      render: (l) => (
        <div className="flex items-center justify-end gap-1">
          {periodoActivo?.estado !== 'Confirmado' ? (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => abrirAjuste(l)}
              title="Ajustar Bonos o Deducciones"
            >
              <Edit3 className="w-4 h-4 text-brand-600" />
            </Boton>
          ) : (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => navigate('/recibos')}
              title="Ver Recibo Emitido"
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
            </Boton>
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
            Liquidación de Salarios
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cálculo mensual automatizado con reglas configurables, retenciones de IPS y emisión de recibos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Boton
            variante="esquema"
            onClick={() => setModalNuevoPeriodo(true)}
            icono={<Plus className="w-4 h-4" />}
          >
            Nuevo Período
          </Boton>
          {periodoActivo && periodoActivo.estado !== 'Confirmado' && (
            <Boton
              variante="primario"
              cargando={calculando}
              onClick={manejarCalcularLiquidaciones}
              icono={<Calculator className="w-4 h-4" />}
            >
              Calcular Liquidación
            </Boton>
          )}
        </div>
      </div>

      {/* Selector de Períodos Activos */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {periodos.map((p) => (
          <button
            key={p.id}
            onClick={() => seleccionarPeriodo(p.id)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 shrink-0 transition-all cursor-pointer ${
              periodoActivo?.id === p.id
                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{p.nombre}</span>
            <Badge tamano="sm" className="ml-1">
              {p.estado}
            </Badge>
          </button>
        ))}
      </div>

      {/* Resumen Pre-Confirmación del Período Seleccionado */}
      {periodoActivo && (
        <Tarjeta className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
          <TarjetaEncabezado
            titulo={
              <div className="flex items-center gap-2">
                <span>Resumen del Período: {periodoActivo.nombre}</span>
                <Badge>{periodoActivo.estado}</Badge>
              </div>
            }
            subtitulo={`Vigencia: ${new Date(periodoActivo.fecha_inicio).toLocaleDateString('es-PY')} al ${new Date(periodoActivo.fecha_fin).toLocaleDateString('es-PY')}`}
            accion={
              periodoActivo.estado === 'Calculado' && (
                <Boton
                  variante="primario"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setModalConfirmarPeriodo(true)}
                  icono={<FileCheck2 className="w-4 h-4" />}
                >
                  Confirmar Período y Emitir Recibos
                </Boton>
              )
            }
          />
          <TarjetaCuerpo className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Salario Bruto</p>
                <p className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {formatearMonto(Number(periodoActivo.total_bruto))}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Adicionales / Extras</p>
                <p className="text-base sm:text-lg font-bold text-emerald-600 mt-1">
                  +{formatearMonto(Number(periodoActivo.total_adicionales))}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Retención IPS (9%)</p>
                <p className="text-base sm:text-lg font-bold text-rose-600 mt-1">
                  -{formatearMonto(Number(periodoActivo.total_ips))}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Descuentos</p>
                <p className="text-base sm:text-lg font-bold text-rose-700 mt-1">
                  -{formatearMonto(Number(periodoActivo.total_descuentos))}
                </p>
              </div>

              <div className="p-3 bg-brand-50 rounded-xl border border-brand-200 shadow-2xs col-span-2 sm:col-span-1">
                <p className="text-[11px] font-semibold text-brand-700 uppercase tracking-wider">Masa Salarial Neta</p>
                <p className="text-base sm:text-lg font-black text-brand-900 mt-1">
                  {formatearMonto(Number(periodoActivo.total_neto))}
                </p>
              </div>
            </div>
          </TarjetaCuerpo>
        </Tarjeta>
      )}

      {/* Tabla de Liquidaciones Individuales */}
      <Tabla
        columnas={columnas}
        datos={liquidaciones}
        cargando={cargando}
        mensajeVacio="No hay liquidaciones calculadas para este período"
        subtituloVacio="Haga clic en 'Calcular Liquidación' para computar las nóminas con las reglas configuradas."
      />

      {/* MODAL: NUEVO PERIODO */}
      <Modal
        abierto={modalNuevoPeriodo}
        alCerrar={cerrarModalNuevoPeriodo}
        titulo="Crear Nuevo Período de Liquidación"
        subtitulo="Defina el mes y rango de fechas a liquidar"
        tamano="sm"
      >
        <form onSubmit={manejarCrearPeriodo} className="space-y-4">
          <Input
            etiqueta="Nombre del Período"
            required
            placeholder="Ej. Octubre 2026"
            value={formPeriodo.nombre}
            onChange={(e) => setFormPeriodo({ ...formPeriodo, nombre: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              etiqueta="Año"
              type="number"
              required
              value={formPeriodo.anio}
              onChange={(e) => setFormPeriodo({ ...formPeriodo, anio: parseInt(e.target.value, 10) })}
            />
            <Select
              etiqueta="Mes"
              value={formPeriodo.mes}
              onChange={(e) => setFormPeriodo({ ...formPeriodo, mes: parseInt(e.target.value, 10) })}
              opciones={[
                { valor: 1, texto: 'Enero' },
                { valor: 2, texto: 'Febrero' },
                { valor: 3, texto: 'Marzo' },
                { valor: 4, texto: 'Abril' },
                { valor: 5, texto: 'Mayo' },
                { valor: 6, texto: 'Junio' },
                { valor: 7, texto: 'Julio' },
                { valor: 8, texto: 'Agosto' },
                { valor: 9, texto: 'Septiembre' },
                { valor: 10, texto: 'Octubre' },
                { valor: 11, texto: 'Noviembre' },
                { valor: 12, texto: 'Diciembre' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              etiqueta="Fecha Inicio"
              type="date"
              required
              value={formPeriodo.fecha_inicio}
              onChange={(e) => setFormPeriodo({ ...formPeriodo, fecha_inicio: e.target.value })}
            />
            <Input
              etiqueta="Fecha Fin"
              type="date"
              required
              value={formPeriodo.fecha_fin}
              onChange={(e) => setFormPeriodo({ ...formPeriodo, fecha_fin: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Boton type="button" variante="fantasma" onClick={cerrarModalNuevoPeriodo}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario">
              Crear Período
            </Boton>
          </div>
        </form>
      </Modal>

      {/* MODAL: AJUSTE DE CONCEPTOS */}
      <Modal
        abierto={modalAjusteAbierto}
        alCerrar={() => setModalAjusteAbierto(false)}
        titulo="Ajuste Manual de Conceptos"
        subtitulo={`Colaborador: ${liquidacionAjuste?.nombres} ${liquidacionAjuste?.apellidos}`}
        tamano="sm"
      >
        <form onSubmit={manejarGuardarAjuste} className="space-y-4">
          <Input
            etiqueta={`Bono por Desempeño / Metas (${moneda})`}
            type="number"
            value={formAjuste.monto_bonos}
            onChange={(e) => setFormAjuste({ ...formAjuste, monto_bonos: Number(e.target.value) })}
          />
          <Input
            etiqueta={`Otros Haberes Adicionales (${moneda})`}
            type="number"
            value={formAjuste.monto_otros_haberes}
            onChange={(e) => setFormAjuste({ ...formAjuste, monto_otros_haberes: Number(e.target.value) })}
          />
          <Input
            etiqueta={`Otros Descuentos / Anticipos (${moneda})`}
            type="number"
            value={formAjuste.monto_otros_descuentos}
            onChange={(e) => setFormAjuste({ ...formAjuste, monto_otros_descuentos: Number(e.target.value) })}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Observación del Ajuste</label>
            <textarea
              rows={2}
              value={formAjuste.observaciones}
              onChange={(e) => setFormAjuste({ ...formAjuste, observaciones: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              placeholder="Justificación del bono o descuento aplicado..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Boton type="button" variante="fantasma" onClick={() => setModalAjusteAbierto(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario">
              Guardar y Recalcular
            </Boton>
          </div>
        </form>
      </Modal>

      {/* MODAL: CONFIRMAR PERIODO Y EMITIR RECIBOS */}
      <Modal
        abierto={modalConfirmarPeriodo}
        alCerrar={() => setModalConfirmarPeriodo(false)}
        titulo="¿Confirmar Período de Liquidación?"
        subtitulo="Esta acción cerrará el cálculo del período y generará automáticamente los recibos oficiales de salario."
        tamano="sm"
        pie={
          <>
            <Boton variante="fantasma" onClick={() => setModalConfirmarPeriodo(false)}>
              Revisar Más Tarde
            </Boton>
            <Boton
              variante="primario"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={manejarConfirmarPeriodo}
            >
              Sí, Confirmar y Emitir Recibos
            </Boton>
          </>
        }
      >
        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
          <p className="font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Cierre definitivo de período
          </p>
          <p className="text-slate-600 leading-relaxed">
            Se generarán los recibos numerados correlativamente para los {liquidaciones.length} colaboradores
            con cálculo de salario neto en letras aptos para firma e impresión.
          </p>
        </div>
      </Modal>
    </div>
  );
};
