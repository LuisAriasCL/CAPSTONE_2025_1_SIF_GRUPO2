# Instrucciones para corregir ion-select en todos los formularios

## Problemas identificados y soluciones

### 1. FormGroup con valores iniciales incorrectos

**❌ INCORRECTO:**

```typescript
this.vehicleForm = this.formBuilder.group({
  estado: ["Disponible", [Validators.required]], // Valor por defecto fijo
  tipoVehiculo: ["", [Validators.required]],
});
```

**✅ CORRECTO:**

```typescript
this.vehicleForm = this.formBuilder.group({
  estado: ["", [Validators.required]], // Valor inicial vacío para placeholder
  tipoVehiculo: ["", [Validators.required]],
});
```

### 2. Función compareWith faltante

**Agregar en cada componente con ion-select:**

```typescript
// Función compareWith necesaria para ion-select
compareWith = (o1: any, o2: any) => {
  return o1 === o2;
};

// Método para manejar cambios (opcional pero recomendado)
onSelectChange(event: any, controlName: string) {
  console.log(`${controlName} cambió a:`, event.detail.value);
  this.formulario.get(controlName)?.setValue(event.detail.value);
}
```

### 3. HTML de ion-select correcto

**❌ INCORRECTO:**

```html
<ion-select formControlName="estado">
  <ion-select-option value="activo">Activo</ion-select-option>
</ion-select>
```

**✅ CORRECTO:**

```html
<ion-select formControlName="estado" placeholder="Seleccione un estado" fill="outline" interface="popover" [compareWith]="compareWith" (selectionChange)="onSelectChange($event, 'estado')" [class.ion-invalid]="formulario.get('estado')?.invalid && formulario.get('estado')?.touched" [class.ion-valid]="formulario.get('estado')?.valid && formulario.get('estado')?.touched">
  <ion-select-option *ngFor="let opcion of estadoOpciones" [value]="opcion.value"> {{ opcion.label }} </ion-select-option>
</ion-select>
```

## Archivos a modificar:

### 1. Formulario de Vehículos

- **Archivo TS**: Agregar compareWith y corregir FormGroup
- **Archivo HTML**: Corregir estructura de ion-select

### 2. Formulario de Planificación

- **Archivo TS**: Agregar compareWith y corregir FormGroup
- **Archivo HTML**: Corregir estructura de ion-select

### 3. Formulario de Orden de Trabajo

- **Archivo TS**: Agregar compareWith y corregir FormGroup
- **Archivo HTML**: Corregir estructura de ion-select

### 4. Formulario de Asignación

- **Archivo TS**: Agregar compareWith y corregir FormGroup
- **Archivo HTML**: Corregir estructura de ion-select

### 5. Formulario de Siniestros

- **Archivo TS**: Agregar compareWith y corregir FormGroup
- **Archivo HTML**: Corregir estructura de ion-select

### 6. Formulario de Usuarios

- **Archivo TS**: Agregar compareWith y corregir FormGroup
- **Archivo HTML**: Corregir estructura de ion-select

## Verificaciones post-corrección:

1. **Verificar en consola del navegador:**

   - Los valores se imprimen correctamente en onSubmit
   - No hay errores de binding

2. **Verificar visualmente:**

   - Los placeholders se muestran correctamente
   - Los valores seleccionados se mantienen
   - Las validaciones funcionan

3. **Verificar en el formulario:**
   - Los datos se envían correctamente al backend
   - Los valores de select están incluidos en el objeto final

## Comando para verificar:

```typescript
onSubmit() {
  if (this.formulario.valid) {
    console.log('Todos los valores:', this.formulario.value);
    console.log('Estado específico:', this.formulario.get('estado')?.value);
    console.log('Tipo específico:', this.formulario.get('tipo')?.value);
    // Enviar datos...
  }
}
```
