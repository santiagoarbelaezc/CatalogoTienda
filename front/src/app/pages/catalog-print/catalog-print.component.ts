import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Producto } from '../../models/catalog.models';
import { CatalogService } from '../../core/catalog.service';

@Component({
  selector: 'app-catalog-print',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './catalog-print.component.html',
  styleUrls: ['./catalog-print.component.scss']
})
export class CatalogPrintComponent implements OnInit {
  products: Producto[] = [];
  today: Date = new Date();

  constructor(private catalogService: CatalogService) {}

  ngOnInit() {
    this.catalogService.products$.subscribe(products => {
      // Sort alphabetically A-Z
      this.products = [...products].sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      // Auto-trigger print when data is loaded
      if (this.products.length > 0) {
        setTimeout(() => {
          window.print();
        }, 1500); // Wait for images to load
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
  }
}
