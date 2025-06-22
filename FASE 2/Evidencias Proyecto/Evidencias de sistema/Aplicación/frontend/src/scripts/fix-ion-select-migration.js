#!/usr/bin/env node

/**
 * Script de migración para corregir ion-select en todos los formularios
 * Este script aplica automáticamente las correcciones necesarias
 */

const fs = require('fs');
const path = require('path');

// Configuración de archivos a modificar
const FORM_FILES = [
  {
    name: 'Vehicle Form',
    tsPath: 'src/app/vehicles/vehicle-form/vehicle-form.page.ts',
    htmlPath: 'src/app/vehicles/vehicle-form/vehicle-form.page.html',
    selectFields: ['estado', 'tipoVehiculo']
  },
  {
    name: 'Planificacion Form', 
    tsPath: 'src/app/planificacion/planificacion-form/planificacion-form.page.ts',
    htmlPath: 'src/app/planificacion/planificacion-form/planificacion-form.page.html',
    selectFields: ['vehiculo', 'conductor', 'estado']
  },
  {
    name: 'Orden Trabajo Form',
    tsPath: 'src/app/orden-trabajo/orden-trabajo-form/orden-trabajo-form.page.ts', 
    htmlPath: 'src/app/orden-trabajo/orden-trabajo-form/orden-trabajo-form.page.html',
    selectFields: ['vehiculo', 'tipo', 'prioridad', 'estado']
  },
  {
    name: 'Asignacion Form',
    tsPath: 'src/app/asignacion/asignacion-form/asignacion-form.page.ts',
    htmlPath: 'src/app/asignacion/asignacion-form/asignacion-form.page.html', 
    selectFields: ['conductor', 'vehiculo', 'estado']
  },
  {
    name: 'Siniestro Form',
    tsPath: 'src/app/siniestros/siniestro-form/siniestro-form.page.ts',
    htmlPath: 'src/app/siniestros/siniestro-form/siniestro-form.page.html',
    selectFields: ['vehiculo', 'tipo', 'gravedad', 'estado']
  },
  {
    name: 'Usuario Form',
    tsPath: 'src/app/usuarios/usuario-form/usuario-form.page.ts',
    htmlPath: 'src/app/usuarios/usuario-form/usuario-form.page.html',
    selectFields: ['rol', 'estado']
  }
];

/**
 * Correcciones para archivos TypeScript
 */
function getTypescriptCorrections() {
  return {
    // Agregar importación del servicio
    addImport: `import { FormSelectService, BaseFormComponent } from '../../shared/services/form-select.service';`,
    
    // Función compareWith
    addCompareWith: `
  // Función compareWith necesaria para ion-select
  compareWith = FormSelectService.compareWith;`,
    
    // Método onSelectChange
    addSelectChangeMethod: `
  // Método para manejar cambios en ion-select
  onSelectChange(event: any, controlName: string) {
    FormSelectService.onSelectChange(event, controlName, this.formulario);
  }`,
    
    // Corrección en onSubmit para debug
    addDebugInSubmit: `
    // Debug de valores antes de enviar
    FormSelectService.debugFormValues(this.formulario, 'Formulario');`,
    
    // Patrón para corregir FormGroup con valores iniciales
    formGroupPattern: /(\w+):\s*\[['"][^'"]*['"],\s*\[Validators\.required\]\]/g,
    formGroupReplacement: "$1: ['', [Validators.required]]"
  };
}

/**
 * Correcciones para archivos HTML
 */
function getHtmlCorrections() {
  return {
    // Patrón para ion-select básico
    basicSelectPattern: /<ion-select\s+formControlName="(\w+)"[^>]*>/g,
    
    // Reemplazo para ion-select mejorado
    improvedSelectTemplate: `<ion-select 
  formControlName="$1"
  placeholder="Seleccione una opción"
  fill="outline"
  interface="popover"
  [compareWith]="compareWith"
  (selectionChange)="onSelectChange($event, '$1')"
  [class.ion-invalid]="formulario.get('$1')?.invalid && formulario.get('$1')?.touched"
  [class.ion-valid]="formulario.get('$1')?.valid && formulario.get('$1')?.touched">`
  };
}

/**
 * Aplica correcciones a un archivo TypeScript
 */
