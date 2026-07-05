import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Producto } from '../models/catalog.models';
import { PRODUCTOS } from '../data/mock-data';

const STORAGE_KEY = 'cti_productos';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private _products$ = new BehaviorSubject<Producto[]>(this.load());
  products$ = this._products$.asObservable();

  private load(): Producto[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : PRODUCTOS;
  }

  private save(list: Producto[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    this._products$.next(list);
  }

  getAll(): Producto[] {
    return this._products$.value;
  }

  getById(id: number): Producto | undefined {
    return this._products$.value.find(p => p.id === id);
  }

  create(product: Omit<Producto, 'id'>): Producto {
    const list = this.getAll();
    const newId = list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1;
    const newProduct: Producto = { ...product, id: newId };
    this.save([...list, newProduct]);
    return newProduct;
  }

  update(id: number, changes: Partial<Producto>): void {
    const list = this.getAll().map(p => p.id === id ? { ...p, ...changes } : p);
    this.save(list);
  }

  delete(id: number): void {
    this.save(this.getAll().filter(p => p.id !== id));
  }

  // Stats for dashboard
  getTotalStock(): number {
    return this.getAll().reduce((acc, p) => acc + p.variantes.reduce((s, v) => s + v.stock, 0), 0);
  }

  getTopProducts(n = 3): Producto[] {
    // Sort by total stock as proxy for popularity in mock
    return [...this.getAll()]
      .sort((a, b) => b.variantes.reduce((s, v) => s + v.stock, 0) - a.variantes.reduce((s, v) => s + v.stock, 0))
      .slice(0, n);
  }
}
