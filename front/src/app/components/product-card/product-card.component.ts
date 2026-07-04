import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto, Variante, Color, Talla } from '../../models/catalog.models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent implements OnInit {
  @Input() product!: Producto;
  @Output() addToInquiry = new EventEmitter<{ product: Producto; variant: Variante; quantity: number }>();

  // State
  selectedColor: Color | null = null;
  selectedTalla: Talla | null = null;
  selectedVariant: Variante | null = null;
  quantity: number = 1;
  activeImageIndex: number = 0;

  // Available options for current selection
  availableColors: Color[] = [];
  availableTallas: Talla[] = [];

  ngOnInit() {
    this.extractUniqueOptions();
    // Default select first variant
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

  selectColor(color: Color) {
    this.selectedColor = color;
    this.updateSelectedVariant();
  }

  selectTalla(talla: Talla) {
    this.selectedTalla = talla;
    this.updateSelectedVariant();
  }

  updateSelectedVariant() {
    if (!this.selectedColor || !this.selectedTalla) return;

    const found = this.product.variantes.find(
      v => v.color.id === this.selectedColor?.id && v.talla.id === this.selectedTalla?.id
    );

    this.selectedVariant = found || null;
    this.quantity = 1; // reset quantity

    // If variant has a specific image, try to focus it
    if (this.selectedVariant) {
      const varImgIndex = this.product.imagenes.findIndex(img => img.id_variante === this.selectedVariant?.id);
      if (varImgIndex !== -1) {
        this.activeImageIndex = varImgIndex;
      }
    }
  }

  // Check if a size/color combination is theoretically available in variants list (even if stock is 0)
  hasVariant(color: Color, talla: Talla): boolean {
    return this.product.variantes.some(v => v.color.id === color.id && v.talla.id === talla.id);
  }

  // Get current variant's stock
  get currentStock(): number {
    return this.selectedVariant ? this.selectedVariant.stock : 0;
  }

  get currentPrice(): number {
    return this.selectedVariant ? this.selectedVariant.precio : this.product.precio_base;
  }

  get totalPrice(): number {
    return this.currentPrice * this.quantity;
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  }

  incrementQty() {
    if (this.selectedVariant && this.quantity < this.selectedVariant.stock) {
      this.quantity++;
    }
  }

  decrementQty() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  sendWhatsAppDirect() {
    if (!this.selectedVariant) return;

    const message = `Hola, me interesa comprar:
*${this.product.nombre}*
- *SKU:* ${this.selectedVariant.sku}
- *Color:* ${this.selectedVariant.color.nombre}
- *Talla:* ${this.selectedVariant.talla.nombre}
- *Cantidad:* ${this.quantity}
- *Precio Unitario:* ${this.formatPrice(this.currentPrice)}
- *Total:* ${this.formatPrice(this.totalPrice)}

¿Tienen disponibilidad para envío inmediato?`;

    const url = `https://wa.me/573000000000?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  emitAddInquiry() {
    if (this.selectedVariant && this.selectedVariant.stock > 0) {
      this.addToInquiry.emit({
        product: this.product,
        variant: this.selectedVariant,
        quantity: this.quantity
      });
    }
  }
}
