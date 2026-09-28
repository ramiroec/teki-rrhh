import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Settings,
  Building,
  Briefcase,
  Clock,
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Save,
  Sliders,
} from 'lucide-react';
import { api } from '../servicios/api';
import { Sector, Departamento, Cargo, Horario, TipoContrato, ConceptoSalarial } from '../tipos';
import { useAutenticacion } from '../contexto/AutenticacionContexto';
import { useNotificaciones } from '../contexto/NotificacionesContexto';
import { Tarjeta, TarjetaEncabezado, TarjetaCuerpo } from '../componentes/ui/Tarjeta';
import { Boton } from '../componentes/ui/Boton';
import { Badge } from '../componentes/ui/Badge';
import { Input } from '../componentes/ui/Input';
import { Select } from '../componentes/ui/Select';
import { Tabla, ColumnaTabla } from '../componentes/ui/Tabla';
import { Modal } from '../componentes/ui/Modal';

export const ModuloConfiguracion: React.FC = () => {
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const { usuario } = useAutenticacion();
  const { notificarExito, notificarError } = useNotificaciones();

  const determinarPestañaInicial = () => {
    if (ubicacion.pathname.includes('/departamentos')) return 'departamentos';
    if (ubicacion.pathname.includes('/cargos')) return 'cargos';
    return 'sectores';
  };

  const [pestaña, setPestaña] = useState<'sectores' | 'departamentos' | 'cargos' | 'horarios' | 'contratos' | 'conceptos' | 'reglas'>(determinarPestañaInicial);
  const [cargando, setCargando] = useState(true);

  // Estados de datos
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [contratos, setContratos] = useState<TipoContrato[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoSalarial[]>([]);

  // Reglas de negocio configurables
  const [reglas, setReglas] = useState({
    recargoHoraExtraPorcentaje: 0.50,
    porcentajeIpsObrero: 9.00,
    porcentajeIpsPatronal: 16.50,
    diasMesEstandar: 30,
    horasMesEstandar: 240,
  });

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoModal, setTipoModal] = useState<string>('');
  const [itemEdicion, setItemEdicion] = useState<any>(null);
  const [formGenerico, setFormGenerico] = useState<any>({});

  const cargarDatos = async () => {
    setCargando(true);
    const [resSec, resDep, resCar, resHor, resCon, resSal, resEmp] = await Promise.all([
      api.get<Sector[]>('/catalogos/sectores'),
      api.get<Departamento[]>('/catalogos/departamentos'),
      api.get<Cargo[]>('/catalogos/cargos'),
      api.get<Horario[]>('/catalogos/horarios'),
      api.get<TipoContrato[]>('/catalogos/tipos-contrato'),
      api.get<ConceptoSalarial[]>('/catalogos/conceptos-salariales'),
      api.get('/empresas/actual'),
    ]);

    if (resSec.exito && resSec.datos) setSectores(resSec.datos);
    if (resDep.exito && resDep.datos) setDepartamentos(resDep.datos);
    if (resCar.exito && resCar.datos) setCargos(resCar.datos);
    if (resHor.exito && resHor.datos) setHorarios(resHor.datos);
    if (resCon.exito && resCon.datos) setContratos(resCon.datos);
    if (resSal.exito && resSal.datos) setConceptos(resSal.datos);
    if (resEmp.exito && resEmp.datos?.reglasNegocio) {
      setReglas(resEmp.datos.reglasNegocio);
    }

    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (ubicacion.pathname.includes('/departamentos')) setPestaña('departamentos');
    else if (ubicacion.pathname.includes('/cargos')) setPestaña('cargos');
    else if (ubicacion.pathname.includes('/sectores')) setPestaña('sectores');
  }, [ubicacion.pathname]);

  const cambiarPestaña = (nuevaPestaña: 'sectores' | 'departamentos' | 'cargos' | 'horarios' | 'contratos' | 'conceptos' | 'reglas') => {
    setPestaña(nuevaPestaña);
    if (nuevaPestaña === 'sectores') navigate('/configuracion/sectores');
    else if (nuevaPestaña === 'departamentos') navigate('/configuracion/departamentos');
    else if (nuevaPestaña === 'cargos') navigate('/configuracion/cargos');
    else navigate('/configuracion');
  };

  const abrirModalCrear = (tipo: string) => {
    setTipoModal(tipo);
    setItemEdicion(null);
    setFormGenerico({});
    setModalAbierto(true);
  };

  const abrirModalEditar = (tipo: string, item: any) => {
    setTipoModal(tipo);
    setItemEdicion(item);
    setFormGenerico(item);
    setModalAbierto(true);
  };

  const manejarGuardarModal = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = `/catalogos/${tipoModal}`;
    let res;

    if (itemEdicion) {
      res = await api.put(`${url}/${itemEdicion.id}`, formGenerico);
    } else {
      res = await api.post(url, formGenerico);
    }

    if (res.exito) {
      notificarExito('Catálogo actualizado correctamente.');
      setModalAbierto(false);
      cargarDatos();
    } else {
      notificarError(res.mensaje || 'Error al guardar los cambios.');
    }
  };

  const guardarReglasNegocio = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.put('/empresas/configuracion', {
      configuracion: reglas,
    });
    if (res.exito) {
      notificarExito('Reglas de negocio de la empresa guardadas con éxito.');
    } else {
      notificarError(res.mensaje || 'Error al guardar configuración.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Configuración del Sistema
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Gestión de catálogos organizacionales y reglas de liquidación adaptables por empresa.
        </p>
      </div>

      {/* Navegación por pestañas */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {[
          { id: 'sectores', titulo: 'Sectores' },
          { id: 'departamentos', titulo: 'Departamentos' },
          { id: 'cargos', titulo: 'Cargos y Posiciones' },
          { id: 'horarios', titulo: 'Horarios Laborales' },
          { id: 'contratos', titulo: 'Tipos de Contrato' },
          { id: 'conceptos', titulo: 'Conceptos Salariales' },
          { id: 'reglas', titulo: 'Reglas de Liquidación' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => cambiarPestaña(t.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              pestaña === t.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.titulo}
          </button>
        ))}
      </div>

      {/* 1. SECTORES */}
      {pestaña === 'sectores' && (
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Sectores Organizacionales"
            subtitulo="Áreas mayores de la compañía"
            accion={
              <Boton variante="primario" tamano="sm" onClick={() => abrirModalCrear('sectores')} icono={<Plus className="w-4 h-4" />}>
                Nuevo Sector
              </Boton>
            }
          />
          <TarjetaCuerpo className="p-0">
            <Tabla
              columnas={[
                { clave: 'nombre', encabezado: 'Nombre del Sector', render: (s) => <span className="font-semibold text-slate-800">{s.nombre}</span> },
                { clave: 'codigo', encabezado: 'Código', render: (s) => <span className="font-mono text-xs">{s.codigo || '-'}</span> },
                { clave: 'descripcion', encabezado: 'Descripción' },
                { clave: 'total_empleados', encabezado: 'Colaboradores', alineacion: 'centro', render: (s) => <Badge tamano="sm">{s.total_empleados || 0}</Badge> },
                {
                  clave: 'acciones',
                  encabezado: 'Acciones',
                  alineacion: 'derecha',
                  render: (s) => (
                    <Boton variante="fantasma" tamano="sm" onClick={() => abrirModalEditar('sectores', s)}>
                      <Edit2 className="w-4 h-4 text-brand-600" />
                    </Boton>
                  ),
                },
              ]}
              datos={sectores}
              cargando={cargando}
            />
          </TarjetaCuerpo>
        </Tarjeta>
      )}

      {/* 2. DEPARTAMENTOS */}
      {pestaña === 'departamentos' && (
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Departamentos"
            subtitulo="Divisiones operativas por sector"
            accion={
              <Boton variante="primario" tamano="sm" onClick={() => abrirModalCrear('departamentos')} icono={<Plus className="w-4 h-4" />}>
                Nuevo Departamento
              </Boton>
            }
          />
          <TarjetaCuerpo className="p-0">
            <Tabla
              columnas={[
                { clave: 'nombre', encabezado: 'Departamento', render: (d) => <span className="font-semibold text-slate-800">{d.nombre}</span> },
                { clave: 'sector_nombre', encabezado: 'Sector Perteneciente' },
                { clave: 'codigo', encabezado: 'Código', render: (d) => <span className="font-mono text-xs">{d.codigo || '-'}</span> },
                { clave: 'total_empleados', encabezado: 'Dotación', alineacion: 'centro', render: (d) => <Badge tamano="sm">{d.total_empleados || 0}</Badge> },
                {
                  clave: 'acciones',
                  encabezado: 'Acciones',
                  alineacion: 'derecha',
                  render: (d) => (
                    <Boton variante="fantasma" tamano="sm" onClick={() => abrirModalEditar('departamentos', d)}>
                      <Edit2 className="w-4 h-4 text-brand-600" />
                    </Boton>
                  ),
                },
              ]}
              datos={departamentos}
              cargando={cargando}
            />
          </TarjetaCuerpo>
        </Tarjeta>
      )}

      {/* 3. CARGOS */}
      {pestaña === 'cargos' && (
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Cargos y Posiciones"
            subtitulo="Catálogo de funciones y niveles jerárquicos"
            accion={
              <Boton variante="primario" tamano="sm" onClick={() => abrirModalCrear('cargos')} icono={<Plus className="w-4 h-4" />}>
                Nuevo Cargo
              </Boton>
            }
          />
          <TarjetaCuerpo className="p-0">
            <Tabla
              columnas={[
                { clave: 'nombre', encabezado: 'Cargo', render: (c) => <span className="font-semibold text-slate-800">{c.nombre}</span> },
                { clave: 'nivel', encabezado: 'Nivel', render: (c) => <Badge variante="marca" tamano="sm">{c.nivel}</Badge> },
                { clave: 'departamento_nombre', encabezado: 'Departamento' },
                {
                  clave: 'salario_referencia',
                  encabezado: 'Salario Referencia',
                  alineacion: 'derecha',
                  render: (c) => <span>₲ {new Intl.NumberFormat('es-PY').format(Number(c.salario_referencia) || 0)}</span>,
                },
                {
                  clave: 'acciones',
                  encabezado: 'Acciones',
                  alineacion: 'derecha',
                  render: (c) => (
                    <Boton variante="fantasma" tamano="sm" onClick={() => abrirModalEditar('cargos', c)}>
                      <Edit2 className="w-4 h-4 text-brand-600" />
                    </Boton>
                  ),
                },
              ]}
              datos={cargos}
              cargando={cargando}
            />
          </TarjetaCuerpo>
        </Tarjeta>
      )}

      {/* 4. HORARIOS */}
      {pestaña === 'horarios' && (
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Horarios de Trabajo"
            subtitulo="Jornadas regulares y tolerancias"
            accion={
              <Boton variante="primario" tamano="sm" onClick={() => abrirModalCrear('horarios')} icono={<Plus className="w-4 h-4" />}>
                Nuevo Horario
              </Boton>
            }
          />
          <TarjetaCuerpo className="p-0">
            <Tabla
              columnas={[
                { clave: 'nombre', encabezado: 'Nombre', render: (h) => <span className="font-semibold text-slate-800">{h.nombre}</span> },
                { clave: 'hora_entrada', encabezado: 'Entrada', render: (h) => <span className="font-mono">{h.hora_entrada}</span> },
                { clave: 'hora_salida', encabezado: 'Salida', render: (h) => <span className="font-mono">{h.hora_salida}</span> },
                { clave: 'tolerancia_minutos', encabezado: 'Tolerancia', render: (h) => `${h.tolerancia_minutos} min` },
                { clave: 'dias_semana', encabezado: 'Días' },
              ]}
              datos={horarios}
              cargando={cargando}
            />
          </TarjetaCuerpo>
        </Tarjeta>
      )}

      {/* 5. REGLAS DE LIQUIDACIÓN CONFIGURABLES */}
      {pestaña === 'reglas' && (
        <Tarjeta className="max-w-2xl">
          <TarjetaEncabezado
            titulo="Reglas de Negocio de Liquidación"
            subtitulo="Ajustables de forma independiente para cada empresa en el SaaS"
            icono={<Sliders className="w-5 h-5 text-brand-600" />}
          />
          <TarjetaCuerpo>
            <form onSubmit={guardarReglasNegocio} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  etiqueta="Recargo de Horas Extras (%)"
                  type="number"
                  step="0.05"
                  value={reglas.recargoHoraExtraPorcentaje}
                  onChange={(e) => setReglas({ ...reglas, recargoHoraExtraPorcentaje: parseFloat(e.target.value) })}
                  ayuda="0.50 equivale a 50% de recargo sobre hora ordinaria"
                />
                <Input
                  etiqueta="Aporte Obrero IPS (%)"
                  type="number"
                  step="0.1"
                  value={reglas.porcentajeIpsObrero}
                  onChange={(e) => setReglas({ ...reglas, porcentajeIpsObrero: parseFloat(e.target.value) })}
                  ayuda="Legal estándar: 9.00%"
                />
                <Input
                  etiqueta="Aporte Patronal IPS (%)"
                  type="number"
                  step="0.1"
                  value={reglas.porcentajeIpsPatronal}
                  onChange={(e) => setReglas({ ...reglas, porcentajeIpsPatronal: parseFloat(e.target.value) })}
                  ayuda="Legal estándar: 16.50%"
                />
                <Input
                  etiqueta="Divisor de Días del Mes (Ausencias)"
                  type="number"
                  value={reglas.diasMesEstandar}
                  onChange={(e) => setReglas({ ...reglas, diasMesEstandar: parseInt(e.target.value, 10) })}
                  ayuda="Descuento ausencia = Salario / Días"
                />
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Boton type="submit" variante="primario" icono={<Save className="w-4 h-4" />}>
                  Guardar Reglas Configuradas
                </Boton>
              </div>
            </form>
          </TarjetaCuerpo>
        </Tarjeta>
      )}

      {/* MODAL GENÉRICO PARA CREAR/EDITAR CATÁLOGOS */}
      <Modal
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo={`${itemEdicion ? 'Editar' : 'Nuevo'} ${tipoModal}`}
        tamano="sm"
      >
        <form onSubmit={manejarGuardarModal} className="space-y-4">
          <Input
            etiqueta="Nombre"
            required
            value={formGenerico.nombre || ''}
            onChange={(e) => setFormGenerico({ ...formGenerico, nombre: e.target.value })}
          />

          {tipoModal === 'sectores' && (
            <>
              <Input
                etiqueta="Código del Sector"
                value={formGenerico.codigo || ''}
                onChange={(e) => setFormGenerico({ ...formGenerico, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej. SEC-TEC"
              />
              <Input
                etiqueta="Descripción"
                value={formGenerico.descripcion || ''}
                onChange={(e) => setFormGenerico({ ...formGenerico, descripcion: e.target.value })}
              />
            </>
          )}

          {tipoModal === 'departamentos' && (
            <>
              <Select
                etiqueta="Sector"
                value={formGenerico.sector_id || ''}
                onChange={(e) => setFormGenerico({ ...formGenerico, sector_id: e.target.value })}
                opciones={[
                  { valor: '', texto: 'Seleccione un sector' },
                  ...sectores.map((s) => ({ valor: s.id, texto: s.nombre })),
                ]}
              />
              <Input
                etiqueta="Código"
                value={formGenerico.codigo || ''}
                onChange={(e) => setFormGenerico({ ...formGenerico, codigo: e.target.value.toUpperCase() })}
              />
            </>
          )}

          {tipoModal === 'cargos' && (
            <>
              <Select
                etiqueta="Departamento"
                value={formGenerico.departamento_id || ''}
                onChange={(e) => setFormGenerico({ ...formGenerico, departamento_id: e.target.value })}
                opciones={[
                  { valor: '', texto: 'Seleccione departamento' },
                  ...departamentos.map((d) => ({ valor: d.id, texto: d.nombre })),
                ]}
              />
              <Select
                etiqueta="Nivel"
                value={formGenerico.nivel || 'Intermedio'}
                onChange={(e) => setFormGenerico({ ...formGenerico, nivel: e.target.value })}
                opciones={[
                  { valor: 'Junior', texto: 'Junior' },
                  { valor: 'Semi-Senior', texto: 'Semi-Senior' },
                  { valor: 'Senior', texto: 'Senior' },
                  { valor: 'Liderazgo', texto: 'Liderazgo / Lead' },
                  { valor: 'Gerencial', texto: 'Gerencial / Directivo' },
                ]}
              />
              <Input
                etiqueta="Salario de Referencia (₲)"
                type="number"
                value={formGenerico.salario_referencia || 0}
                onChange={(e) => setFormGenerico({ ...formGenerico, salario_referencia: Number(e.target.value) })}
              />
            </>
          )}

          {tipoModal === 'horarios' && (
            <>
              <Input
                etiqueta="Hora de Entrada"
                type="time"
                value={formGenerico.hora_entrada || '08:00'}
                onChange={(e) => setFormGenerico({ ...formGenerico, hora_entrada: e.target.value })}
              />
              <Input
                etiqueta="Hora de Salida"
                type="time"
                value={formGenerico.hora_salida || '17:00'}
                onChange={(e) => setFormGenerico({ ...formGenerico, hora_salida: e.target.value })}
              />
              <Input
                etiqueta="Tolerancia (minutos)"
                type="number"
                value={formGenerico.tolerancia_minutos || 15}
                onChange={(e) => setFormGenerico({ ...formGenerico, tolerancia_minutos: parseInt(e.target.value, 10) })}
              />
            </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Boton type="button" variante="fantasma" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario">
              Guardar
            </Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
