// title.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  private pageTitle = new BehaviorSubject<string>('Sistema Integral de Flota'); // Default title
  public pageTitle$: Observable<string> = this.pageTitle.asObservable();

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        mergeMap((route) => route.data), // Asumiendo que el título está en route.data.title
        map((data) => data['title'] || 'Sistema Integral de Flota') // Usar título de data o default
      )
      .subscribe((title: string) => {
        this.pageTitle.next(title);
      });
  }

  // Opcional: método para establecer el título programáticamente si es necesario
  setTitle(newTitle: string) {
    this.pageTitle.next(newTitle);
  }
}
