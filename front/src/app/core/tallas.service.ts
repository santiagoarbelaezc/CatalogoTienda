import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Talla } from '../models/catalog.models';
import { TALLAS } from '../data/mock-data';
import { environment } from '../../environments/environment';

export interface TallaGroup {
  id: string;
  name: string;
  shortName: string;
  tallas: Talla[];
}

@Injectable({ providedIn: 'root' })
export class TallasService {
  private _tallas$ = new BehaviorSubject<Talla[]>(TALLAS);
  tallas$ = this._tallas$.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromServer();
  }

  loadFromServer(): void {
    this.http.get<any>(`${environment.apiUrl}/tallas`).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          this._tallas$.next(res.data);
        }
      },
      error: (err) => console.warn('Usando tallas locales por fallback:', err)
    });
  }

  getAll(): Talla[] {
    return this._tallas$.value;
  }

  /**
   * Clasifica las tallas en grupos lógicos para selección en formularios y filtros
   * (Ropa/Pijamas, Brasieres con Copa, Brasieres/Tops, Numéricas/Fajas)
   */
  groupTallas(tallas: Talla[]): TallaGroup[] {
    const ropaOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'ÚNICA', 'UNICA', 'TALLA ÚNICA'];
    const numericas = ['6', '8', '10', '12', '14', '16', '18', '20'];

    const ropaGroup: Talla[] = [];
    const brasierCopas: Talla[] = [];
    const brasierTops: Talla[] = [];
    const numericasGroup: Talla[] = [];
    const otrosGroup: Talla[] = [];

    tallas.forEach(t => {
      const nom = t.nombre.trim().toUpperCase();
      if (ropaOrder.includes(nom)) {
        ropaGroup.push(t);
      } else if (/^\d{2}[A-D]$/.test(nom)) {
        brasierCopas.push(t);
      } else if (/^\d{2}$/.test(nom) && parseInt(nom, 10) >= 30 && parseInt(nom, 10) <= 46) {
        brasierTops.push(t);
      } else if (numericas.includes(nom) || (parseInt(nom, 10) >= 2 && parseInt(nom, 10) <= 24)) {
        numericasGroup.push(t);
      } else {
        otrosGroup.push(t);
      }
    });

    // Ordenar ropa según ropaOrder
    ropaGroup.sort((a, b) => {
      const ia = ropaOrder.indexOf(a.nombre.trim().toUpperCase());
      const ib = ropaOrder.indexOf(b.nombre.trim().toUpperCase());
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    // Ordenar brasier copas por contorno numérico y luego letra de copa (ej. 30B, 32A, 32B...)
    brasierCopas.sort((a, b) => {
      const numA = parseInt(a.nombre, 10) || 0;
      const numB = parseInt(b.nombre, 10) || 0;
      if (numA !== numB) return numA - numB;
      return a.nombre.localeCompare(b.nombre);
    });

    // Ordenar brasier tops numéricamente (32, 34, 36, 38, 40, 42...)
    brasierTops.sort((a, b) => (parseInt(a.nombre, 10) || 0) - (parseInt(b.nombre, 10) || 0));

    // Ordenar numéricas / fajas de menor a mayor (6, 8, 10, 12, 14, 16, 18...)
    numericasGroup.sort((a, b) => (parseInt(a.nombre, 10) || 0) - (parseInt(b.nombre, 10) || 0));

    const groups: TallaGroup[] = [];

    if (ropaGroup.length > 0) {
      groups.push({
        id: 'ropa',
        name: 'Ropa Íntima / Pijamas (Letras)',
        shortName: 'Ropa / Pijamas',
        tallas: ropaGroup
      });
    }
    if (brasierCopas.length > 0) {
      groups.push({
        id: 'copas',
        name: 'Brasieres y Copas (30B - 42C)',
        shortName: 'Brasieres (Copas)',
        tallas: brasierCopas
      });
    }
    if (brasierTops.length > 0) {
      groups.push({
        id: 'tops',
        name: 'Brasieres y Tops (Contorno 32 - 42)',
        shortName: 'Tops / Contorno',
        tallas: brasierTops
      });
    }
    if (numericasGroup.length > 0) {
      groups.push({
        id: 'numericas',
        name: 'Tallas Numéricas / Fajas (6 - 18)',
        shortName: 'Fajas / Numéricas',
        tallas: numericasGroup
      });
    }
    if (otrosGroup.length > 0) {
      groups.push({
        id: 'otros',
        name: 'Otras Tallas',
        shortName: 'Otras',
        tallas: otrosGroup
      });
    }

    return groups.length > 0 ? groups : [{ id: 'todas', name: 'Todas las Tallas', shortName: 'Todas', tallas }];
  }
}
