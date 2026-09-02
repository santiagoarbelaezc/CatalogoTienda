import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CatalogService } from '../../../core/catalog.service';
import { CategoriesService } from '../../../core/categories.service';
import { BrandsService } from '../../../core/brands.service';
import { AuthService } from '../../../auth/auth.service';
import { Producto, Categoria, Marca } from '../../../models/catalog.models';

export interface ReportRow {
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  marca: string;
  genero: string;
  precioBase: number;
  totalVariantes: number;
  stockTotal: number;
  valorInventario: number;
  estado: string;
}

export interface GroupedReportRow {
  nombre: string;
  tipo: 'Categoría' | 'Marca';
  totalProductos: number;
  totalVariantes: number;
  stockTotal: number;
  valorInventario: number;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.scss']
})
export class ReportsPageComponent implements OnInit, OnDestroy {
  reportType: 'stock' | 'catalog' | 'pricing' | 'summary' = 'stock';
  categoryFilter: number | null = null;
  brandFilter: number | null = null;
  stockFilter: 'all' | 'low' | 'active' | 'inactive' = 'all';

  products: Producto[] = [];
  categories: Categoria[] = [];
  brands: Marca[] = [];
  rows: ReportRow[] = [];
  groupedRows: GroupedReportRow[] = [];

  private subs: Subscription[] = [];

  // Summary
  totalItems = 0;
  totalStock = 0;
  totalInventoryValue = 0;
  generatedAt: string = '';

