import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Categoria } from '../models/catalog.models';
import { CATEGORIAS } from '../data/mock-data';

const STORAGE_KEY = 'cti_categorias';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private _categories$ = new BehaviorSubject<Categoria[]>(this.load());
  categories$ = this._categories$.asObservable();

  private load(): Categoria[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : CATEGORIAS;
  }

  private save(list: Categoria[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    this._categories$.next(list);
  }

  getAll(): Categoria[] {
    return this._categories$.value;
  }

  /** Returns a flat list of all leaf (sub)categories for product assignment */
  getAllFlat(): Categoria[] {
    const all: Categoria[] = [];
    this.getAll().forEach(cat => {
      all.push(cat);
      if (cat.subcategorias) all.push(...cat.subcategorias);
    });
    return all;
  }

  createParent(nombre: string): Categoria {
    const list = this.getAll();
    const newId = list.length > 0 ? Math.max(...list.map(c => c.id)) + 1 : 1;
    const cat: Categoria = { id: newId, nombre, subcategorias: [] };
    this.save([...list, cat]);
    return cat;
  }

  createSubcategory(nombre: string, parentId: number): Categoria | null {
    const list = this.getAll();
    const parent = list.find(c => c.id === parentId);
    if (!parent) return null;

    const allIds = list.flatMap(c => [c.id, ...(c.subcategorias?.map(s => s.id) ?? [])]);
    const newId = Math.max(...allIds) + 1;
    const sub: Categoria = { id: newId, nombre, id_padre: parentId };
    parent.subcategorias = [...(parent.subcategorias ?? []), sub];
    this.save([...list]);
    return sub;
  }

  deleteCategory(id: number): void {
    // Remove top-level
    let list = this.getAll().filter(c => c.id !== id);
    // Remove from subcategorias
    list = list.map(c => ({
      ...c,
      subcategorias: c.subcategorias?.filter(s => s.id !== id) ?? []
    }));
    this.save(list);
  }

  updateCategory(id: number, nombre: string): void {
    const list = this.getAll().map(c => {
      if (c.id === id) return { ...c, nombre };
      return {
        ...c,
        subcategorias: c.subcategorias?.map(s => s.id === id ? { ...s, nombre } : s) ?? []
      };
    });
    this.save(list);
  }
}
