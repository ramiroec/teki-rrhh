import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Video,
  MapPin,
  Users,
  Plus,
  Tv,
  Newspaper,
  Pin,
  ExternalLink,
  Clock,
  Sparkles,
  CheckCircle,
  Building,
} from 'lucide-react';
import { api } from '../servicios/api';
import { SalaReunion, Reunion, NoticiaIntranet } from '../tipos';
import { useAutenticacion } from '../contexto/AutenticacionContexto';
import { useNotificaciones } from '../contexto/NotificacionesContexto';
import { Tarjeta, TarjetaEncabezado, TarjetaCuerpo } from '../componentes/ui/Tarjeta';
import { Boton } from '../componentes/ui/Boton';
import { Badge } from '../componentes/ui/Badge';
import { Input } from '../componentes/ui/Input';
import { Select } from '../componentes/ui/Select';
import { Modal } from '../componentes/ui/Modal';

export const ModuloIntranet: React.FC = () => {
  const { usuario, esRRHH } = useAutenticacion();
  const { notificarExito, notificarError } = useNotificaciones();

  const [pestaña, setPestaña] = useState<'noticias' | 'reuniones' | 'salas'>('noticias');
  const [salas, setSalas] = useState<SalaReunion[]>([]);
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [noticias, setNoticias] = useState<NoticiaIntranet[]>([]);
  const [cargando, setCargando] = useState(true);

  // Modales
  const [modalReunionAbierto, setModalReunionAbierto] = useState(false);
  const [modalNoticiaAbierto, setModalNoticiaAbierto] = useState(false);

  // Formulario reunión
  const [formReunion, setFormReunion] = useState({
    titulo: '',
    descripcion: '',
    modalidad: 'PRESENCIAL',
    sala_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    enlace_reunion: '',
    plataforma: 'MEET',
  });

  // Formulario noticia
  const [formNoticia, setFormNoticia] = useState({
    titulo: '',
    contenido: '',
    categoria: 'General',
    fijado: false,
  });

  const cargarDatos = async () => {
    setCargando(true);
    const [resSal, resReu, resNot] = await Promise.all([
      api.get<SalaReunion[]>('/intranet/salas'),
      api.get<Reunion[]>('/intranet/reuniones'),
      api.get<NoticiaIntranet[]>('/intranet/noticias'),
    ]);

    if (resSal.exito && resSal.datos) setSalas(resSal.datos);
    if (resReu.exito && resReu.datos) setReuniones(resReu.datos);
    if (resNot.exito && resNot.datos) setNoticias(resNot.datos);
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const manejarCrearReunion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReunion.titulo || !formReunion.fecha_inicio || !formReunion.fecha_fin) {
      notificarError('Complete el título y las fechas de inicio y fin.');
      return;
    }

    const res = await api.post('/intranet/reuniones', formReunion);
    if (res.exito) {
      notificarExito('Reunión agendada exitosamente.');
      setModalReunionAbierto(false);
      cargarDatos();
    } else {
      notificarError(res.mensaje || 'Error al programar reunión.');
    }
  };

  const manejarCrearNoticia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNoticia.titulo || !formNoticia.contenido) {
      notificarError('Ingrese título y contenido.');
      return;
    }

    const res = await api.post('/intranet/noticias', formNoticia);
    if (res.exito) {
      notificarExito('Noticia publicada en la intranet.');
      setModalNoticiaAbierto(false);
      cargarDatos();
    } else {
      notificarError(res.mensaje || 'Error al crear noticia.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Intranet, Noticias y Reserva de Salas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Espacio colaborativo corporativo preparado para reservas físicas, híbridas y enlaces virtuales (Meet, Teams, Zoom).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pestaña === 'reuniones' && (
            <Boton
              variante="primario"
              onClick={() => setModalReunionAbierto(true)}
              icono={<Plus className="w-4 h-4" />}
            >
              Agendar Reunión
            </Boton>
          )}
          {pestaña === 'noticias' && esRRHH && (
            <Boton
              variante="primario"
              onClick={() => setModalNoticiaAbierto(true)}
              icono={<Plus className="w-4 h-4" />}
            >
              Publicar Noticia
            </Boton>
          )}
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setPestaña('noticias')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
            pestaña === 'noticias'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Muro de Noticias</span>
        </button>

        <button
          onClick={() => setPestaña('reuniones')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
            pestaña === 'reuniones'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Agenda y Reuniones</span>
        </button>

        <button
          onClick={() => setPestaña('salas')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
            pestaña === 'salas'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Salas y Equipamiento</span>
        </button>
      </div>

      {/* 1. NOTICIAS INTRANET */}
      {pestaña === 'noticias' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {noticias.map((n) => (
              <Tarjeta key={n.id} className={n.fijado ? 'border-brand-300 ring-1 ring-brand-200' : ''}>
                <TarjetaEncabezado
                  titulo={
                    <div className="flex items-center gap-2">
                      {n.fijado && <Pin className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                      <span className="truncate">{n.titulo}</span>
                    </div>
                  }
                  subtitulo={`Publicado por ${n.autor_nombre || 'Comunicaciones'} &bull; ${new Date(n.fecha_publicacion).toLocaleDateString('es-PY')}`}
                  accion={<Badge variante="marca">{n.categoria}</Badge>}
                />
                <TarjetaCuerpo className="text-xs text-slate-600 leading-relaxed">
                  <p className="whitespace-pre-line">{n.contenido}</p>
                </TarjetaCuerpo>
              </Tarjeta>
            ))}
          </div>
        </div>
      )}

      {/* 2. REUNIONES Y AGENDA */}
      {pestaña === 'reuniones' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reuniones.map((r) => (
              <Tarjeta key={r.id}>
                <TarjetaEncabezado
                  titulo={r.titulo}
                  subtitulo={`Organizador: ${r.organizador_nombre || 'Equipo TEKI'}`}
                  accion={<Badge>{r.modalidad}</Badge>}
                />
                <TarjetaCuerpo className="space-y-3 text-xs">
                  {r.descripcion && <p className="text-slate-600">{r.descripcion}</p>}

                  <div className="grid grid-cols-2 gap-2 text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      <span>{new Date(r.fecha_inicio).toLocaleDateString('es-PY')} {new Date(r.fecha_inicio).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {r.sala_nombre && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{r.sala_nombre}</span>
                      </div>
                    )}
                  </div>

                  {r.enlace_reunion && (
                    <div className="pt-2">
                      <a
                        href={r.enlace_reunion}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg font-semibold transition-colors"
                      >
                        <Video className="w-4 h-4 text-brand-600" />
                        <span>Unirse a la Reunión ({r.plataforma})</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                    </div>
                  )}
                </TarjetaCuerpo>
              </Tarjeta>
            ))}
          </div>
        </div>
      )}

      {/* 3. SALAS DE REUNIÓN */}
      {pestaña === 'salas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {salas.map((s) => (
            <Tarjeta key={s.id}>
              <TarjetaEncabezado
                titulo={s.nombre}
                subtitulo={s.ubicacion || 'En línea'}
                icono={s.tipo === 'VIRTUAL' ? <Video className="w-4 h-4 text-sky-600" /> : <Building className="w-4 h-4 text-brand-600" />}
                accion={<Badge>{s.tipo}</Badge>}
              />
              <TarjetaCuerpo className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Capacidad máxima:
                  </span>
                  <span className="font-bold text-slate-800">{s.capacidad} personas</span>
                </div>

                {s.equipamiento && s.equipamiento.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Equipamiento:</p>
                    <div className="flex flex-wrap gap-1">
                      {s.equipamiento.map((eq, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </TarjetaCuerpo>
            </Tarjeta>
          ))}
        </div>
      )}

      {/* MODAL: AGENDAR REUNIÓN */}
      <Modal
        abierto={modalReunionAbierto}
        alCerrar={() => setModalReunionAbierto(false)}
        titulo="Agendar Nueva Reunión"
        subtitulo="Reserve sala física o enlace virtual con detección de conflictos"
        tamano="md"
      >
        <form onSubmit={manejarCrearReunion} className="space-y-4">
          <Input
            etiqueta="Título de la Reunión"
            required
            placeholder="Ej. Planificación Trimestral Q4"
            value={formReunion.titulo}
            onChange={(e) => setFormReunion({ ...formReunion, titulo: e.target.value })}
          />

          <Select
            etiqueta="Modalidad"
            value={formReunion.modalidad}
            onChange={(e) => setFormReunion({ ...formReunion, modalidad: e.target.value })}
            opciones={[
              { valor: 'PRESENCIAL', texto: 'Presencial' },
              { valor: 'VIRTUAL', texto: 'Virtual (Enlace Remoto)' },
              { valor: 'HIBRIDA', texto: 'Híbrida (Sala Física + Virtual)' },
            ]}
          />

          <Select
            etiqueta="Sala Asignada"
            value={formReunion.sala_id}
            onChange={(e) => setFormReunion({ ...formReunion, sala_id: e.target.value })}
            opciones={[
              { valor: '', texto: 'Sin sala física / Virtual pura' },
              ...salas.map((s) => ({ valor: s.id, texto: `${s.nombre} (${s.capacidad} pers.)` })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              etiqueta="Inicio (Fecha y Hora)"
              type="datetime-local"
              required
              value={formReunion.fecha_inicio}
              onChange={(e) => setFormReunion({ ...formReunion, fecha_inicio: e.target.value })}
            />
            <Input
              etiqueta="Fin (Fecha y Hora)"
              type="datetime-local"
              required
              value={formReunion.fecha_fin}
              onChange={(e) => setFormReunion({ ...formReunion, fecha_fin: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              etiqueta="Plataforma Virtual"
              value={formReunion.plataforma}
              onChange={(e) => setFormReunion({ ...formReunion, plataforma: e.target.value })}
              opciones={[
                { valor: 'MEET', texto: 'Google Meet' },
                { valor: 'TEAMS', texto: 'Microsoft Teams' },
                { valor: 'ZOOM', texto: 'Zoom' },
              ]}
            />
            <Input
              etiqueta="Enlace Virtual de Reunión"
              placeholder="https://meet.google.com/..."
              value={formReunion.enlace_reunion}
              onChange={(e) => setFormReunion({ ...formReunion, enlace_reunion: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Boton type="button" variante="fantasma" onClick={() => setModalReunionAbierto(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario">
              Agendar Reunión
            </Boton>
          </div>
        </form>
      </Modal>

      {/* MODAL: PUBLICAR NOTICIA */}
      <Modal
        abierto={modalNoticiaAbierto}
        alCerrar={() => setModalNoticiaAbierto(false)}
        titulo="Publicar Comunicado en Intranet"
        tamano="md"
      >
        <form onSubmit={manejarCrearNoticia} className="space-y-4">
          <Input
            etiqueta="Título del Comunicado"
            required
            value={formNoticia.titulo}
            onChange={(e) => setFormNoticia({ ...formNoticia, titulo: e.target.value })}
          />

          <Select
            etiqueta="Categoría"
            value={formNoticia.categoria}
            onChange={(e) => setFormNoticia({ ...formNoticia, categoria: e.target.value })}
            opciones={[
              { valor: 'Institucional', texto: 'Institucional / Corporativo' },
              { valor: 'Bienestar', texto: 'Bienestar y Beneficios' },
              { valor: 'Tecnología', texto: 'Sistemas y Herramientas' },
              { valor: 'Eventos', texto: 'Eventos y Capacitaciones' },
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contenido</label>
            <textarea
              rows={4}
              required
              value={formNoticia.contenido}
              onChange={(e) => setFormNoticia({ ...formNoticia, contenido: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs"
              placeholder="Escriba el comunicado para los colaboradores..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formNoticia.fijado}
              onChange={(e) => setFormNoticia({ ...formNoticia, fijado: e.target.checked })}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span className="text-xs text-slate-700 font-medium">Fijar al inicio del muro</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Boton type="button" variante="fantasma" onClick={() => setModalNoticiaAbierto(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario">
              Publicar Noticia
            </Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
