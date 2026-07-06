import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Producto, Variante, Color, Talla } from '../../models/catalog.models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent implements OnInit {
  @Input() product!: Producto;
  @Input() reverseLayout: boolean = false;
  @Output() addToInquiry = new EventEmitter<{ product: Producto; variant: Variante; quantity: number }>();

  selectedColor: Color | null = null;
  selectedTalla: Talla | null = null;
  selectedVariant: Variante | null = null;
  quantity: number = 1;
  activeImageIndex: number = 0;

  availableColors: Color[] = [];
  availableTallas: Talla[] = [];

  ngOnInit() {
    this.extractUniqueOptions();
    if (this.product.variantes && this.product.variantes.length > 0) {
      const first = this.product.variantes[0];
      this.selectedColor = first.color;
      this.selectedTalla = first.talla;
      this.updateSelectedVariant();
    }
  }

  extractUniqueOptions() {
    const colorsMap = new Map<number, Color>();
    const tallasMap = new Map<number, Talla>();
    this.product.variantes.forEach(v => {
      colorsMap.set(v.color.id, v.color);
      tallasMap.set(v.talla.id, v.talla);
    });
    this.availableColors = Array.from(colorsMap.values());
    this.availableTallas = Array.from(tallasMap.values());
  }

  selectColor(color: Color) { this.selectedColor = color; this.updateSelectedVariant(); }
  selectTalla(talla: Talla) { this.selectedTalla = talla; this.updateSelectedVariant(); }

  updateSelectedVariant() {
    if (!this.selectedColor || !this.selectedTalla) return;
    const found = this.product.variantes.find(
      v => v.color.id === this.selectedColor?.id && v.talla.id === this.selectedTalla?.id
    );
    this.selectedVariant = found || null;
    this.quantity = 1;
    if (this.selectedVariant) {
      const varImgIndex = this.product.imagenes.findIndex(img => img.id_variante === this.selectedVariant?.id);
      if (varImgIndex !== -1) this.activeImageIndex = varImgIndex;
    }
  }

  hasVariant(color: Color, talla: Talla): boolean {
    return this.product.variantes.some(v => v.color.id === color.id && v.talla.id === talla.id);
  }

  get currentStock(): number { return this.selectedVariant ? this.selectedVariant.stock : 0; }
  get currentPrice(): number { return this.selectedVariant ? this.selectedVariant.precio : this.product.precio_base; }
  get totalPrice(): number { return this.currentPrice * this.quantity; }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  }

  incrementQty() { if (this.selectedVariant && this.quantity < this.selectedVariant.stock) this.quantity++; }
  decrementQty() { if (this.quantity > 1) this.quantity--; }

  sendWhatsAppDirect() {
    if (!this.selectedVariant) return;
    const message = `Hola, me interesa:\n*${this.product.nombre}*\n- SKU: ${this.selectedVariant.sku}\n- Color: ${this.selectedVariant.color.nombre}\n- Talla: ${this.selectedVariant.talla.nombre}\n- Cantidad: ${this.quantity}\n- Total: ${this.formatPrice(this.totalPrice)}`;
    window.open(`https://wa.me/573000000000?text=${encodeURIComponent(message)}`, '_blank');
  }

  emitAddInquiry() {
    if (this.selectedVariant && this.selectedVariant.stock > 0) {
      this.addToInquiry.emit({ product: this.product, variant: this.selectedVariant, quantity: this.quantity });
    }
  }
}
