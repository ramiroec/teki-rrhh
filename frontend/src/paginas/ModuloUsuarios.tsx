import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  User,
  Mail,
  Lock,
  Edit2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { api } from '../servicios/api';
import { Usuario, Empleado, RolUsuario } from '../tipos';
import { useAutenticacion } from '../contexto/AutenticacionContexto';
import { useNotificaciones } from '../contexto/NotificacionesContexto';
import { Tarjeta, TarjetaEncabezado, TarjetaCuerpo } from '../componentes/ui/Tarjeta';
import { Boton } from '../componentes/ui/Boton';
import { Badge } from '../componentes/ui/Badge';
import { Input } from '../componentes/ui/Input';
import { Select } from '../componentes/ui/Select';
import { Tabla, ColumnaTabla } from '../componentes/ui/Tabla';
import { Modal } from '../componentes/ui/Modal';

export const ModuloUsuarios: React.FC = () => {
  const { esAdmin } = useAutenticacion();
  const { notificarExito, notificarError } = useNotificaciones();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');

  // Modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);

  // Formulario nuevo
  const [formNuevo, setFormNuevo] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'Colaborador' as RolUsuario,
    empleado_id: '',
  });

  // Formulario editar
  const [formEdicion, setFormEdicion] = useState({
    nombre: '',
    apellido: '',
    rol: 'Colaborador' as RolUsuario,
    empleado_id: '',
    password: '',
    activo: true,
  });

  const cargarDatos = async () => {
    setCargando(true);
    const [resUsu, resEmp] = await Promise.all([
      api.get<Usuario[]>('/usuarios', { busqueda, rol: filtroRol }),
      api.get<Empleado[]>('/empleados', { estado: 'Activo' }),
    ]);

    if (resUsu.exito && resUsu.datos) setUsuarios(resUsu.datos);
    if (resEmp.exito && resEmp.datos) setEmpleados(resEmp.datos);
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [busqueda, filtroRol]);

  const manejarCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNuevo.email || !formNuevo.password || !formNuevo.nombre || !formNuevo.apellido) {
      notificarError('Complete los campos obligatorios del usuario.');
      return;
    }

    const res = await api.post('/usuarios', formNuevo);
    if (res.exito) {
      notificarExito('Usuario registrado exitosamente.');
      setModalNuevoAbierto(false);
      setFormNuevo({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        rol: 'Colaborador',
        empleado_id: '',
      });
      cargarDatos();
    } else {
      notificarError(res.mensaje || 'Error al crear usuario.');
    }
  };

  const abrirEdicion = (u: Usuario) => {
    setUsuarioEditar(u);
    setFormEdicion({
      nombre: u.nombre,
      apellido: u.apellido,
      rol: u.rol,
      empleado_id: u.empleadoId || '',
      password: '',
      activo: u.activo ?? true,
    });
    setModalEditarAbierto(true);
  };

  const manejarGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditar) return;

    const res = await api.put(`/usuarios/${usuarioEditar.id}`, formEdicion);
    if (res.exito) {
      notificarExito('Usuario actualizado correctamente.');
      setModalEditarAbierto(false);
      cargarDatos();
    } else {
      notificarError(res.mensaje || 'Error al actualizar usuario.');
    }
  };

  const columnas: ColumnaTabla<Usuario>[] = [
    {
      clave: 'usuario',
      encabezado: 'Usuario',
      render: (u) => (
        <div className="flex items-center gap-3">
          <img
            src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.nombre}`}
            alt={u.nombre}
            className="w-8 h-8 rounded-full border object-cover shrink-0"
          />
          <div>
            <p className="font-semibold text-slate-800">
              {u.nombre} {u.apellido}
            </p>
            <p className="text-xs text-slate-500 font-mono">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      clave: 'rol',
      encabezado: 'Rol / Permiso',
      render: (u) => (
        <Badge
          variante={
            u.rol === 'Administrador'
              ? 'marca'
              : u.rol === 'RRHH'
              ? 'exito'
              : u.rol === 'Comunicaciones'
              ? 'purpura'
              : 'neutro'
          }
        >
          {u.rol}
        </Badge>
      ),
    },
    {
      clave: 'empleado_asociado',
      encabezado: 'Empleado Asociado',
      render: (u) => (
        <span className="text-xs text-slate-700">
          {u.empleadoCodigo ? (
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
              {u.empleadoCodigo}
            </span>
          ) : (
            <span className="text-slate-400 italic">Sin vincular</span>
          )}
        </span>
      ),
    },
    {
      clave: 'ultimo_acceso',
      encabezado: 'Último Acceso',
      render: (u) => (
        <span className="text-xs text-slate-500">
          {u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString('es-PY') : 'Nunca'}
        </span>
      ),
    },
    {
      clave: 'activo',
      encabezado: 'Estado',
      alineacion: 'centro',
      render: (u) => <Badge>{u.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alineacion: 'derecha',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {esAdmin && (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => abrirEdicion(u)}
              title="Editar Usuario"
            >
              <Edit2 className="w-4 h-4 text-brand-600" />
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
            Usuarios y Permisos de Acceso
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Administre las cuentas del sistema, roles (Administrador, RRHH, Colaborador, Comunicaciones) y vinculación con colaboradores.
          </p>
        </div>
        {esAdmin && (
          <Boton
            variante="primario"
            onClick={() => setModalNuevoAbierto(true)}
            icono={<Plus className="w-4 h-4" />}
          >
            Nuevo Usuario
          </Boton>
        )}
      </div>

      {/* Filtros */}
      <Tarjeta>
        <TarjetaCuerpo className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Buscar por nombre, apellido o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                icono={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              opciones={[
                { valor: '', texto: 'Todos los roles' },
                { valor: 'Administrador', texto: 'Administrador' },
                { valor: 'RRHH', texto: 'RRHH' },
                { valor: 'Colaborador', texto: 'Colaborador' },
                { valor: 'Comunicaciones', texto: 'Comunicaciones' },
              ]}
            />
          </div>
        </TarjetaCuerpo>
      </Tarjeta>

      {/* Tabla de Usuarios */}
      <Tabla
        columnas={columnas}
        datos={usuarios}
        cargando={cargando}
        mensajeVacio="No se encontraron usuarios"
        subtituloVacio="Modifique los filtros o cree un nuevo usuario con el botón superior."
      />

      {/* MODAL: NUEVO USUARIO */}
      <Modal
        abierto={modalNuevoAbierto}
        alCerrar={() => setModalNuevoAbierto(false)}
        titulo="Crear Nuevo Usuario"
        subtitulo="Asigne rol y vincule opcionalmente con un colaborador de la nómina"
        tamano="md"
      >
        <form onSubmit={manejarCrearUsuario} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              etiqueta="Nombre"
              required
              value={formNuevo.nombre}
              onChange={(e) => setFormNuevo({ ...formNuevo, nombre: e.target.value })}
            />
            <Input
              etiqueta="Apellido"
              required
              value={formNuevo.apellido}
              onChange={(e) => setFormNuevo({ ...formNuevo, apellido: e.target.value })}
            />
          </div>

          <Input
            etiqueta="Correo Electrónico"
            type="email"
            required
            placeholder="usuario@teki.com.py"
            value={formNuevo.email}
            onChange={(e) => setFormNuevo({ ...formNuevo, email: e.target.value })}
            icono={<Mail className="w-4 h-4" />}
          />

          <Input
            etiqueta="Contraseña Inicial"
            type="password"
            required
            placeholder="••••••••"
            value={formNuevo.password}
            onChange={(e) => setFormNuevo({ ...formNuevo, password: e.target.value })}
            icono={<Lock className="w-4 h-4" />}
          />

          <Select
            etiqueta="Rol en el Sistema"
            value={formNuevo.rol}
            onChange={(e) => setFormNuevo({ ...formNuevo, rol: e.target.value as any })}
            opciones={[
              { valor: 'Administrador', texto: 'Administrador (Acceso Total)' },
              { valor: 'RRHH', texto: 'RRHH (Gestión de Personal, Asistencia, Liquidaciones)' },
              { valor: 'Colaborador', texto: 'Colaborador (Acceso a su información personal)' },
              { valor: 'Comunicaciones', texto: 'Comunicaciones (Publicación de noticias y salas)' },
            ]}
          />

          <Select
            etiqueta="Vincular con Colaborador de Nómina (Opcional)"
            value={formNuevo.empleado_id}
            onChange={(e) => setFormNuevo({ ...formNuevo, empleado_id: e.target.value })}
            opciones={[
              { valor: '', texto: 'Sin vincular a empleado' },
              ...empleados.map((e) => ({ valor: e.id, texto: `${e.nombres} ${e.apellidos} (${e.codigo})` })),
            ]}
          />

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Boton type="button" variante="fantasma" onClick={() => setModalNuevoAbierto(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario">
              Crear Usuario
            </Boton>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDITAR USUARIO */}
      <Modal
        abierto={modalEditarAbierto}
        alCerrar={() => setModalEditarAbierto(false)}
        titulo="Modificar Usuario"
        subtitulo={`Usuario: ${usuarioEditar?.email}`}
        tamano="md"
      >
        <form onSubmit={manejarGuardarEdicion} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              etiqueta="Nombre"
              required
              value={formEdicion.nombre}
              onChange={(e) => setFormEdicion({ ...formEdicion, nombre: e.target.value })}
            />
            <Input
              etiqueta="Apellido"
              required
              value={formEdicion.apellido}
              onChange={(e) => setFormEdicion({ ...formEdicion, apellido: e.target.value })}
            />
          </div>

          <Select
            etiqueta="Rol en el Sistema"
            value={formEdicion.rol}
            onChange={(e) => setFormEdicion({ ...formEdicion, rol: e.target.value as any })}
            opciones={[
              { valor: 'Administrador', texto: 'Administrador (Acceso Total)' },
              { valor: 'RRHH', texto: 'RRHH (Gestión de Personal, Asistencia, Liquidaciones)' },
              { valor: 'Colaborador', texto: 'Colaborador (Acceso a su información personal)' },
              { valor: 'Comunicaciones', texto: 'Comunicaciones (Publicación de noticias y salas)' },
            ]}
          />

          <Select
            etiqueta="Colaborador Asociado"
            value={formEdicion.empleado_id}
            onChange={(e) => setFormEdicion({ ...formEdicion, empleado_id: e.target.value })}
            opciones={[
              { valor: '', texto: 'Sin vincular' },
              ...empleados.map((e) => ({ valor: e.id, texto: `${e.nombres} ${e.apellidos} (${e.codigo})` })),
            ]}
          />

          <Input
            etiqueta="Nueva Contraseña (Dejar en blanco para conservar actual)"
            type="password"
            placeholder="••••••••"
            value={formEdicion.password}
            onChange={(e) => setFormEdicion({ ...formEdicion, password: e.target.value })}
          />

          <Select
            etiqueta="Estado de la Cuenta"
            value={formEdicion.activo ? 'true' : 'false'}
            onChange={(e) => setFormEdicion({ ...formEdicion, activo: e.target.value === 'true' })}
            opciones={[
              { valor: 'true', texto: 'Activo (Puede iniciar sesión)' },
              { valor: 'false', texto: 'Inactivo (Acceso suspendido)' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Boton type="button" variante="fantasma" onClick={() => setModalEditarAbierto(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario">
              Guardar Cambios
            </Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
