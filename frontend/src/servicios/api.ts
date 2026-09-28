//const API_BASE = '/api';
const API_BASE = 'https://vps-aff6ee56.vps.ovh.ca/rrhh1-api/api';

interface OpcionesPeticion extends RequestInit {
  parametros?: Record<string, any>;
}

export async function peticionApi<T = any>(ruta: string, opciones: OpcionesPeticion = {}): Promise<{ exito: boolean; datos?: T; mensaje?: string; total?: number }> {
  const token = localStorage.getItem('teki_token') || sessionStorage.getItem('teki_token');

  let url = `${API_BASE}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;

  if (opciones.parametros) {
    const params = new URLSearchParams();
    Object.entries(opciones.parametros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        params.append(clave, String(valor));
      }
    });
    const qs = params.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  const cabeceras: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opciones.headers as Record<string, string>),
  };

  if (token) {
    cabeceras['Authorization'] = `Bearer ${token}`;
  }

  try {
    const respuesta = await fetch(url, {
      ...opciones,
      headers: cabeceras,
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        // Token expirado o inválido: limpiar sesión si no estamos ya en el login
        if (!window.location.pathname.includes('/iniciar-sesion')) {
          localStorage.removeItem('teki_token');
          sessionStorage.removeItem('teki_token');
          window.location.href = '/iniciar-sesion?expirado=1';
        }
      }
      return {
        exito: false,
        mensaje: datos.mensaje || 'No pudimos procesar la operación. Verifique los datos e intente nuevamente.',
      };
    }

    return datos;
  } catch (error) {
    console.error('Error en llamada a API:', error);
    return {
      exito: false,
      mensaje: 'No fue posible conectar con el servidor. Compruebe su conexión a internet.',
    };
  }
}

export const api = {
  get: <T = any>(ruta: string, parametros?: Record<string, any>) => peticionApi<T>(ruta, { method: 'GET', parametros }),
  post: <T = any>(ruta: string, cuerpo?: any) => peticionApi<T>(ruta, { method: 'POST', body: JSON.stringify(cuerpo) }),
  put: <T = any>(ruta: string, cuerpo?: any) => peticionApi<T>(ruta, { method: 'PUT', body: JSON.stringify(cuerpo) }),
  patch: <T = any>(ruta: string, cuerpo?: any) => peticionApi<T>(ruta, { method: 'PATCH', body: JSON.stringify(cuerpo) }),
  delete: <T = any>(ruta: string) => peticionApi<T>(ruta, { method: 'DELETE' }),
};
