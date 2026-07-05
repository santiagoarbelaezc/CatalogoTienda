import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Marca } from '../models/catalog.models';
import { MARCAS } from '../data/mock-data';

const STORAGE_KEY = 'cti_marcas';

@Injectable({ providedIn: 'root' })
export class BrandsService {
  private _brands$ = new BehaviorSubject<Marca[]>(this.load());
  brands$ = this._brands$.asObservable();

  private load(): Marca[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : MARCAS;
  }

  private save(list: Marca[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    this._brands$.next(list);
  }

  getAll(): Marca[] {
    return this._brands$.value;
  }

  createBrand(nombre: string): Marca {
    const list = this.getAll();
    const newId = list.length > 0 ? Math.max(...list.map(m => m.id)) + 1 : 1;
    const marca: Marca = { id: newId, nombre: nombre.trim() };
    this.save([...list, marca]);
    return marca;
  }

  updateBrand(id: number, nombre: string): void {
    const list = this.getAll().map(m => m.id === id ? { ...m, nombre: nombre.trim() } : m);
    this.save(list);
  }

  deleteBrand(id: number): void {
    const list = this.getAll().filter(m => m.id !== id);
    this.save(list);
  }
}
