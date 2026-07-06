import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, share } from 'rxjs';
import { Producto } from '../models/catalog.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private _products$ = new BehaviorSubject<Producto[]>([]);
  products$ = this._products$.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromServer();
  }

  private normalizeProducts(products: any[]): Producto[] {
    const defaultImg = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
    return products.map(p => {
      if (!p.imagenes || !Array.isArray(p.imagenes) || p.imagenes.length === 0) {
        p.imagenes = [{ id: 0, url: defaultImg, es_principal: true }];
      }
      return p as Producto;
    });
  }

  loadFromServer(): void {
    this.http.get<any>(`${environment.apiUrl}/productos`).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          const normalized = this.normalizeProducts(res.data);
          this._products$.next(normalized);
        }
      },
      error: (err) => console.error('Error cargando productos desde backend:', err)
    });
  }

  getAll(): Producto[] {
    return this._products$.value;
  }

  getById(id: number): Producto | undefined {
    return this._products$.value.find(p => p.id === id);
  }

  getByIdFromServer(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/productos/${id}`).pipe(
      tap(res => {
        if (res && res.success && res.data) {
          const norm = this.normalizeProducts([res.data]);
          res.data = norm[0];
        }
      })
    );
  }

  private transformPayload(data: any): any {
    const payload: any = { ...data };
    if (data.categoria && data.categoria.id) payload.id_categoria = data.categoria.id;
    if (data.marca && data.marca.id) payload.id_marca = data.marca.id;
    if (data.tela && data.tela.id) payload.id_tela = data.tela.id;
    return payload;
  }

  create(product: any): Observable<any> {
    const payload = this.transformPayload(product);
    const obs = this.http.post<any>(`${environment.apiUrl}/productos`, payload).pipe(
      tap(() => this.loadFromServer()),
      share()
    );
    obs.subscribe();
    return obs;
  }

  update(id: number, changes: any): Observable<any> {
    const payload = this.transformPayload(changes);
    const obs = this.http.put<any>(`${environment.apiUrl}/productos/${id}`, payload).pipe(
      tap(() => this.loadFromServer()),
      share()
    );
    obs.subscribe();
    return obs;
  }

  delete(id: number): Observable<any> {
    const obs = this.http.delete<any>(`${environment.apiUrl}/productos/${id}`).pipe(
      tap(() => this.loadFromServer()),
      share()
    );
    obs.subscribe();
    return obs;
  }

  uploadImage(productoId: number, file: File, esPrincipal = true): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', file);
    formData.append('es_principal', esPrincipal ? '1' : '0');
    return this.http.post<any>(`${environment.apiUrl}/productos/${productoId}/imagenes`, formData).pipe(
      tap(() => this.loadFromServer())
    );
  }

  deleteImage(imagenId: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/imagenes/${imagenId}`).pipe(
      tap(() => this.loadFromServer())
    );
  }

  // Stats for dashboard
  getTotalStock(): number {
    return this.getAll().reduce((acc, p) => acc + (p.variantes || []).reduce((s, v) => s + (v.stock || 0), 0), 0);
  }

  getTopProducts(n = 3): Producto[] {
    return [...this.getAll()]
      .sort((a, b) => (b.variantes || []).reduce((s, v) => s + (v.stock || 0), 0) - (a.variantes || []).reduce((s, v) => s + (v.stock || 0), 0))
      .slice(0, n);
  }
}
