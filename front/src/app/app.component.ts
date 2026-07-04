import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogFiltersComponent, CatalogFilters } from './components/catalog-filters/catalog-filters.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { CartInquiryComponent, InquiryItem } from './components/cart-inquiry/cart-inquiry.component';
import { Producto, Variante } from './models/catalog.models';
import { PRODUCTOS } from './data/mock-data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    CatalogFiltersComponent,
    ProductCardComponent,
    CartInquiryComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'front';
  
  // Products Lists
  allProducts: Producto[] = PRODUCTOS;
  filteredProducts: Producto[] = [];
  
  // Inquiry List
  inquiryItems: InquiryItem[] = [];

  // Active filters cache
  activeFilters!: CatalogFilters;

  ngOnInit() {
    this.filteredProducts = [...this.allProducts];
  }

  handleFiltersChanged(filters: CatalogFilters) {
    this.activeFilters = filters;
    let result = [...this.allProducts];

    // Search Query (Name, Description, Variant SKUs)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.nombre.toLowerCase().includes(query) ||
        p.descripcion.toLowerCase().includes(query) ||
        p.variantes.some(v => v.sku.toLowerCase().includes(query))
      );
    }

    // Category / Subcategory
    if (filters.categoriaId !== null) {
      result = result.filter(p => p.categoria.id === filters.categoriaId);
    }

    // Marca
    if (filters.marcaId !== null) {
      result = result.filter(p => p.marca.id === filters.marcaId);
    }

    // Genero
    if (filters.genero) {
      result = result.filter(p => p.genero === filters.genero);
    }

    // Temporada
    if (filters.temporada) {
      result = result.filter(p => p.temporada === filters.temporada);
    }

    // Tela
    if (filters.telaId !== null) {
      result = result.filter(p => p.tela.id === filters.telaId);
    }

    // Color (Check variants)
    if (filters.colorId !== null) {
      result = result.filter(p => p.variantes.some(v => v.color.id === filters.colorId));
    }

    // Talla (Check variants)
    if (filters.tallaId !== null) {
      result = result.filter(p => p.variantes.some(v => v.talla.id === filters.tallaId));
    }

    // Price Range (Filter by min/max in any available variant or base price)
    if (filters.minPrice !== null) {
      result = result.filter(p => {
        const lowestPrice = Math.min(p.precio_base, ...p.variantes.map(v => v.precio));
        return lowestPrice >= (filters.minPrice ?? 0);
      });
    }
    if (filters.maxPrice !== null) {
      result = result.filter(p => {
        const lowestPrice = Math.min(p.precio_base, ...p.variantes.map(v => v.precio));
        return lowestPrice <= (filters.maxPrice ?? Infinity);
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name-asc':
          return a.nombre.localeCompare(b.nombre);
        case 'name-desc':
          return b.nombre.localeCompare(a.nombre);
        case 'price-asc':
          const minA = Math.min(a.precio_base, ...a.variantes.map(v => v.precio));
          const minB = Math.min(b.precio_base, ...b.variantes.map(v => v.precio));
          return minA - minB;
        case 'price-desc':
          const maxA = Math.max(a.precio_base, ...a.variantes.map(v => v.precio));
          const maxB = Math.max(b.precio_base, ...b.variantes.map(v => v.precio));
          return maxB - maxA;
        default:
          return 0;
      }
    });

    this.filteredProducts = result;
  }

  handleAddToInquiry(event: { product: Producto; variant: Variante; quantity: number }) {
    // Check if variant already exists in list
    const existingIndex = this.inquiryItems.findIndex(
      item => item.variant.id === event.variant.id
    );

    if (existingIndex !== -1) {
      // Update quantity, clamping to stock limit
      const newQty = this.inquiryItems[existingIndex].quantity + event.quantity;
      this.inquiryItems[existingIndex].quantity = Math.min(newQty, event.variant.stock);
    } else {
      this.inquiryItems.push({
        product: event.product,
        variant: event.variant,
        quantity: event.quantity
      });
    }
  }

  handleRemoveItem(index: number) {
    this.inquiryItems.splice(index, 1);
  }

  handleClearAll() {
    this.inquiryItems = [];
  }
}
