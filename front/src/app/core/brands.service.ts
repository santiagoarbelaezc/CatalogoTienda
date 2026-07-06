import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, share } from 'rxjs';
import { Marca } from '../models/catalog.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BrandsService {
  private _brands$ = new BehaviorSubject<Marca[]>([]);
  brands$ = this._brands$.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromServer();
  }

  loadFromServer(): void {
    this.http.get<any>(`${environment.apiUrl}/marcas`).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this._brands$.next(res.data);
        }
      },
      error: (err) => console.error('Error cargando marcas desde backend:', err)
    });
  }

  getAll(): Marca[] {
    return this._brands$.value;
  }

  createBrand(nombre: string): Observable<any> {
    const obs = this.http.post<any>(`${environment.apiUrl}/marcas`, { nombre: nombre.trim() }).pipe(
      tap(() => this.loadFromServer()),
      share()
    );
    obs.subscribe();
    return obs;
  }

  updateBrand(id: number, nombre: string): Observable<any> {
    const obs = this.http.put<any>(`${environment.apiUrl}/marcas/${id}`, { nombre: nombre.trim() }).pipe(
      tap(() => this.loadFromServer()),
      share()
    );
    obs.subscribe();
    return obs;
  }

  deleteBrand(id: number): Observable<any> {
    const obs = this.http.delete<any>(`${environment.apiUrl}/marcas/${id}`).pipe(
      tap(() => this.loadFromServer()),
      share()
    );
    obs.subscribe();
    return obs;
  }
}
