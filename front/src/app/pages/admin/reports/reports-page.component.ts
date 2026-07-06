import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../../core/catalog.service';
import { CategoriesService } from '../../../core/categories.service';
import { BrandsService } from '../../../core/brands.service';
import { Producto, Categoria, Marca } from '../../../models/catalog.models';

interface ReportRow {
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  marca: string;
  precioBase: number;
  totalVariantes: number;
  stockTotal: number;
  estado: string;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.scss']
})
export class ReportsPageComponent implements OnInit {
  reportType: 'stock' | 'catalog' | 'pricing' = 'stock';
  categoryFilter: number | null = null;
  brandFilter: number | null = null;
  stockFilter: 'all' | 'low' | 'active' = 'all';

  products: Producto[] = [];
  categories: Categoria[] = [];
  brands: Marca[] = [];
  rows: ReportRow[] = [];

  // Summary
  totalItems = 0;
  totalStock = 0;
  totalInventoryValue = 0;

  constructor(
    private catalogService: CatalogService,
    private categoriesService: CategoriesService,
    private brandsService: BrandsService
  ) {}

  ngOnInit() {
    this.categories = this.categoriesService.getAllFlat();
    this.brandsService.brands$.subscribe(list => this.brands = list);
    this.catalogService.products$.subscribe(list => {
      this.products = list;
      this.generateReport();
    });
  }

  generateReport() {
    let filtered = this.products;

    if (this.categoryFilter !== null && +this.categoryFilter !== 0) {
      filtered = filtered.filter(p => p.categoria.id === +this.categoryFilter!);
    }
    if (this.brandFilter !== null && +this.brandFilter !== 0) {
      filtered = filtered.filter(p => p.marca.id === +this.brandFilter!);
    }
    if (this.stockFilter === 'active') {
      filtered = filtered.filter(p => p.activo);
    }

    const newRows: ReportRow[] = [];
    let totStock = 0;
    let totVal = 0;

    filtered.forEach(p => {
      const pStock = p.variantes.reduce((acc, v) => acc + v.stock, 0);
      const pVal = p.variantes.reduce((acc, v) => acc + (v.stock * v.precio), 0);

      if (this.stockFilter === 'low' && pStock >= 5) {
        return; // skip if not low stock
      }

      totStock += pStock;
      totVal += pVal;

      newRows.push({
        id: p.id,
        sku: p.variantes[0]?.sku || `PRD-${p.id}`,
        nombre: p.nombre,
        categoria: p.categoria.nombre || 'Sin Cat.',
        marca: p.marca.nombre || 'Sin Marca',
        precioBase: p.precio_base,
        totalVariantes: p.variantes.length,
        stockTotal: pStock,
        estado: p.activo ? 'Activo' : 'Inactivo'
      });
    });

    this.rows = newRows;
    this.totalItems = newRows.length;
    this.totalStock = totStock;
    this.totalInventoryValue = totVal;
  }

  exportCSV() {
    if (this.rows.length === 0) return;

    const headers = ['ID', 'SKU Principal', 'Producto', 'Categoría', 'Marca', 'Precio Base', 'Variantes', 'Stock Total', 'Estado'];
    const csvRows = this.rows.map(r => [
      r.id,
      `"${r.sku}"`,
      `"${r.nombre.replace(/"/g, '""')}"`,
      `"${r.categoria}"`,
      `"${r.marca}"`,
      r.precioBase,
      r.totalVariantes,
      r.stockTotal,
      r.estado
    ]);

    const csvContent = [
      headers.join(';'),
      ...csvRows.map(e => e.join(';'))
    ].join('\r\n');

    // Add UTF-8 BOM for Excel compatibility in Windows
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_tienda_intima_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printReport() {
    window.print();
  }
}
