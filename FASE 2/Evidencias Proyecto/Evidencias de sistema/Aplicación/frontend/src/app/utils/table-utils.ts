/**
 * Calcula el rango de páginas visibles para la paginación.
 */
export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  maxVisiblePages: number
): number[] {
  const range: number[] = [];
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Ajusta el rango si estamos cerca del final
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    range.push(i);
  }
  return range;
}

/**
 * Devuelve el índice de inicio de los registros mostrados en la página actual.
 */
export function getPaginationStart(
  currentPage: number,
  pageSize: number,
  hasData: boolean
): number {
  return hasData ? (currentPage - 1) * pageSize + 1 : 0;
}

/**
 * Devuelve el índice de fin de los registros mostrados en la página actual.
 */
export function getPaginationEnd(
  currentPage: number,
  pageSize: number,
  totalItems: number,
  hasData: boolean
): number {
  return hasData ? Math.min(currentPage * pageSize, totalItems) : 0;
}

/**
 * Devuelve el total de registros.
 */
export function getPaginationTotal(
  totalItems: number,
  hasData: boolean
): number {
  return hasData ? totalItems : 0;
}

/**
 * Helper para acceder a propiedades anidadas (ej: "user.address.street").
 */
export function getPropertyValue(obj: any, path: string): any {
  return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
}

/**
 * Helpers de ordenamiento para headers de tabla.
 */
export function getSortClass(
  column: any,
  sortColumn: string,
  sortDirection: 'asc' | 'desc'
): string | null {
  if (!column.sortable) return null;
  if (sortColumn === column.field) return sortDirection;
  return null;
}

export function isColumnSorted(column: any, sortColumn: string): boolean {
  return sortColumn === column.field;
}

export function getSortIcon(
  column: any,
  sortColumn: string,
  sortDirection: 'asc' | 'desc'
): string {
  if (!column.sortable) return '';
  if (sortColumn !== column.field) return 'swap-vertical-outline';
  return sortDirection === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline';
}

export function getAriaSortValue(
  column: any,
  sortColumn: string,
  sortDirection: 'asc' | 'desc'
): string {
  if (!column.sortable) return 'none';
  if (sortColumn !== column.field) return 'none';
  return sortDirection === 'asc' ? 'ascending' : 'descending';
}
