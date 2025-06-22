# Estructura de Proyecto Reorganizada

## 📁 Organización de Carpetas

```
frontend/src/app/
├── core/                           # 🏗️ NÚCLEO DEL SISTEMA
│   ├── base/                      # Clases base reutilizables
│   │   ├── crud-base.component.ts # Componente base para CRUD
│   │   └── base-form.component.ts # Formulario base
│   ├── services/                  # Servicios principales
│   │   ├── api.service.ts         # Servicio API principal
│   │   ├── user.service.ts        # Gestión de usuarios
│   │   ├── vehicle.service.ts     # Gestión de vehículos
│   │   ├── maintenance.service.ts # Gestión de mantenimiento
│   │   ├── assignment.service.ts  # Gestión de asignaciones
│   │   ├── form-manager.service.ts# Gestión de formularios
│   │   ├── alert.service.ts       # Alertas y notificaciones
│   │   ├── socket.service.ts      # WebSocket
│   │   └── index.ts              # Exports del módulo
│   ├── types/                     # Definiciones de tipos
│   │   ├── user.types.ts         # Tipos de usuario
│   │   ├── vehicle.types.ts      # Tipos de vehículo
│   │   ├── route.types.ts        # Tipos de rutas
│   │   ├── maintenance.types.ts  # Tipos de mantenimiento
│   │   ├── assignment.types.ts   # Tipos de asignaciones
│   │   ├── common.types.ts       # Tipos comunes
│   │   └── index.ts              # Exports del módulo
│   ├── constants/                 # Constantes del sistema
│   │   ├── app.constants.ts      # Constantes de aplicación
│   │   ├── user.constants.ts     # Constantes de usuario
│   │   ├── vehicle.constants.ts  # Constantes de vehículo
│   │   ├── maintenance.constants.ts # Constantes de mantenimiento
│   │   ├── assignment.constants.ts # Constantes de asignaciones
│   │   ├── alert.constants.ts    # Constantes de alertas
│   │   └── index.ts              # Exports del módulo
│   ├── utils/                     # Utilidades
│   │   ├── form.utils.ts         # Utilidades de formularios
│   │   ├── form.validators.ts    # Validadores personalizados
│   │   ├── date.utils.ts         # Utilidades de fecha
│   │   └── index.ts              # Exports del módulo
│   └── index.ts                   # Exports principales del core
│
├── shared/                        # 🔄 COMPONENTES COMPARTIDOS
│   ├── components/               # Componentes reutilizables
│   │   ├── form-field/           # Campo de formulario
│   │   ├── modal-components/     # Componentes modales
│   │   │   ├── modal-header/     # Header modal
│   │   │   ├── modal-footer/     # Footer modal
│   │   │   └── index.ts          # Exports modales
│   │   ├── header/               # Header principal
│   │   ├── sidebar/              # Sidebar navegación
│   │   ├── data-table/           # Tabla de datos
│   │   ├── dropdown-usuario/     # Dropdown usuario
│   │   ├── alerta-personalizada/ # Alertas personalizadas
│   │   ├── icono-alerta/         # Iconos de alerta
│   │   ├── page-header/          # Header de página
│   │   ├── usuario-form/         # Formulario usuario
│   │   └── index.ts              # Exports de componentes
│   ├── guards/                   # Guards de autenticación
│   │   ├── auth.guard.ts         # Guard principal
│   │   ├── conductor.guard.ts    # Guard conductor
│   │   ├── gestor.guard.ts       # Guard gestor
│   │   ├── tecnico.guard.ts      # Guard técnico
│   │   └── index.ts              # Exports de guards
│   ├── pipes/                    # Pipes personalizados
│   │   ├── vehicle-status.pipe.ts # Estado vehículo
│   │   ├── vehicle-type.pipe.ts  # Tipo vehículo
│   │   └── index.ts              # Exports de pipes
│   └── index.ts                  # Exports principales del shared
│
├── features/                      # 🎯 CARACTERÍSTICAS/MÓDULOS
│   ├── vehicle-management/       # 🚗 GESTIÓN DE VEHÍCULOS
│   │   ├── vehicle-form/         # Formulario vehículo
│   │   └── historial-vehiculo/   # Historial vehículo
│   ├── maintenance/              # 🔧 GESTIÓN DE MANTENIMIENTO
│   │   ├── planificacion-form/   # Formulario planificación
│   │   ├── planificacion-list/   # Lista planificación
│   │   ├── orden-trabajo-detalle/ # Detalle orden trabajo
│   │   └── orden-trabajo-list/   # Lista órdenes trabajo
│   ├── route-management/         # 🗺️ GESTIÓN DE RUTAS
│   │   ├── route-form/           # Formulario ruta
│   │   ├── route-list/           # Lista rutas
│   │   ├── asignacion-form/      # Formulario asignación
│   │   ├── asignacion-list/      # Lista asignaciones
│   │   └── recorridos/           # Recorridos
│   ├── user-management/          # 👥 GESTIÓN DE USUARIOS
│   │   └── gestion-usuarios/     # Lista usuarios
│   ├── incident-management/      # 🚨 GESTIÓN DE SINIESTROS
│   │   ├── siniestro-form/       # Formulario siniestro
│   │   ├── siniestro-detalle/    # Detalle siniestro
│   │   └── gestion-siniestros/   # Lista siniestros
│   ├── fuel-management/          # ⛽ GESTIÓN DE COMBUSTIBLE
│   │   └── combustible-form/     # Formulario combustible
│   └── mobile/                   # 📱 VISTAS MÓVILES
│       ├── home-movil/           # Home móvil
│       ├── combustible-movil/    # Combustible móvil
│       ├── incidente-movil/      # Incidentes móvil
│       ├── historial-combustible/ # Historial combustible
│       ├── servicios-tecnico-movil/ # Servicios técnico
│       └── servicio-detalle-movil/ # Detalle servicio
│
├── pages/                         # 📄 PÁGINAS PRINCIPALES
│   ├── login/                    # Login
│   ├── register/                 # Registro
│   ├── dashboard/                # Dashboard
│   └── (otros...)                # Otras páginas generales
│
├── modals/                        # 🪟 MODALES ESPECÍFICOS
│   └── route-simulation-modal.component.ts
│
├── app.component.ts              # Componente principal
├── app.routes.ts                 # Rutas principales
└── ...                           # Otros archivos raíz
```

