/**
 * Utilidades para el manejo de fechas en la aplicación
 */

/**
 * Formatea una fecha al formato YYYY-MM-DD para inputs de tipo date
 * @param date Fecha a formatear
 * @returns Fecha formateada como string en formato YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Devuelve la fecha actual formateada para inputs de tipo date (YYYY-MM-DD)
 */
export const currentDate = formatDate(new Date());

/**
 * Formatea una fecha para mostrar en la UI (DD/MM/YYYY)
 * @param dateString Fecha en formato string
 * @returns Fecha formateada para mostrar al usuario
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Parsea una fecha en formato DD/MM/YYYY a un objeto Date
 * @param dateString Fecha en formato DD/MM/YYYY
 * @returns Objeto Date
 */
export function parseDisplayDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  
  return new Date(year, month, day);
}
