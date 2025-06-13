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

//importar íconos de ionic de forma global
import { addIcons } from 'ionicons';

//importar íconos específicos de ionic
import {
  gridOutline,
  newspaperOutline,
  buildOutline,
  flameOutline,
  carOutline,
  peopleOutline,
  navigateOutline,
  warningOutline,
  mapOutline,
  businessOutline,
  lockClosedOutline,
  mailOutline,
  logInOutline,
  eyeOutline,
  createOutline,
  trashOutline,
  addCircleOutline,
  calendarOutline,
  listOutline,
  timeOutline,
  shieldCheckmarkOutline,
  powerOutline,
  documentTextOutline,
  checkboxOutline,
  calendarNumberOutline,
  settingsOutline,
  constructOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  helpCircleOutline,
  informationCircleOutline,
  logOutOutline,
  chevronDownOutline,
  personOutline,
  cloudUploadOutline,
  documentOutline,
} from 'ionicons/icons';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
  ],
});

// Registrar íconos personalizados
addIcons({
  gridOutline,
  newspaperOutline,
  buildOutline,
  flameOutline,
  carOutline,
  peopleOutline,
  navigateOutline,
  warningOutline,
  mapOutline,
  businessOutline,
  lockClosedOutline,
  mailOutline,
  logInOutline,
  eyeOutline,
  createOutline,
  trashOutline,
  addCircleOutline,
  calendarOutline,
  listOutline,
  timeOutline,
  shieldCheckmarkOutline,
  powerOutline,
  documentTextOutline,
  checkboxOutline,
  calendarNumberOutline,
  settingsOutline,
  constructOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  helpCircleOutline,
  informationCircleOutline,
  logOutOutline,
  chevronDownOutline,
  personOutline,
  cloudUploadOutline,
  documentOutline,
});