## 🏗️ Patrón CRUD Base

### Todos los formularios ahora extienden `CrudBaseComponent`:

```typescript
export class VehicleFormPage extends CrudBaseComponent {
  // Métodos requeridos:
  get title(): string {
    return "Vehículo";
  }
  createForm(): FormGroup {
    /* ... */
  }
  saveItem(data: any): Observable<any> {
    /* ... */
  }
  updateItem(id: any, data: any): Observable<any> {
    /* ... */
  }
  override getItem(id: any): Observable<any> {
    /* ... */
  }
}
```

### Uso en templates:

```html
<!-- Usar onSave() para guardar (sin argumentos) -->
<ion-button (click)="onSave()" [disabled]="isLoading"> Guardar </ion-button>
```

## 📦 Imports Actualizados

### Core:

```typescript
import { CrudBaseComponent } from "@app/core";
import { ApiService, UserService } from "@app/core/services";
import { UserType, VehicleStatus } from "@app/core/types";
import { USER_ROLES } from "@app/core/constants";
import { FormUtils } from "@app/core/utils";
```

### Shared:

```typescript
import {
  FormFieldComponent,
  ModalHeaderComponent,
} from "@app/shared/components";
import { AuthGuard, ConductorGuard } from "@app/shared/guards";
import { VehicleStatusPipe } from "@app/shared/pipes";
```

## 🎯 Beneficios de la Nueva Estructura

1. **Separación clara** entre core, shared y features
2. **Reutilización** mejorada de componentes y servicios
3. **Escalabilidad** facilitada para nuevas características
4. **Mantenimiento** simplificado con CRUD Base pattern
5. **Imports organizados** con index files
6. **Consistencia** en naming conventions

## 🔄 Flujo de Desarrollo

1. **Core**: Servicios y utilidades fundamentales
2. **Shared**: Componentes reutilizables entre features
3. **Features**: Funcionalidades específicas del negocio
4. **CRUD Base**: Patrón consistente para formularios

## 📝 Convenciones

- **Archivos**: kebab-case (vehicle-form.page.ts)
- **Clases**: PascalCase (VehicleFormPage)
- **Métodos**: camelCase (createForm, onSave)
- **Constantes**: UPPER_SNAKE_CASE (USER_ROLES)
- **Exports**: index.ts en cada carpeta principal

Esta estructura garantiza un código más limpio, mantenible y escalable.
