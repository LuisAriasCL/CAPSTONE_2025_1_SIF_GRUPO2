import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  kilometrajeValidator, 
  kilometrajeFinalMayorQueInicialValidator,
  fechaFinalPosteriorAInicialValidator,
  rangeValidator 
} from '../utils';
import { currentDate } from '../utils';

@Injectable({
  providedIn: 'root'
})
export class FormManagerService {
  private fb = inject(FormBuilder);
  createVehicleForm(item: any = null): FormGroup {
    return this.fb.group({
      patente: [item?.patente || '', [Validators.required, Validators.minLength(6), Validators.maxLength(8)]],
      marca: [item?.marca || '', [Validators.required, Validators.maxLength(50)]],
      modelo: [item?.modelo || '', [Validators.required, Validators.maxLength(50)]],
      anio: [item?.anio || '', [Validators.required, Validators.min(1990), Validators.max(new Date().getFullYear())]],
      tipo: [item?.tipo || '', Validators.required],
      estado: [item?.estado || 'Disponible', Validators.required],
      capacidad_pasajeros: [item?.capacidad_pasajeros || '', [Validators.required, Validators.min(1), Validators.max(50)]],
      kilometraje_actual: [item?.kilometraje_actual || 0, [Validators.required, Validators.min(0)]],
      fecha_ultima_revision: [item?.fecha_ultima_revision || '', Validators.required],
      fecha_vencimiento_revision: [item?.fecha_vencimiento_revision || '', Validators.required]
    });
  }

  createUserForm(item: any = null): FormGroup {
    return this.fb.group({
      pri_nom_usu: [item?.pri_nom_usu || '', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      pri_ape_usu: [item?.pri_ape_usu || '', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: [item?.email || '', [Validators.required, Validators.email]],
      rol: [item?.rol || '', Validators.required],
      clave: [item?.clave || '', item ? [] : [Validators.required, Validators.minLength(6)]]
    });
  }

  createRouteForm(item: any = null): FormGroup {
    return this.fb.group({
      nombre: [item?.nombre || '', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      origen: [item?.origen || '', [Validators.required, Validators.maxLength(255)]],
      destino: [item?.destino || '', [Validators.required, Validators.maxLength(255)]],
      distancia_km: [item?.distancia_km || '', [Validators.required, Validators.min(0.1)]],
      tiempo_estimado: [item?.tiempo_estimado || '', [Validators.required, Validators.min(1)]],
      descripcion: [item?.descripcion || '', Validators.maxLength(500)],
      puntos_intermedios: [item?.puntos_intermedios || ''],
      estado: [item?.estado || 'Activa', Validators.required]
    });
  }

  createAssignmentForm(item: any = null, isViewMode = false): FormGroup {
    const formState = { value: '', disabled: isViewMode };
    
    return this.fb.group({
      usuarioIdUsu: [item?.usuarioIdUsu || formState, Validators.required],
      rutaIdRuta: [item?.rutaIdRuta || formState, Validators.required],
      vehiculoIdVehi: [item?.vehiculoIdVehi || formState, Validators.required],
      fecIniRecor: [
        { value: item?.fecIniRecor || currentDate, disabled: isViewMode }, 
        Validators.required
      ],
      fecFinRecor: [
        { value: item?.fecFinRecor || '', disabled: isViewMode },
        Validators.required
      ],
      kmIniRecor: [
        { value: item?.kmIniRecor || '', disabled: isViewMode },
        [Validators.required, kilometrajeValidator]
      ],
      kmFinRecor: [
        { value: item?.kmFinRecor || '', disabled: isViewMode },
        [Validators.required, kilometrajeValidator]
      ],
      observaciones: [
        { value: item?.observaciones || '', disabled: isViewMode },
        [Validators.maxLength(500)]
      ]
    }, {
      validators: [
        kilometrajeFinalMayorQueInicialValidator('kmIniRecor', 'kmFinRecor'),
        fechaFinalPosteriorAInicialValidator('fecIniRecor', 'fecFinRecor')
      ]
    });
  }

  createMaintenanceForm(item: any = null, isViewMode = false): FormGroup {
    return this.fb.group({
      vehiculosIds: [item?.vehiculosIds || [], Validators.required],
      nombre: [
        { value: item?.nombre || '', disabled: isViewMode },
        [Validators.required, Validators.minLength(5), Validators.maxLength(150)]
      ],
      descripcion: [
        { value: item?.descripcion || '', disabled: isViewMode },
        [Validators.required, Validators.minLength(10), Validators.maxLength(255)]
      ],
      tipo: [
        { value: item?.tipo || 'Preventivo', disabled: isViewMode },
        Validators.required
      ],
      prioridad: [
        { value: item?.prioridad || 'Media', disabled: isViewMode },
        Validators.required
      ],
      fechaInicio: [
        { value: item?.fechaInicio || currentDate, disabled: isViewMode },
        Validators.required
      ],
      tipoFrecuencia: [
        { value: item?.tipoFrecuencia || 'Dias', disabled: isViewMode },
        Validators.required
      ],
      frecuencia: [
        { value: item?.frecuencia || 30, disabled: isViewMode },
        [Validators.required, Validators.min(1)]
      ],
      estado: [
        { value: item?.estado || 'Activa', disabled: isViewMode },
        Validators.required
      ]
    });
  }
  createSiniestroForm(item: any = null): FormGroup {
    return this.fb.group({
      vehiculoId: [item?.vehiculoId || '', Validators.required],
      conductorId: [item?.conductorId || '', Validators.required],
      fechaSiniestro: [item?.fechaSiniestro || currentDate, Validators.required],
      ubicacion: [item?.ubicacion || '', [Validators.required, Validators.maxLength(255)]],
      descripcion: [item?.descripcion || '', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      gravedad: [item?.gravedad || '', Validators.required],
      dañosMateriales: [item?.dañosMateriales || false],
      lesionesPersonales: [item?.lesionesPersonales || false],
      involucradosTerceros: [item?.involucradosTerceros || false],
      montoEstimado: [item?.montoEstimado || 0, [Validators.min(0)]],
      estado: [item?.estado || 'Pendiente', Validators.required]
    });
  }

  createCombustibleForm(item: any = null): FormGroup {
    return this.fb.group({
      vehiculoId: [item?.vehiculoId || '', Validators.required],
      fecha: [item?.fecha || currentDate, Validators.required],
      tipoCombustible: [item?.tipoCombustible || '', Validators.required],
      litros: [item?.litros || '', [Validators.required, Validators.min(0.1)]],
      precioLitro: [item?.precioLitro || '', [Validators.required, Validators.min(0.1)]],
      total: [item?.total || '', [Validators.required, Validators.min(0.1)]],
      kilometraje: [item?.kilometraje || '', [Validators.required, Validators.min(0)]],
      estacionServicio: [item?.estacionServicio || '', [Validators.required, Validators.maxLength(100)]],
      numeroFactura: [item?.numeroFactura || '', Validators.maxLength(50)],
      observaciones: [item?.observaciones || '', Validators.maxLength(500)]
    });
  }
}
