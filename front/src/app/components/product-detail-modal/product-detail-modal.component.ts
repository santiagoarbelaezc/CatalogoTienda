import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto, Variante, Color, Talla } from '../../models/catalog.models';
import { AnalyticsService } from '../../core/analytics.service';
import { InquiryItem } from '../cart-inquiry/cart-inquiry.component';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail-modal.component.html',
  styleUrls: ['./product-detail-modal.component.scss']
})
export class ProductDetailModalComponent implements OnInit {
  @Input() product!: Producto;
  @Output() close = new EventEmitter<void>();
  @Output() addToInquiry = new EventEmitter<{ product: Producto; variant: Variante; quantity: number }>();

  activeImageIndex: number = 0;
  selectedColor: Color | null = null;
  selectedTalla: Talla | null = null;
  selectedVariant: Variante | null = null;
  quantity: number = 1;

  availableColors: Color[] = [];
  availableTallas: Talla[] = [];

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.extractUniqueOptions();
    if (this.product.variantes && this.product.variantes.length > 0) {
      const first = this.product.variantes[0];
      this.selectedColor = first.color;
      this.selectedTalla = first.talla;
      this.updateSelectedVariant();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeHandler() {
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
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
    this.quantity = 1;
    if (this.selectedVariant) {
      const varImgIndex = this.product.imagenes.findIndex(img => img.id_variante === this.selectedVariant?.id);
      if (varImgIndex !== -1) this.activeImageIndex = varImgIndex;
    }
  }

  hasVariant(color: Color, talla: Talla): boolean {
    return this.product.variantes.some(v => v.color.id === color.id && v.talla.id === talla.id);
  }

  get currentStock(): number {
    return this.selectedVariant ? this.selectedVariant.stock : 0;
  }

  get currentPrice(): number {
    return this.selectedVariant ? this.selectedVariant.precio : this.product.precio_base;
  }

  get currentSku(): string {
    return this.selectedVariant ? this.selectedVariant.sku : ('PRD-' + this.product.id);
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
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
    this.analyticsService.trackEvent(this.product.id, this.selectedVariant?.id).subscribe();
    const variantInfo = this.selectedVariant
      ? `\n- Color: ${this.selectedVariant.color.nombre}\n- Talla: ${this.selectedVariant.talla.nombre}\n- SKU: ${this.selectedVariant.sku}`
      : '';
    const price = this.formatPrice(this.currentPrice);
    const message = `Hola, quiero comprar la siguiente prenda:\n*${this.product.nombre}*${variantInfo}\n- Cantidad: ${this.quantity}\n- Precio: ${price}`;
    window.open(`https://wa.me/573000000000?text=${encodeURIComponent(message)}`, '_blank');
  }

  emitAddInquiry() {
    const variantToEmit = this.selectedVariant || (this.product.variantes && this.product.variantes[0]) || {
      id: 0,
      sku: 'STD',
      precio: this.product.precio_base,
      stock: 99,
      color: { id: 0, nombre: 'Único', hex: '#000000' },
      talla: { id: 0, nombre: 'Única' }
    };
    this.addToInquiry.emit({ product: this.product, variant: variantToEmit, quantity: this.quantity });
    this.closeModal();
  }
}
