import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CatalogFiltersComponent, CatalogFilters } from '../../components/catalog-filters/catalog-filters.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { CartInquiryComponent, InquiryItem } from '../../components/cart-inquiry/cart-inquiry.component';
import { Producto, Variante } from '../../models/catalog.models';
import { CatalogService } from '../../core/catalog.service';

interface HeroImageItem {
  img: string;
  img2: string;
  title: string;
  subtitle: string;
  description: string;
  promoTag: string;
  promoText: string;
  promoIcon: 'shipping' | 'discount' | 'gift';
  link: string;
  ctaText: string;
}

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CatalogFiltersComponent, ProductCardComponent, CartInquiryComponent],
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.scss']
})
export class CatalogPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;

  readonly items: HeroImageItem[] = [
    {
      img: 'assets/images/pijamas-hero.png',
      img2: 'assets/images/pijamas-hero-2.png',
      title: 'Noches de Satén',
      subtitle: 'Siluetas fluidas y sofisticadas.',
      description: 'Lujo sutil y máxima suavidad para tus momentos de descanso. Diseños delicados creados en satén premium que acarician tu piel.',
      promoTag: 'EDICIÓN EXCLUSIVA',
      promoText: 'Envío gratis por compras superiores a $150.000',
      promoIcon: 'shipping',
      link: '/',
      ctaText: 'Explorar Colección'
    },
    {
      img: 'assets/images/ropa-interior-hero.png',
      img2: 'assets/images/ropa-interior-hero-2.png',
      title: 'Encaje Premium',
      subtitle: 'Detalles delicados y texturas suaves.',
      description: 'Siente la comodidad y ligereza del encaje de alta gama con diseños femeninos, versátiles y un ajuste impecable para tu día a día.',
      promoTag: 'NUEVA COLECCIÓN',
      promoText: '10% OFF extra en tu primer pedido con el código INTTIMA10',
      promoIcon: 'discount',
      link: '/',
      ctaText: 'Ver Diseños'
    },
    {
      img: 'assets/images/novedades-hero-2.png',
      img2: 'assets/images/novedades-hero.png',
      title: 'Detalles Únicos',
      subtitle: 'La armonía perfecta de sofisticación y comodidad.',
      description: 'Descubre piezas exclusivas confeccionadas con texturas selectas y acabados limpios que elevan tu armario de descanso.',
      promoTag: 'NOVEDADES EXCLUSIVAS',
      promoText: 'Empaque de lujo de cortesía en todas tus compras',
      promoIcon: 'gift',
      link: '/',
      ctaText: 'Ver Novedades'
    }
  ];

  currentSlide = 0;
  private autoplayInterval?: ReturnType<typeof setInterval>;
  private readonly AUTOPLAY_DELAY = 4500;

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

  ngAfterViewInit(): void {
    this.syncCurrentSlide();
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  scrollToSlide(index: number): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;

    const slideWidth = container.clientWidth;
    container.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
    this.currentSlide = index;
    this.startAutoplay();
  }

  onScroll(): void {
    this.syncCurrentSlide();
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
    this.currentPage = 1; // Reset to first page on filter change
  }

  // ─── Pagination Logic ────────────────────────────────────
  currentPage = 1;
  itemsPerPage = 16;

  get paginatedProducts(): Producto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage) || 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.scrollToTop();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollToTop();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.scrollToTop();
    }
  }

  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  private syncCurrentSlide(): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;

    const slideWidth = container.clientWidth || 1;
    this.currentSlide = Math.round(container.scrollLeft / slideWidth);
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    this.autoplayInterval = setInterval(() => {
      const next = (this.currentSlide + 1) % this.items.length;
      this.scrollToSlide(next);
    }, this.AUTOPLAY_DELAY);
  }

  private stopAutoplay(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = undefined;
    }
  }
}
