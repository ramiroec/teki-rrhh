export function numeroALetras(monto: number): string {
  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales = ['once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const entero = Math.floor(monto);
  if (entero === 0) return 'Cero guaraníes';

  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const resto = entero % 1000;

  let resultado = '';

  function convertirCentena(num: number): string {
    if (num === 100) return 'cien';
    let s = '';
    const c = Math.floor(num / 100);
    const d = Math.floor((num % 100) / 10);
    const u = num % 10;

    if (c > 0) s += centenas[c] + ' ';
    if (d === 1 && u > 0) {
      s += especiales[u - 1];
    } else if (d > 0) {
      s += decenas[d];
      if (u > 0) s += ' y ' + unidades[u];
    } else if (u > 0) {
      s += unidades[u];
    }
    return s.trim();
  }

  if (millones > 0) {
    if (millones === 1) resultado += 'un millón ';
    else resultado += convertirCentena(millones) + ' millones ';
  }

  if (miles > 0) {
    if (miles === 1) resultado += 'mil ';
    else resultado += convertirCentena(miles) + ' mil ';
  }

  if (resto > 0) {
    resultado += convertirCentena(resto);
  }

  const texto = resultado.trim() + ' guaraníes';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
