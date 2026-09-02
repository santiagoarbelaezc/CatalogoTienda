import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AnalyticKpi {
  title: string;
  value: string;
  icon: string;
  trend: number;
  trendLabel: string;
  raw?: any;
}

export interface TopVariantMetric {
  varianteId?: number;
  productoNombre: string;
  sku: string;
  colorHex: string;
  colorNombre: string;
  talla: string;
  inquiries: number;
  conversion: string;
  stock: number;
  precio?: number;
}

export interface ChartDistribution {
  labels: string[];
  data: number[];
}

export interface CategorySummaryItem {
  id: number;
  nombre: string;
  total_productos: number;
  total_stock: number;
  valor_inventario: number;
}

export interface BrandSummaryItem {
  id: number;
  nombre: string;
  total_productos: number;
  total_stock: number;
  valor_inventario: number;
}

export interface DashboardAnalyticsResponse {
  kpis: AnalyticKpi[];
  categoryDistribution: ChartDistribution;
  brandDistribution?: ChartDistribution;
  genderDistribution?: ChartDistribution;
  quotesByDay: ChartDistribution;
  topVariants: TopVariantMetric[];
  catalogSummary?: {
    categories: CategorySummaryItem[];
    brands: BrandSummaryItem[];
  };
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private http: HttpClient) {}

  getDashboardAnalytics(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/analytics/dashboard`);
  }

  trackEvent(productoId?: number, varianteId?: number, eventType = 'whatsapp_quote'): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/analytics/events`, {
      producto_id: productoId,
      variante_id: varianteId,
      event_type: eventType
    }).pipe(
      catchError(err => {
        console.warn('No se pudo registrar evento de analítica:', err);
        return of({ success: false });
      })
    );
  }
}
