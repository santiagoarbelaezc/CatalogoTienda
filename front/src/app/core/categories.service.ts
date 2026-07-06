import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, share } from 'rxjs';
import { Categoria } from '../models/catalog.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private _categories$ = new BehaviorSubject<Categoria[]>([]);
  categories$ = this._categories$.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromServer();
  }

  loadFromServer(): void {
    this.http.get<any>(`${environment.apiUrl}/categorias?format=tree`).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this._categories$.next(res.data);
        }
      },
      error: (err) => console.error('Error cargando categorías desde backend:', err)
    });
  }

  getAll(): Categoria[] {
    return this._categories$.value;
  }

  getAllFlat(): Categoria[] {
    const all: Categoria[] = [];
    this.getAll().forEach(cat => {
      all.push(cat);
      if (cat.subcategorias) all.push(...cat.subcategorias);
    });
    return all;
  }

  createParent(nombre: string): Observable<any> {
    const obs = this.http.post<any>(`${environment.apiUrl}/categorias`, { nombre }).pipe(
      tap(() => this.loadFromServer()),
      share()
    );
    obs.subscribe();
    return obs;
  }

  createSubcategory(nombre: string, parentId: number): Observable<any> {
    const obs = this.http.post<any>(`${environment.apiUrl}/categorias`, { nombre, id_padre: parentId }).pipe(
      tap(() => this.loadFromServer()),
      share()
    );
    obs.subscribe();
    return obs;
  }

  updateCategory(id: number, nombre: string): Observable<any> {
    const obs = this.http.put<any>(`${environment.apiUrl}/categorias/${id}`, { nombre }).pipe(
      tap(() => this.loadFromServer()),
      share()
    );
    obs.subscribe();
    return obs;
  }

  deleteCategory(id: number): Observable<any> {
    const obs = this.http.delete<any>(`${environment.apiUrl}/categorias/${id}`).pipe(
      tap(() => this.loadFromServer()),
      share()
    );
    obs.subscribe();
    return obs;
  }
}
