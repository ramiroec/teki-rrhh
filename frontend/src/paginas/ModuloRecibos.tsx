import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Eye,
  Calendar,
  Building,
  User,
  DollarSign,
  Download,
} from 'lucide-react';
import { api } from '../servicios/api';
import { Recibo } from '../tipos';
import { useAutenticacion } from '../contexto/AutenticacionContexto';
import { Tarjeta, TarjetaEncabezado, TarjetaCuerpo } from '../componentes/ui/Tarjeta';
import { Boton } from '../componentes/ui/Boton';
import { Badge } from '../componentes/ui/Badge';
import { Input } from '../componentes/ui/Input';
import { Tabla, ColumnaTabla } from '../componentes/ui/Tabla';
import { Modal } from '../componentes/ui/Modal';

export const ModuloRecibos: React.FC = () => {
  const { usuario, esColaborador } = useAutenticacion();

  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');

  // Modal para ver e imprimir recibo completo
  const [reciboSeleccionado, setReciboSeleccionado] = useState<Recibo | null>(null);
  const [modalImprimirAbierto, setModalImprimirAbierto] = useState(false);

  const cargarRecibos = async () => {
    setCargando(true);
    const res = await api.get<Recibo[]>('/recibos', {
      busqueda,
      periodo: filtroPeriodo,
      empleadoId: esColaborador ? usuario?.empleadoId : undefined,
    });
    if (res.exito && res.datos) {
      setRecibos(res.datos);
    }
    setCargando(false);
  };

  const verReciboDetalle = async (id: string) => {
    const res = await api.get<Recibo>(`/recibos/${id}`);
    if (res.exito && res.datos) {
      setReciboSeleccionado(res.datos);
      setModalImprimirAbierto(true);
    }
  };

  useEffect(() => {
    cargarRecibos();
  }, [busqueda, filtroPeriodo]);

  const moneda = usuario?.empresa?.simboloMoneda || '₲';

  const formatearMonto = (num: number) => {
    return `${moneda} ${new Intl.NumberFormat('es-PY').format(num || 0)}`;
  };

  const imprimirRecibo = () => {
    window.print();
  };

  const columnas: ColumnaTabla<Recibo>[] = [
    {
      clave: 'numero_recibo',
      encabezado: 'N° Recibo',
      render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.numero_recibo}</span>,
    },
    {
      clave: 'empleado',
      encabezado: 'Colaborador',
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-800">
            {r.nombres} {r.apellidos}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">C.I.: {r.documento}</p>
        </div>
      ),
    },
    {
      clave: 'periodo_nombre',
      encabezado: 'Período',
      render: (r) => <span className="font-medium text-slate-700">{r.periodo_nombre}</span>,
    },
    {
      clave: 'fecha_emision',
      encabezado: 'Fecha Emisión',
      render: (r) => (
        <span className="text-xs text-slate-600">
          {new Date(r.fecha_emision).toLocaleDateString('es-PY')}
        </span>
      ),
    },
    {
      clave: 'salario_bruto',
      encabezado: 'Salario Bruto',
      alineacion: 'derecha',
      render: (r) => <span className="text-xs text-slate-600">{formatearMonto(Number(r.salario_bruto))}</span>,
    },
    {
      clave: 'salario_neto',
      encabezado: 'Neto Cobrado',
      alineacion: 'derecha',
      render: (r) => (
        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
          {formatearMonto(Number(r.salario_neto))}
        </span>
      ),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      alineacion: 'centro',
      render: (r) => <Badge>{r.estado}</Badge>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alineacion: 'derecha',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Boton
            variante="fantasma"
            tamano="sm"
            onClick={() => verReciboDetalle(r.id)}
            title="Ver e Imprimir Recibo"
          >
            <Printer className="w-4 h-4 text-brand-600" />
          </Boton>
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
            Recibos de Salario
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Consulta y emisión de comprobantes oficiales de pago de remuneraciones.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Tarjeta>
        <TarjetaCuerpo className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Buscar por colaborador, documento o número de recibo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                icono={<Search className="w-4 h-4" />}
              />
            </div>
            <Input
              placeholder="Filtrar por período (ej. Agosto 2026)..."
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              icono={<Calendar className="w-4 h-4" />}
            />
          </div>
        </TarjetaCuerpo>
      </Tarjeta>

      {/* Tabla de Recibos */}
      <Tabla
        columnas={columnas}
        datos={recibos}
        cargando={cargando}
        alHacerClicFila={(r) => verReciboDetalle(r.id)}
        mensajeVacio="No se encontraron recibos de salario"
        subtituloVacio="Los recibos se generan automáticamente al confirmar un período en el módulo de Liquidaciones."
      />

      {/* MODAL DE RECIBO PROFESIONAL APTO PARA IMPRESIÓN */}
      <Modal
        abierto={modalImprimirAbierto}
        alCerrar={() => setModalImprimirAbierto(false)}
        titulo="Comprobante Oficial de Salario"
        tamano="xl"
        pie={
          <div className="flex items-center justify-between w-full no-imprimir">
            <p className="text-xs text-slate-500">
              Documento digital con validez de liquidación laboral.
            </p>
            <div className="flex items-center gap-2">
              <Boton variante="fantasma" onClick={() => setModalImprimirAbierto(false)}>
                Cerrar
              </Boton>
              <Boton variante="primario" onClick={imprimirRecibo} icono={<Printer className="w-4 h-4" />}>
                Imprimir / Guardar PDF
              </Boton>
            </div>
          </div>
        }
      >
        {reciboSeleccionado && (
          <div id="recibo-imprimible" className="bg-white p-6 rounded-xl text-slate-800 space-y-6 font-sans">
            {/* Cabecera del Recibo */}
            <div className="flex flex-col sm:flex-row justify-between items-start pb-4 border-b-2 border-slate-900 gap-4">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900">
                  {reciboSeleccionado.empresa_nombre || usuario?.empresa?.nombre}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  RUC: <span className="font-semibold text-slate-800">{reciboSeleccionado.empresa_ruc || usuario?.empresa?.ruc}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {reciboSeleccionado.empresa_direccion || 'Avda. Santa Teresa 2106'} &bull; {reciboSeleccionado.empresa_ciudad || 'Asunción'}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded border border-slate-300">
                  {reciboSeleccionado.numero_recibo}
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-1.5">
                  Período: <span className="font-bold text-brand-700">{reciboSeleccionado.periodo_nombre}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Fecha de emisión: {new Date(reciboSeleccionado.fecha_emision).toLocaleDateString('es-PY')}
                </p>
              </div>
            </div>

            {/* Datos del Trabajador */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-lg text-xs border border-slate-200">
              <div>
                <p className="text-slate-500 text-[11px]">Colaborador</p>
                <p className="font-bold text-slate-900">
                  {reciboSeleccionado.empleado_nombres} {reciboSeleccionado.empleado_apellidos}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Cédula / Documento</p>
                <p className="font-mono font-semibold text-slate-900">{reciboSeleccionado.empleado_documento}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Cargo / Sector</p>
                <p className="font-medium text-slate-800">{reciboSeleccionado.cargo_nombre || 'Especialista'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Días Trabajados</p>
                <p className="font-semibold text-slate-800">{reciboSeleccionado.dias_trabajados ?? 30} días</p>
              </div>
            </div>

            {/* Tabla de Conceptos (Haberes y Deducciones) */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Concepto</th>
                    <th className="py-2.5 px-3 text-center">Unidad / %</th>
                    <th className="py-2.5 px-3 text-right">Haberes ({moneda})</th>
                    <th className="py-2.5 px-3 text-right">Deducciones ({moneda})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reciboSeleccionado.detalles && reciboSeleccionado.detalles.length > 0 ? (
                    reciboSeleccionado.detalles.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-800 font-medium">{d.concepto}</td>
                        <td className="py-2 px-3 text-center text-slate-500">
                          {d.porcentaje ? `${d.porcentaje}%` : d.cantidad ? `${d.cantidad}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-800">
                          {d.tipo === 'HABER' ? formatearMonto(Number(d.monto)) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-rose-700">
                          {d.tipo === 'DEDUCCION' ? formatearMonto(Number(d.monto)) : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2 px-3 text-slate-800 font-medium">Salario Base Mensual</td>
                      <td className="py-2 px-3 text-center text-slate-500">30 d</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800">
                        {formatearMonto(Number(reciboSeleccionado.salario_bruto))}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">-</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      Totales
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900">
                      {formatearMonto(Number(reciboSeleccionado.salario_bruto))}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-700">
                      -{formatearMonto(Number(reciboSeleccionado.total_descuentos))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Total Neto a Cobrar y Neto en Letras */}
            <div className="p-4 bg-brand-50/60 rounded-xl border border-brand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase text-brand-900 tracking-wider">
                  Neto a Cobrar en Letras:
                </p>
                <p className="text-xs font-semibold text-brand-800 italic mt-0.5">
                  {reciboSeleccionado.salario_neto_letras || 'Suma convenida en moneda de curso legal'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Líquido Percibido</p>
                <p className="text-xl font-black text-brand-900">
                  {formatearMonto(Number(reciboSeleccionado.salario_neto))}
                </p>
              </div>
            </div>

            {/* Firmas de Conformidad */}
            <div className="grid grid-cols-2 gap-10 pt-10 text-center text-xs text-slate-500">
              <div className="border-t border-slate-300 pt-2">
                <p className="font-semibold text-slate-800">Firma del Empleador / RRHH</p>
                <p className="text-[10px] text-slate-400">Por la Empresa</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <p className="font-semibold text-slate-800">Firma del Colaborador</p>
                <p className="text-[10px] text-slate-400">Recibí conforme el importe neto</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
