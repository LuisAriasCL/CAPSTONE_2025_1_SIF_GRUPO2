import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { addIcons } from 'ionicons';
import {
  funnelOutline,
  searchOutline,
  refreshOutline,
  personCircleOutline,
  calendarOutline,
  carOutline,
  alertCircleOutline,
  hammerOutline,
  informationCircleOutline,
  personOutline,
  personRemoveOutline,
  saveOutline,
  carSportOutline,
  documentTextOutline,
  cameraOutline,
  closeOutline,
  sendOutline,
  colorPalette,
  warning,
  receiptOutline,
  water,
  documentText,
  camera,
  close,
} from 'ionicons/icons';

// Register Ionic icons for use in the app
addIcons({
  'funnel-outline': funnelOutline,
  'search-outline': searchOutline,
  'refresh-outline': refreshOutline,
  'person-circle-outline': personCircleOutline,
  'calendar-outline': calendarOutline,
  'car-outline': carOutline,
  'alert-circle-outline': alertCircleOutline,
  'hammer-outline': hammerOutline,
  'information-circle-outline': informationCircleOutline,
  'person-outline': personOutline,
  'person-remove-outline': personRemoveOutline,
  'save-outline': saveOutline,
  'car-sport-outline': carSportOutline,
  'document-text-outline': documentTextOutline,
  'camera-outline': cameraOutline,
  'close-outline': closeOutline,
  'send-outline': sendOutline,
  'color-palette': colorPalette,
  warning: warning,
  'receipt-outline': receiptOutline,
  water: water,
  'document-text': documentText,
  camera: camera,
  close: close,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
  ],
});
