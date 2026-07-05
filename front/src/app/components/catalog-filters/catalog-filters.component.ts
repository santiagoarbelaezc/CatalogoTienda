import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria, Marca, Tela, Color, Talla } from '../../models/catalog.models';
import { CATEGORIAS, TELAS, COLORES, TALLAS } from '../../data/mock-data';
import { BrandsService } from '../../core/brands.service';

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
  tallas = TALLAS;

  filters: CatalogFilters = {
    searchQuery: '', categoriaId: null, marcaId: null, genero: '',
    temporada: '', telaId: null, colorId: null, tallaId: null,
    minPrice: null, maxPrice: null, sortBy: 'name-asc'
  };

  isMobileFiltersOpen = false;

  constructor(private brandsService: BrandsService) {}

  ngOnInit() {
    this.brandsService.brands$.subscribe(list => this.marcas = list);
    this.emitFilters();
  }

  emitFilters() { this.filtersChanged.emit({ ...this.filters }); }

  selectCategory(id: number | null) { this.filters.categoriaId = id; this.emitFilters(); }
  selectColor(id: number | null) { this.filters.colorId = this.filters.colorId === id ? null : id; this.emitFilters(); }
  selectTalla(id: number | null) { this.filters.tallaId = this.filters.tallaId === id ? null : id; this.emitFilters(); }

  resetFilters() {
    this.filters = {
      searchQuery: '', categoriaId: null, marcaId: null, genero: '',
      temporada: '', telaId: null, colorId: null, tallaId: null,
      minPrice: null, maxPrice: null, sortBy: 'name-asc'
    };
    this.emitFilters();
  }
}