function fixTypescriptFile(filePath, selectFields) {
  console.log(`🔧 Corrigiendo archivo TS: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const corrections = getTypescriptCorrections();
  
  // Agregar importación si no existe
  if (!content.includes('FormSelectService')) {
    const importIndex = content.indexOf('import {') > -1 ? 
      content.lastIndexOf('import {') : 
      content.indexOf("import '");
    
    if (importIndex > -1) {
      const insertPoint = content.indexOf('\n', importIndex) + 1;
      content = content.slice(0, insertPoint) + corrections.addImport + '\n' + content.slice(insertPoint);
    }
  }
  
  // Agregar compareWith si no existe
  if (!content.includes('compareWith =')) {
    const classStart = content.indexOf('export class');
    const openBrace = content.indexOf('{', classStart);
    const insertPoint = content.indexOf('\n', openBrace) + 1;
    content = content.slice(0, insertPoint) + corrections.addCompareWith + '\n' + content.slice(insertPoint);
  }
  
  // Agregar onSelectChange si no existe
  if (!content.includes('onSelectChange(')) {
    const constructorEnd = content.lastIndexOf('}', content.indexOf('ngOnInit'));
    if (constructorEnd > -1) {
      content = content.slice(0, constructorEnd) + corrections.addSelectChangeMethod + '\n\n' + content.slice(constructorEnd);
    }
  }
  
  // Corregir FormGroup - cambiar valores iniciales por strings vacíos
  selectFields.forEach(field => {
    const fieldPattern = new RegExp(`${field}:\\s*\\[['"][^'"]*['"],\\s*\\[Validators\\.required\\]\\]`, 'g');
    content = content.replace(fieldPattern, `${field}: ['', [Validators.required]]`);
  });
  
  // Agregar debug en onSubmit si no existe
  if (content.includes('onSubmit()') && !content.includes('debugFormValues')) {
    const submitStart = content.indexOf('onSubmit()');
    const submitBody = content.indexOf('{', submitStart);
    const insertPoint = content.indexOf('\n', submitBody) + 1;
    content = content.slice(0, insertPoint) + '    ' + corrections.addDebugInSubmit.trim() + '\n' + content.slice(insertPoint);
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Archivo TS corregido: ${filePath}`);
  return true;
}

/**
 * Aplica correcciones a un archivo HTML
 */
function fixHtmlFile(filePath, selectFields) {
  console.log(`🔧 Corrigiendo archivo HTML: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const corrections = getHtmlCorrections();
  
  // Mejorar ion-select básicos
  selectFields.forEach(field => {
    const basicPattern = new RegExp(`<ion-select\\s+formControlName="${field}"[^>]*>`, 'g');
    const replacement = corrections.improvedSelectTemplate.replace(/\$1/g, field);
    content = content.replace(basicPattern, replacement);
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Archivo HTML corregido: ${filePath}`);
  return true;
}

/**
 * Ejecuta la migración completa
 */
function runMigration() {
  console.log('🚀 Iniciando migración de ion-select...\n');
  
  let fixedFiles = 0;
  let totalFiles = 0;
  
  FORM_FILES.forEach(formFile => {
    console.log(`\n📝 Procesando: ${formFile.name}`);
    
    // Corregir archivo TypeScript
    totalFiles++;
    if (fixTypescriptFile(formFile.tsPath, formFile.selectFields)) {
      fixedFiles++;
    }
    
    // Corregir archivo HTML
    totalFiles++;
    if (fixHtmlFile(formFile.htmlPath, formFile.selectFields)) {
      fixedFiles++;
    }
  });
  
  console.log(`\n🎉 Migración completada!`);
  console.log(`📊 Archivos procesados: ${fixedFiles}/${totalFiles}`);
  console.log(`\n📋 Próximos pasos:`);
  console.log(`1. Revisar los cambios en cada archivo`);
  console.log(`2. Probar los formularios en el navegador`); 
  console.log(`3. Verificar que los valores se guarden correctamente`);
  console.log(`4. Revisar la consola para logs de debug`);
}

// Ejecutar migración si el script es llamado directamente
if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  fixTypescriptFile,
  fixHtmlFile,
  FORM_FILES
};