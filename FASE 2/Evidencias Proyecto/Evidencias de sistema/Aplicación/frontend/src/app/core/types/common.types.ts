export interface BaseEntity {
  id: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'textarea' | 'date' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validators?: any[];
}

export interface PageEvent {
  page: number;
  size: number;
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc';
}