  constructor(
    private catalogService: CatalogService,
    private categoriesService: CategoriesService,
    private brandsService: BrandsService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.categoriesService.loadFromServer();
    this.brandsService.loadFromServer();
    this.catalogService.loadFromServer();

    const catSub = this.categoriesService.categories$.subscribe(() => {
      this.categories = this.categoriesService.getAllFlat();
      this.generateReport();
    });

    const brandSub = this.brandsService.brands$.subscribe(list => {
      this.brands = list || [];
      this.generateReport();
    });

    const prodSub = this.catalogService.products$.subscribe(list => {
      this.products = list || [];
      this.generateReport();
    });

    this.subs.push(catSub, brandSub, prodSub);
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  generateReport() {
    this.generatedAt = new Date().toLocaleString('es-CO', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    let filtered = [...this.products];

    if (this.categoryFilter !== null && +this.categoryFilter !== 0) {
      filtered = filtered.filter(p => p.categoria?.id === +this.categoryFilter!);
    }
    if (this.brandFilter !== null && +this.brandFilter !== 0) {
      filtered = filtered.filter(p => p.marca?.id === +this.brandFilter!);
    }
    if (this.stockFilter === 'active') {
      filtered = filtered.filter(p => p.activo);
    } else if (this.stockFilter === 'inactive') {
      filtered = filtered.filter(p => !p.activo);
    }

    const newRows: ReportRow[] = [];
    let totStock = 0;
    let totVal = 0;

    filtered.forEach(p => {
      const pStock = (p.variantes || []).reduce((acc, v) => acc + (v.stock || 0), 0);
      const pVal = (p.variantes || []).reduce((acc, v) => {
        const vPrice = (v.precio && v.precio > 0) ? v.precio : (p.precio_base || 0);
        return acc + ((v.stock || 0) * vPrice);
      }, 0);

      if (this.stockFilter === 'low' && pStock > 5) {
        return; // skip if not low stock
      }

      totStock += pStock;
      totVal += pVal;

      newRows.push({
        id: p.id,
        sku: p.variantes && p.variantes[0] ? p.variantes[0].sku : `PRD-${p.id}`,
        nombre: p.nombre,
        categoria: p.categoria?.nombre || 'Sin Categoría',
        marca: p.marca?.nombre || 'Sin Marca',
        genero: p.genero || 'Sin Definir',
        precioBase: p.precio_base,
        totalVariantes: (p.variantes || []).length,
        stockTotal: pStock,
        valorInventario: pVal,
        estado: p.activo ? 'Activo' : 'Inactivo'
      });
    });

    this.rows = newRows;
    this.totalItems = newRows.length;
    this.totalStock = totStock;
    this.totalInventoryValue = totVal;

    // Calcular reporte consolidado agrupado por categorías y marcas
    this.computeGroupedReport(filtered);
  }

  private computeGroupedReport(filtered: Producto[]) {
    const catMap = new Map<string, { prods: number; vars: number; stock: number; val: number }>();
    const brandMap = new Map<string, { prods: number; vars: number; stock: number; val: number }>();

    filtered.forEach(p => {
      const cName = p.categoria?.nombre || 'Sin Categoría';
      const bName = p.marca?.nombre || 'Sin Marca';
      const pStock = (p.variantes || []).reduce((acc, v) => acc + (v.stock || 0), 0);
      const pVal = (p.variantes || []).reduce((acc, v) => {
        const vPrice = (v.precio && v.precio > 0) ? v.precio : (p.precio_base || 0);
        return acc + ((v.stock || 0) * vPrice);
      }, 0);
      const varCount = (p.variantes || []).length;

      const cData = catMap.get(cName) || { prods: 0, vars: 0, stock: 0, val: 0 };
      cData.prods += 1;
      cData.vars += varCount;
      cData.stock += pStock;
      cData.val += pVal;
      catMap.set(cName, cData);

      const bData = brandMap.get(bName) || { prods: 0, vars: 0, stock: 0, val: 0 };
      bData.prods += 1;
      bData.vars += varCount;
      bData.stock += pStock;
      bData.val += pVal;
      brandMap.set(bName, bData);
    });

    const groups: GroupedReportRow[] = [];
    catMap.forEach((v, k) => {
      groups.push({
        nombre: k,
        tipo: 'Categoría',
        totalProductos: v.prods,
        totalVariantes: v.vars,
        stockTotal: v.stock,
        valorInventario: v.val
      });
    });

    brandMap.forEach((v, k) => {
      groups.push({
        nombre: k,
        tipo: 'Marca',
        totalProductos: v.prods,
        totalVariantes: v.vars,
        stockTotal: v.stock,
        valorInventario: v.val
      });
    });

    this.groupedRows = groups;
  }

  get reportTitle(): string {
    switch (this.reportType) {
      case 'stock':   return 'INFORME TÉCNICO DE INVENTARIO Y STOCK GENERAL';
      case 'catalog': return 'CATÁLOGO MAESTRO Y LISTADO GENERAL DE PRODUCTOS';
      case 'pricing': return 'AUDITORÍA DE PRECIOS, VALORACIÓN Y VARIANTES';
      case 'summary': return 'CONSOLIDADO GENERAL POR CATEGORÍAS Y MARCAS';
    }
  }

  get categoryFilterLabel(): string {
    if (!this.categoryFilter) return 'Todas las categorías';
    const found = this.categories.find(c => c.id === +this.categoryFilter!);
    return found ? found.nombre : 'Todas las categorías';
  }

  get brandFilterLabel(): string {
    if (!this.brandFilter) return 'Todas las marcas';
    const found = this.brands.find(m => m.id === +this.brandFilter!);
    return found ? found.nombre : 'Todas las marcas';
  }

  get stockFilterLabel(): string {
    switch (this.stockFilter) {
      case 'all': return 'Todos los estados';
      case 'active': return 'Solo productos activos';
      case 'inactive': return 'Solo productos inactivos';
      case 'low': return 'Crítico (Bajo stock <= 5 un.)';
    }
  }

  get reportCode(): string {
    const typeCode = this.reportType.toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `DOC-REP-${typeCode}-${dateStr}`;
  }

  exportCSV() {
    if (this.reportType === 'summary') {
      if (this.groupedRows.length === 0) return;
      const headers = ['Tipo', 'Nombre Agrupador', 'Total Productos', 'Total Variantes', 'Stock Total', 'Valorización Total ($ COP)'];
      const csvRows = this.groupedRows.map(r => [
        `"${r.tipo}"`,
        `"${r.nombre.replace(/"/g, '""')}"`,
        r.totalProductos,
        r.totalVariantes,
        r.stockTotal,
        r.valorInventario
      ]);

      const csvContent = [headers.join(';'), ...csvRows.map(e => e.join(';'))].join('\r\n');
      this.downloadBlob(csvContent, `reporte_consolidado_${new Date().toISOString().slice(0, 10)}.csv`);
      return;
    }

    if (this.rows.length === 0) return;

    const headers = ['ID', 'SKU Principal', 'Producto', 'Categoría', 'Marca', 'Género', 'Precio Base ($ COP)', 'Variantes', 'Stock Total', 'Valor Inventario ($ COP)', 'Estado'];
    const csvRows = this.rows.map(r => [
      r.id,
      `"${r.sku}"`,
      `"${r.nombre.replace(/"/g, '""')}"`,
      `"${r.categoria}"`,
      `"${r.marca}"`,
      `"${r.genero}"`,
      r.precioBase,
      r.totalVariantes,
      r.stockTotal,
      r.valorInventario,
      r.estado
    ]);

    const csvContent = [headers.join(';'), ...csvRows.map(e => e.join(';'))].join('\r\n');
    this.downloadBlob(csvContent, `reporte_${this.reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  private downloadBlob(content: string, filename: string) {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printReport() {
    window.print();
  }
}
