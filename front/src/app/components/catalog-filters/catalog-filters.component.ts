import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria, Marca, Tela, Color, Talla } from '../../models/catalog.models';
import { CATEGORIAS, TELAS, COLORES, TALLAS } from '../../data/mock-data';
import { BrandsService } from '../../core/brands.service';
import { TallasService, TallaGroup } from '../../core/tallas.service';
import { CategoriesService } from '../../core/categories.service';

export interface CatalogFilters {
  searchQuery: string;
  categoriaId: number | null;
  marcaId: number | null;
  genero: string;
  temporada: string;
  telaId: number | null;
  colorId: number | null;
  tallaId: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: string;
}

@Component({
  selector: 'app-catalog-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog-filters.component.html',
  styleUrls: ['./catalog-filters.component.scss'],
})
export class CatalogFiltersComponent implements OnInit {
  @Output() filtersChanged = new EventEmitter<CatalogFilters>();

  categorias = CATEGORIAS;
  marcas: Marca[] = [];
  telas = TELAS;
  colores = COLORES;
  tallas: Talla[] = TALLAS;
  tallaGroups: TallaGroup[] = [];

  selectedGarmentGroupId: string = 'ALL';

  filters: CatalogFilters = {
    searchQuery: '', categoriaId: null, marcaId: null, genero: '',
    temporada: '', telaId: null, colorId: null, tallaId: null,
    minPrice: null, maxPrice: null, sortBy: 'name-asc'
  };

  isMobileFiltersOpen = false;

  constructor(
    private brandsService: BrandsService,
    private tallasService: TallasService,
    private categoriesService: CategoriesService
  ) {}

  ngOnInit() {
    this.brandsService.brands$.subscribe(list => this.marcas = list);
    this.categoriesService.categories$.subscribe(list => {
      if (list && list.length > 0) this.categorias = list;
    });

    this.tallasService.tallas$.subscribe(list => {
      this.tallas = list;
      this.tallaGroups = this.tallasService.groupTallas(list);
    });

    this.tallasService.loadFromServer();
    this.emitFilters();
  }

  expandedCategoryIds = new Set<number>();

  emitFilters() { this.filtersChanged.emit({ ...this.filters }); }

  toggleExpand(catId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedCategoryIds.has(catId)) {
      this.expandedCategoryIds.delete(catId);
    } else {
      this.expandedCategoryIds.add(catId);
    }
  }

  isExpanded(catId: number): boolean {
    return this.expandedCategoryIds.has(catId);
  }

  selectCategory(id: number | null) {
    if (this.filters.categoriaId === id) {
      this.filters.categoriaId = null;
    } else {
      this.filters.categoriaId = id;
      // Si seleccionó una categoría padre con subcategorías, expandirla automáticamente
      if (id !== null) {
        const parent = this.categorias.find(c => c.id === id);
        if (parent && parent.subcategorias && parent.subcategorias.length > 0) {
          this.expandedCategoryIds.add(id);
        }
      }
    }
    this.emitFilters();
  }

  getSelectedCategoryNombre(): string {
    if (this.filters.categoriaId === null) return '';
    for (const c of this.categorias) {
      if (c.id === this.filters.categoriaId) return c.nombre;
      if (c.subcategorias) {
        const sub = c.subcategorias.find(s => s.id === this.filters.categoriaId);
        if (sub) return sub.nombre;
      }
    }
    return '';
  }

  clearCategory(): void {
    this.filters.categoriaId = null;
    this.emitFilters();
  }

  selectColor(id: number | null) { this.filters.colorId = this.filters.colorId === id ? null : id; this.emitFilters(); }

  selectGarmentGroup(groupId: string): void {
    this.selectedGarmentGroupId = groupId;
    // Si la talla actualmente seleccionada no pertenece al grupo elegido, deseleccionar para no dejar filtro invisible
    if (this.filters.tallaId !== null && groupId !== 'ALL') {
      const activeGroup = this.tallaGroups.find(g => g.id === groupId);
      if (activeGroup && !activeGroup.tallas.some(t => t.id === this.filters.tallaId)) {
        this.filters.tallaId = null;
        this.emitFilters();
      }
    }
  }

  get activeTallas(): Talla[] {
    if (this.selectedGarmentGroupId === 'ALL') {
      return this.tallas;
    }
    const group = this.tallaGroups.find(g => g.id === this.selectedGarmentGroupId);
    return group ? group.tallas : this.tallas;
  }

  getSelectedTallaNombre(): string {
    if (!this.filters.tallaId) return '';
    const found = this.tallas.find(t => t.id === this.filters.tallaId);
    return found ? found.nombre : '';
  }

  clearTalla(): void {
    this.filters.tallaId = null;
    this.emitFilters();
  }

  selectTalla(id: number | null) {
    this.filters.tallaId = this.filters.tallaId === id ? null : id;
    this.emitFilters();
  }

  resetFilters() {
    this.selectedGarmentGroupId = 'ALL';
    this.expandedCategoryIds.clear();
    this.filters = {
      searchQuery: '', categoriaId: null, marcaId: null, genero: '',
      temporada: '', telaId: null, colorId: null, tallaId: null,
      minPrice: null, maxPrice: null, sortBy: 'name-asc'
    };
    this.emitFilters();
  }
}
