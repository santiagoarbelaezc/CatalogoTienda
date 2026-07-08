import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Producto } from '../../models/catalog.models';
import { CatalogService } from '../../core/catalog.service';

@Component({
  selector: 'app-catalog-print',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './catalog-print.component.html',
  styleUrls: ['./catalog-print.component.scss']
})
export class CatalogPrintComponent implements OnInit, OnDestroy {
  products: Producto[] = [];
  today: Date = new Date();
  
  private sub?: Subscription;
  private printTimer?: any;
  private hasTriggeredPrint = false;

  constructor(private catalogService: CatalogService) {}

  ngOnInit() {
    this.sub = this.catalogService.products$.subscribe(products => {
      this.products = [...products].sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      if (this.products.length > 0 && !this.hasTriggeredPrint) {
        this.hasTriggeredPrint = true;
        this.printTimer = setTimeout(() => {
          window.print();
        }, 1200);
      }
    });
  }

  triggerPrint() {
    window.print();
  }

  ngOnDestroy() {
    if (this.printTimer) {
      clearTimeout(this.printTimer);
    }
    this.sub?.unsubscribe();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
  }
}
