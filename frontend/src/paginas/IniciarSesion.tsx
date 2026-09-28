import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAutenticacion } from '../contexto/AutenticacionContexto';
import { Boton } from '../componentes/ui/Boton';
import { Input } from '../componentes/ui/Input';

export const IniciarSesion: React.FC = () => {
  const navigate = useNavigate();
  const { iniciarSesion } = useAutenticacion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingrese su correo y contraseña.');
      return;
    }

    setCargando(true);
    setError(null);

    const res = await iniciarSesion(email, password, recordar);
    setCargando(false);

    if (res.exito) {
      navigate('/');
    } else {
      setError(res.mensaje || 'Credenciales incorrectas. Verifique e intente nuevamente.');
    }
  };

  const seleccionarDemo = (correoDemo: string, passDemo: string) => {
    setEmail(correoDemo);
    setPassword(passDemo);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo e Identidad */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-400 text-white shadow-xl shadow-brand-500/25 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          TEKI Recursos Humanos
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Plataforma SaaS moderna de gestión integral del talento
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={manejarEnvio}>
            <Input
              etiqueta="Correo Electrónico"
              type="email"
              required
              placeholder="ejemplo@teki.com.py"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icono={<Mail className="w-4 h-4" />}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Contraseña</label>
                <button
                  type="button"
                  onClick={() => alert('Para el demo, utilice una de las cuentas rápidas indicadas abajo.')}
                  className="text-[11px] font-medium text-brand-600 hover:text-brand-700 cursor-pointer"
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icono={<Lock className="w-4 h-4" />}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-xs text-slate-600">Recordar mi sesión</span>
              </label>
            </div>

            <Boton
              type="submit"
              variante="primario"
              cargando={cargando}
              className="w-full mt-2"
              iconoDerecha={<ArrowRight className="w-4 h-4" />}
            >
              Iniciar Sesión
            </Boton>
          </form>

          {/* Accesos rápidos Demo */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Perfiles de Prueba Rápidos (Multi-tenant)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => seleccionarDemo('admin@teki.com.py', 'Admin123!')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-colors cursor-pointer group"
              >
                <div className="font-semibold text-slate-800 flex items-center gap-1 group-hover:text-brand-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> Admin TEKI
                </div>
                <div className="text-[11px] text-slate-500">Alejandro Valdez</div>
              </button>

              <button
                type="button"
                onClick={() => seleccionarDemo('rrhh@teki.com.py', 'RRHH123!')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-colors cursor-pointer group"
              >
                <div className="font-semibold text-slate-800 flex items-center gap-1 group-hover:text-brand-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> RRHH TEKI
                </div>
                <div className="text-[11px] text-slate-500">Claudia Fernández</div>
              </button>

              <button
                type="button"
                onClick={() => seleccionarDemo('carlos.mendoza@teki.com.py', 'Colab123!')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-colors cursor-pointer group"
              >
                <div className="font-semibold text-slate-800 flex items-center gap-1 group-hover:text-brand-600">
                  👤 Colaborador
                </div>
                <div className="text-[11px] text-slate-500">Carlos Mendoza</div>
              </button>

              <button
                type="button"
                onClick={() => seleccionarDemo('admin@innovar.com.py', 'Admin123!')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-colors cursor-pointer group"
              >
                <div className="font-semibold text-slate-800 flex items-center gap-1 group-hover:text-brand-600">
                  🏢 Innovar S.A.
                </div>
                <div className="text-[11px] text-slate-500">Tenant 2 (Aislado)</div>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          TEKI HR Cloud &bull; Sistema multiempresa seguro &bull; 2026
        </p>
      </div>
    </div>
  );
};
