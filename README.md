# TEKI RRHH — Plataforma SaaS de Gestión del Talento

Plataforma web moderna, profesional y multiempresa (multi-tenant) de Recursos Humanos, diseñada para centralizar la gestión de colaboradores, asistencia, vacaciones, liquidación de salarios y recibos oficiales.

---

## 🚀 Tecnologías Utilizadas

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Recharts, Lucide React.
- **Backend**: Node.js, Express, TypeScript, JWT (JSON Web Tokens), BCrypt, PostgreSQL (driver `pg`), arquitectura modular en capas (rutas, controladores, servicios, modelos y middleware).
- **Base de Datos**: PostgreSQL con esquema multi-tenant aislado mediante `empresa_id` y claves foráneas en cascada.

---

## 👥 Credenciales de Prueba (Demo Multi-tenant)

La plataforma incluye datos realistas sembrados para probar de inmediato:

### Empresa 1: TEKI Soluciones Tecnológicas S.A.
- **Administrador**: `admin@teki.com.py` / `Admin123!`
  - Acceso total a todos los módulos, colaboradores, configuración y auditoría.
- **Responsable de RRHH**: `rrhh@teki.com.py` / `RRHH123!`
  - Gestión de colaboradores, asistencia, aprobación de vacaciones, liquidaciones y recibos.
- **Colaborador**: `carlos.mendoza@teki.com.py` / `Colab123!`
  - Vista de su ficha personal, solicitud de vacaciones y consulta de sus recibos de salario.
- **Colaboradora**: `sofia.benitez@teki.com.py` / `Colab123!`

### Empresa 2: Innovar Retail & Logística S.A. (Demostración de Aislamiento Tenant)
- **Administrador**: `admin@innovar.com.py` / `Admin123!`
  - Permite verificar que los datos de ambas empresas se encuentran totalmente aislados.

*(En la pantalla de inicio de sesión `/iniciar-sesion` dispone de botones de acceso rápido para ingresar con cualquiera de estos perfiles con un solo clic).*

---

## 💼 Módulos Implementados

1. **Dashboard Principal (`/`)**:
   - KPIs de colaboradores activos, nuevos ingresos, horas extras acumuladas, masa salarial base.
   - Gráfico de distribución de colaboradores por sector organizacional.
   - Gráfico de distribución por tipos de contrato laboral.
   - Próximos cumpleaños (próximos 45 días) y aniversarios laborales en la empresa.
   - Monitor de ausencias y licencias en el día.
   - Panel de resolución rápida para solicitudes de vacaciones pendientes.

2. **Gestión de Colaboradores (`/empleados`)**:
   - Listado tabular con avatares, códigos, cargos, sectores y salarios.
   - Búsqueda en tiempo real por nombre, documento o código interno.
   - Filtros por sector y estado laboral (Activo, De Vacaciones, Inactivo, Baja).
   - Formulario estructurado en 3 pasos para alta de colaboradores.
   - Acciones de cambio de estado (Activo, Inactivo, Vacaciones, Baja).

3. **Ficha del Colaborador (`/empleados/:id`)**:
   - Vista detallada organizada en pestañas:
     1. Información Personal (identificación, residencia, contacto).
     2. Información Laboral (cargo, sector, departamento, horario, salario base, jefe directo).
     3. Información Adicional & Emergencia (contacto de emergencia, correo corporativo, notas).
     4. Legajo Digital & Documentos (carga y visualización de cédula, contratos, certificados).
     5. Historial reciente de marcaciones y solicitudes de vacaciones.

4. **Control de Asistencia (`/asistencia`)**:
   - Cómputo de horas trabajadas, horas extras y minutos de llegada tardía.
   - Resumen del día con contadores de presentes, tardanzas y ausencias.
   - Filtros por fecha, sector y estado.
   - Modal para registro manual de marcaciones con cálculo automático.

5. **Gestión de Vacaciones (`/vacaciones`)**:
   - Cálculo automático de saldo de días anuales según antigüedad laboral.
   - Solicitud de vacaciones con cálculo de días hábiles.
   - Detección visual de solapamiento en el calendario de ausencias.
   - Flujo de resolución: Aprobación / Rechazo con motivo formal.

6. **Liquidación de Salarios (`/liquidaciones`)**:
   - Gestión de períodos de liquidación mensuales.
   - Motor de cálculo automatizado con reglas configurables:
     - 50% de recargo en horas extraordinarias.
     - 9% de aporte obrero al IPS.
     - 16.5% de aporte patronal al IPS.
     - Descuento por día de ausencia = Salario Base / 30.
   - Resumen pre-confirmación: Salario Bruto, Adicionales, Retención IPS, Descuentos, Salario Neto.
   - Ajuste manual de bonos y haberes previo al cierre.
   - Cierre de período y emisión correlativa de recibos oficiales.

7. **Recibos de Salario (`/recibos`)**:
   - Listado de recibos emitidos con búsqueda y filtro por período.
   - Formato profesional apto para presentación al cliente e impresión (`window.print()`).
   - Conversión automática del monto neto a letras en español (guaraníes).
   - Bloques de firma del empleador y colaborador.

8. **Panel Estratégico de RRHH (`/panel-rrhh`)**:
   - Métricas analíticas de masa salarial promedio, dispersión salarial y retención.
   - Gráfico de barras horizontales de masa salarial por sector.
   - Gráfico de líneas con la evolución histórica de liquidaciones.

9. **Usuarios y Permisos RBAC (`/usuarios`)**:
   - Gestión de usuarios y asignación de roles (`Administrador`, `RRHH`, `Colaborador`, `Comunicaciones`).
   - Vinculación opcional con colaborador de la nómina.

10. **Configuración y Catálogos (`/configuracion`)**:
    - Catálogos administrables: Sectores, Departamentos, Cargos, Horarios, Contratos y Conceptos Salariales.
    - Pestaña de Reglas de Negocio configurables por empresa.

11. **Auditoría y Trazabilidad (`/auditoria`)**:
    - Registro inmutable de acciones críticas (inicios de sesión, altas, bajas, aprobaciones, liquidaciones).

12. **Intranet, Salas y Reuniones (`/intranet`)**:
    - Estructura preparada para salas físicas y virtuales (Google Meet, Teams, Zoom).
    - Detección de conflictos de horario al agendar reuniones.
    - Muro de noticias corporativas con fijado de comunicados.

---

## 🛠️ Ejecución Local

### Backend:
```bash
cd backend
npm install
npm run dev # Inicia en http://localhost:3001
```

Comandos útiles de base de datos:
- `npm run db:migrar`: Ejecuta migraciones DDL.
- `npm run db:semillar`: Carga los datos de demostración multi-tenant.
- `npm run db:setup`: Ejecuta migraciones y semillas completas.

### Frontend:
```bash
cd frontend
npm install
npm run dev # Inicia en http://localhost:5173
```
Acceder en el navegador a: `http://localhost:5173`
