import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CatalogFiltersComponent, CatalogFilters } from '../../components/catalog-filters/catalog-filters.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { CartInquiryComponent, InquiryItem } from '../../components/cart-inquiry/cart-inquiry.component';
import { Producto, Variante } from '../../models/catalog.models';
import { CatalogService } from '../../core/catalog.service';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CatalogFiltersComponent, ProductCardComponent, CartInquiryComponent],
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.scss']
})
export class CatalogPageComponent implements OnInit {
  allProducts: Producto[] = [];
  filteredProducts: Producto[] = [];
  inquiryItems: InquiryItem[] = [];
  activeFilters!: CatalogFilters;

  constructor(private catalogService: CatalogService) {}

  ngOnInit() {
    this.catalogService.products$.subscribe(products => {
      this.allProducts = products;
      if (this.activeFilters) {
        this.handleFiltersChanged(this.activeFilters);
      } else {
        this.filteredProducts = [...products];
      }
    });
  }

  handleFiltersChanged(filters: CatalogFilters) {
    this.activeFilters = filters;
    let result = [...this.allProducts];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(query) ||
        p.descripcion.toLowerCase().includes(query) ||
        p.variantes.some(v => v.sku.toLowerCase().includes(query))
      );
    }
    if (filters.categoriaId !== null) result = result.filter(p => p.categoria.id === filters.categoriaId);
    if (filters.marcaId !== null)     result = result.filter(p => p.marca.id === filters.marcaId);
    if (filters.genero)               result = result.filter(p => p.genero === filters.genero);
    if (filters.temporada)            result = result.filter(p => p.temporada === filters.temporada);
    if (filters.telaId !== null)      result = result.filter(p => p.tela.id === filters.telaId);
    if (filters.colorId !== null)     result = result.filter(p => p.variantes.some(v => v.color.id === filters.colorId));
    if (filters.tallaId !== null)     result = result.filter(p => p.variantes.some(v => v.talla.id === filters.tallaId));
    if (filters.minPrice !== null)    result = result.filter(p => Math.min(p.precio_base, ...p.variantes.map(v => v.precio)) >= (filters.minPrice ?? 0));
    if (filters.maxPrice !== null)    result = result.filter(p => Math.min(p.precio_base, ...p.variantes.map(v => v.precio)) <= (filters.maxPrice ?? Infinity));

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name-asc':   return a.nombre.localeCompare(b.nombre);
        case 'name-desc':  return b.nombre.localeCompare(a.nombre);
        case 'price-asc':  return Math.min(a.precio_base, ...a.variantes.map(v => v.precio)) - Math.min(b.precio_base, ...b.variantes.map(v => v.precio));
        case 'price-desc': return Math.max(b.precio_base, ...b.variantes.map(v => v.precio)) - Math.max(a.precio_base, ...a.variantes.map(v => v.precio));
        default: return 0;
      }
    });

    this.filteredProducts = result;
  }

  handleAddToInquiry(event: { product: Producto; variant: Variante; quantity: number }) {
    const existingIndex = this.inquiryItems.findIndex(item => item.variant.id === event.variant.id);
    if (existingIndex !== -1) {
      const newQty = this.inquiryItems[existingIndex].quantity + event.quantity;
      this.inquiryItems[existingIndex].quantity = Math.min(newQty, event.variant.stock);
    } else {
      this.inquiryItems.push({ product: event.product, variant: event.variant, quantity: event.quantity });
    }
  }

  handleRemoveItem(index: number) { this.inquiryItems.splice(index, 1); }
  handleClearAll() { this.inquiryItems = []; }
}
