/**
 * Configuración de Reglas de Negocio para Liquidaciones y RRHH
 * 
 * Separadas de la lógica de negocio para permitir personalización
 * por empresa, legislación o convenio colectivo.
 */

export interface ReglasLiquidacion {
  // Porcentaje adicional para horas extra (0.50 = 50% adicional -> factor 1.50)
  recargoHoraExtraPorcentaje: number;
  
  // Porcentaje de aporte obrero al IPS (seguridad social)
  porcentajeIpsObrero: number;
  
  // Porcentaje de aporte patronal al IPS
  porcentajeIpsPatronal: number;
  
  // Divisor de días estándar del mes para cálculo de jornada diaria y ausencias
  diasMesEstandar: number;
  
  // Horas laborales al mes estándar (ej. 30 días * 8 horas = 240 horas, o 48 hs semanales)
  horasMesEstandar: number;
  
  // Tolerancia de llegada tardía en minutos antes de registrar retraso
  toleranciaLlegadaTardiaMinutos: number;
  
  // Cantidad de días hábiles de vacaciones según antigüedad (años de trabajo)
  escalasVacaciones: { aniosMinimos: number; aniosMaximos: number; diasVacaciones: number }[];
}

export const REGLAS_POR_DEFECTO: ReglasLiquidacion = {
  recargoHoraExtraPorcentaje: 0.50, // 50% recargo
  porcentajeIpsObrero: 9.00,        // 9% aporte obrero IPS
  porcentajeIpsPatronal: 16.50,     // 16.5% aporte patronal IPS
  diasMesEstandar: 30,             // Descuento ausencia = salario_base / 30 * dias
  horasMesEstandar: 240,           // Para valor de hora base
  toleranciaLlegadaTardiaMinutos: 15,
  escalasVacaciones: [
    { aniosMinimos: 1, aniosMaximos: 5, diasVacaciones: 12 },
    { aniosMinimos: 6, aniosMaximos: 10, diasVacaciones: 18 },
    { aniosMinimos: 11, aniosMaximos: 99, diasVacaciones: 30 },
  ],
};

/**
 * Permite obtener las reglas específicas de una empresa a partir de su configuración JSONB
 * o caer de vuelta a las reglas predeterminadas.
 */
export const obtenerReglasEmpresa = (configuracionEmpresa?: any): ReglasLiquidacion => {
  if (!configuracionEmpresa || typeof configuracionEmpresa !== 'object') {
    return REGLAS_POR_DEFECTO;
  }

  return {
    recargoHoraExtraPorcentaje: Number(configuracionEmpresa.recargoHoraExtraPorcentaje ?? REGLAS_POR_DEFECTO.recargoHoraExtraPorcentaje),
    porcentajeIpsObrero: Number(configuracionEmpresa.porcentajeIpsObrero ?? REGLAS_POR_DEFECTO.porcentajeIpsObrero),
    porcentajeIpsPatronal: Number(configuracionEmpresa.porcentajeIpsPatronal ?? REGLAS_POR_DEFECTO.porcentajeIpsPatronal),
    diasMesEstandar: Number(configuracionEmpresa.diasMesEstandar ?? REGLAS_POR_DEFECTO.diasMesEstandar),
    horasMesEstandar: Number(configuracionEmpresa.horasMesEstandar ?? REGLAS_POR_DEFECTO.horasMesEstandar),
    toleranciaLlegadaTardiaMinutos: Number(configuracionEmpresa.toleranciaLlegadaTardiaMinutos ?? REGLAS_POR_DEFECTO.toleranciaLlegadaTardiaMinutos),
    escalasVacaciones: Array.isArray(configuracionEmpresa.escalasVacaciones)
      ? configuracionEmpresa.escalasVacaciones
      : REGLAS_POR_DEFECTO.escalasVacaciones,
  };
};
