import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto, Variante } from '../../models/catalog.models';

export interface InquiryItem {
  product: Producto;
  variant: Variante;
  quantity: number;
}

@Component({
  selector: 'app-cart-inquiry',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-inquiry.component.html',
  styleUrls: ['./cart-inquiry.component.scss'],
})
export class CartInquiryComponent {
  @Input() items: InquiryItem[] = [];
  @Output() removeItem = new EventEmitter<number>(); // index
  @Output() clearAll = new EventEmitter<void>();

  isOpen = false;

  get totalItemsCount(): number {
    return this.items.reduce((acc, curr) => acc + curr.quantity, 0);
  }

  get totalAmount(): number {
    return this.items.reduce((acc, curr) => acc + (curr.variant.precio * curr.quantity), 0);
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  }

  toggleCart() {
    this.isOpen = !this.isOpen;
  }

  remove(index: number) {
    this.removeItem.emit(index);
  }

  sendBulkWhatsApp() {
    if (this.items.length === 0) return;

    let message = `Hola, me gustaría solicitar una cotización por los siguientes productos de su catálogo:\n\n`;

    this.items.forEach((item, index) => {
      message += `${index + 1}. *${item.product.nombre}*\n`;
      message += `   - *SKU:* ${item.variant.sku}\n`;
      message += `   - *Color:* ${item.variant.color.nombre}\n`;
      message += `   - *Talla:* ${item.variant.talla.nombre}\n`;
      message += `   - *Cant:* ${item.quantity}\n`;
      message += `   - *Precio Unit:* ${this.formatPrice(item.variant.precio)}\n`;
      message += `   - *Subtotal:* ${this.formatPrice(item.variant.precio * item.quantity)}\n\n`;
    });

    message += `*Valor Estimado Total:* ${this.formatPrice(this.totalAmount)}\n\n`;
    message += `¿Me podrían confirmar disponibilidad y formas de pago? Quedo atento(a).`;

    const url = `https://wa.me/573000000000?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
}
