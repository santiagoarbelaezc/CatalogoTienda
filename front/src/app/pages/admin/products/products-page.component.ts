import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CatalogService } from '../../../core/catalog.service';
import { ToastService } from '../../../core/toast.service';
import { Producto } from '../../../models/catalog.models';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.scss']
})
export class ProductsPageComponent implements OnInit, OnDestroy {
  allProducts: Producto[] = [];
  filteredProducts: Producto[] = [];
  searchQuery = '';
  deleteConfirmId: number | null = null;

  private sub!: Subscription;

  constructor(private catalogService: CatalogService, private toast: ToastService) {}

  ngOnInit() {
    this.sub = this.catalogService.products$.subscribe(products => {
      this.allProducts = products;
      this.applySearch();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  applySearch() {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredProducts = q
      ? this.allProducts.filter(p =>
          p.nombre.toLowerCase().includes(q) ||
          p.marca.nombre.toLowerCase().includes(q) ||
          p.categoria.nombre.toLowerCase().includes(q)
        )
      : [...this.allProducts];
  }

  confirmDelete(id: number) {
    this.deleteConfirmId = id;
  }

  cancelDelete() {
    this.deleteConfirmId = null;
  }

  executeDelete() {
    if (this.deleteConfirmId !== null) {
      this.catalogService.delete(this.deleteConfirmId);
      this.toast.success('Producto eliminado del catálogo');
      this.deleteConfirmId = null;
    }
  }

  toggleActive(product: Producto) {
    const nuevoEstado = !product.activo;
    this.catalogService.update(product.id, { activo: nuevoEstado });
    this.toast.success(`Producto ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
  }

  getTotalStock(product: Producto): number {
    return product.variantes.reduce((s, v) => s + v.stock, 0);
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(val);
  }
}
