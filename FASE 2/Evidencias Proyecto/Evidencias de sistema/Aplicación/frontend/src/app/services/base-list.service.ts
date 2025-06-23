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
    this.itemsSubject.next(items);
  }

  applyFilters(config: FilterConfig<T>) {
    let filtered = [...this.itemsSubject.value];

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
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const paginated = this.filteredItemsSubject.value.slice(
      startIndex,
      endIndex
    );
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
    const index = items.findIndex(predicate);
    if (index !== -1) {
      items[index] = updatedItem;
      this.itemsSubject.next([...items]);
    }
  }

  // Método para eliminar un elemento de la lista
  removeItem(predicate: (item: T) => boolean) {
    const items = this.itemsSubject.value.filter((item) => !predicate(item));
    this.itemsSubject.next(items);
  }
}
