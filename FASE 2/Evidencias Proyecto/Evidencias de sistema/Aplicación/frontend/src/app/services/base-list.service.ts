import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FilterConfig<T> {
  searchFields: (keyof T)[];
  customFilters?: { [key: string]: (item: T, value: any) => boolean };
}

@Injectable({
  providedIn: 'root',
})
export class BaseListService<T> {
  private itemsSubject = new BehaviorSubject<T[]>([]);
  private filteredItemsSubject = new BehaviorSubject<T[]>([]);
  private paginatedItemsSubject = new BehaviorSubject<T[]>([]);

  items$ = this.itemsSubject.asObservable();
  filteredItems$ = this.filteredItemsSubject.asObservable();
  paginatedItems$ = this.paginatedItemsSubject.asObservable();

  // Estado de filtros y paginación
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalFilteredItems = 0;
  filters: { [key: string]: any } = {};

  get items() {
    return this.itemsSubject.value;
  }

  get filteredItems() {
    return this.filteredItemsSubject.value;
  }

  get paginatedItems() {
    return this.paginatedItemsSubject.value;
  }

  setItems(items: T[]) {
    // Asegurar que items sea un array válido
    const validItems = Array.isArray(items) ? items : [];
    this.itemsSubject.next(validItems);
  }

  applyFilters(config: FilterConfig<T>) {
    const currentItems = this.itemsSubject.value;

    // Verificar que itemsSubject.value sea un array válido
    if (!Array.isArray(currentItems)) {
      console.warn(
        'BaseListService: itemsSubject.value no es un array válido:',
        currentItems
      );
      this.filteredItemsSubject.next([]);
      this.totalFilteredItems = 0;
      this.totalPages = 0;
      this.currentPage = 1;
      this.updatePaginatedData();
      return;
    }

    let filtered = [...currentItems];

    // Filtro de búsqueda por texto
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        config.searchFields.some((field) => {
          const value = item[field];
          return value?.toString().toLowerCase().includes(term);
        })
      );
    }

    // Aplicar filtros personalizados
    if (config.customFilters) {
      Object.entries(this.filters).forEach(([key, value]) => {
        if (value && config.customFilters![key]) {
          filtered = filtered.filter((item) =>
            config.customFilters![key](item, value)
          );
        }
      });
    }

    this.filteredItemsSubject.next(filtered);
    this.totalFilteredItems = filtered.length;
    this.totalPages = Math.ceil(this.totalFilteredItems / this.pageSize);
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const filteredItems = this.filteredItemsSubject.value;

    // Verificar que filteredItems sea un array válido
    if (!Array.isArray(filteredItems)) {
      this.paginatedItemsSubject.next([]);
      return;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const paginated = filteredItems.slice(startIndex, endIndex);
    this.paginatedItemsSubject.next(paginated);
  }

  setFilter(key: string, value: any) {
    this.filters[key] = value;
  }

  clearFilters() {
    this.searchTerm = '';
    this.filters = {};
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  // Método para actualizar un elemento específico en la lista
  updateItem(predicate: (item: T) => boolean, updatedItem: T) {
    const items = this.itemsSubject.value;

    if (!Array.isArray(items)) {
      console.warn('BaseListService.updateItem: items no es un array válido');
      return;
    }

    const index = items.findIndex(predicate);
    if (index !== -1) {
      items[index] = updatedItem;
      this.itemsSubject.next([...items]);
    }
  }

  // Método para eliminar un elemento de la lista
  removeItem(predicate: (item: T) => boolean) {
    const currentItems = this.itemsSubject.value;

    if (!Array.isArray(currentItems)) {
      console.warn('BaseListService.removeItem: items no es un array válido');
      return;
    }

    const items = currentItems.filter((item) => !predicate(item));
    this.itemsSubject.next(items);
  }
}
