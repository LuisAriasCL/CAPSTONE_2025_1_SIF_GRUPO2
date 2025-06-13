# DataTable Component - Arquitectura Modularizada

## Descripción General

El componente DataTable ha sido refactorizado siguiendo principios de código limpio y arquitectura modular. La tabla compleja original se ha dividido en componentes más pequeños, especializados y reutilizables.

## Arquitectura de Componentes

### 1. DataTableComponent (Componente Principal)

**Archivo:** `data-table.component.ts`
**Responsabilidades:**

- Coordinación entre componentes hijo
- Gestión del estado de datos y paginación
- Emisión de eventos hacia el componente padre
- Renderizado de celdas de la tabla

### 2. TableHeaderComponent (Header Modular)

**Archivo:** `table-header.component.ts`
**Responsabilidades:**

- Renderizado del encabezado de la tabla
- Gestión de eventos de ordenamiento
- Indicadores visuales de ordenamiento (íconos, clases CSS)
- Accesibilidad (aria-sort)

### 3. TablePaginationComponent (Paginación Modular)

**Archivo:** `table-pagination.component.ts`
**Responsabilidades:**

- Controles de navegación entre páginas
- Selector de tamaño de página
- Información de paginación (X de Y registros)
- Cálculo de rangos de páginas visibles

### 4. TableExportComponent (Exportación Modular)

**Archivo:** `table-export.component.ts`
**Responsabilidades:**

- Botones de exportación (Excel, PDF)
- Botones de importación
- Emisión de eventos de exportación/importación

## Utilidades Centralizadas

### table-utils.ts

**Funciones implementadas:**

#### Acceso a Propiedades

- `getPropertyValue(obj, path)`: Accede a propiedades anidadas usando notación de puntos

#### Paginación

- `getPaginationRange(currentPage, totalPages, maxVisible)`: Calcula el rango de páginas visibles
- `getPaginationStart(currentPage, pageSize, hasData)`: Calcula el índice de inicio
- `getPaginationEnd(currentPage, pageSize, totalItems, hasData)`: Calcula el índice final
- `getPaginationTotal(totalItems, hasData)`: Obtiene el total de registros

#### Ordenamiento

- `getSortClass(column, sortColumn, sortDirection)`: Retorna la clase CSS del ordenamiento
- `getSortIcon(column, sortColumn, sortDirection)`: Retorna el ícono apropiado
- `getAriaSortValue(column, sortColumn, sortDirection)`: Valor para accesibilidad
- `isColumnSorted(column, sortColumn)`: Verifica si la columna está ordenada

## Tipos y Interfaces

### Interfaces Principales (components.types.ts)

```typescript
// Configuración de columnas
interface Column {
  header: string;
  field: string;
  sortable?: boolean;
  width?: string;
  cell?: (data: any) => string;
  isAction?: boolean;
}

// Botones de acción
interface ActionButton {
  label: string;
  icon: string;
  color: string;
  tooltip: string;
  cssClass?: string;
  onClick: (row: Vehiculo) => void;
}

// Eventos de paginación
interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

// Modelo de Vehículo
interface Vehiculo {
  idVehi?: number;
  patente: string;
  chasis: string;
  tipoVehi?: string | null;
  estadoVehi: EstadoVehiculo;
  tipoCombVehi?: TipoCombustibleVehiculo | null;
  kmVehi: number;
  marca: string;
  modelo: string;
  anio: number;
  kmVidaUtil?: number | null;
  efiComb?: number | null;
  fecAdqui: string; // Formato YYYY-MM-DD
}
```

## Flujo de Datos

```
VehicleListPage
       ↓ [data], [columns], [actionButtons]
DataTableComponent
       ↓ props & events
┌─────────────────────────────────────────┐
│ TableHeaderComponent                    │
│ TablePaginationComponent                │
│ TableExportComponent                    │
└─────────────────────────────────────────┘
       ↓ utiliza
table-utils.ts (funciones puras)
```

## Beneficios de la Arquitectura

### 1. Separación de Responsabilidades

- Cada componente tiene una responsabilidad específica
- Facilita el mantenimiento y testing
- Reduce el acoplamiento

### 2. Reutilización

- Los componentes hijo pueden usarse independientemente
- Las utilidades son funciones puras reutilizables
- Facilita la implementación de nuevas tablas

### 3. Testabilidad

- Funciones puras en utils son fáciles de testear
- Componentes pequeños permiten testing unitario enfocado
- Mocking simplificado para testing de integración

### 4. Mantenibilidad

- Código más legible y organizado
- Cambios localizados (un cambio en paginación solo afecta TablePaginationComponent)
- Facilita la adición de nuevas funcionalidades

## Integración con Vehicle List

La página `vehicle-list.page.ts` integra el DataTable modularizado:

```typescript
// Configuración de columnas
tableColumns: Column[] = [
  { header: 'Patente', field: 'patente', sortable: true },
  { header: 'Marca', field: 'marca', sortable: true },
  { header: 'Modelo', field: 'modelo', sortable: true },
  // ... más columnas
];

// Botones de acción
actionButtons: ActionButton[] = [
  {
    label: 'Ver',
    icon: 'eye-outline',
    color: 'primary',
    tooltip: 'Ver detalles',
    onClick: (row) => this.viewVehicle(row)
  },
  // ... más acciones
];
```

## Estado de Compilación

✅ **Compilación exitosa** - Sin errores de TypeScript
✅ **Tipos unificados** - Interfaces centralizadas en `components.types.ts`
✅ **Utilidades implementadas** - Funciones puras en `table-utils.ts`
✅ **Modularización completa** - Componentes especializados

## Próximos Pasos

1. **Testing unitario** para cada componente y utilidad
2. **Optimización de rendimiento** para grandes datasets
3. **Personalización de estilos** por componente
4. **Funcionalidades adicionales** (filtros, búsqueda global)
