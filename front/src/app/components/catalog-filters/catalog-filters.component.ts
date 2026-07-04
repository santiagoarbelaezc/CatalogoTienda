import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria, Marca, Tela, Color, Talla } from '../../models/catalog.models';
import { CATEGORIAS, MARCAS, TELAS, COLORES, TALLAS } from '../../data/mock-data';

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
})
export class CatalogFiltersComponent implements OnInit {
  @Output() filtersChanged = new EventEmitter<CatalogFilters>();

  // Data lists
  categorias = CATEGORIAS;
  marcas = MARCAS;
  telas = TELAS;
  colores = COLORES;
  tallas = TALLAS;

  // Filter model
  filters: CatalogFilters = {
    searchQuery: '',
    categoriaId: null,
    marcaId: null,
    genero: '',
    temporada: '',
    telaId: null,
    colorId: null,
    tallaId: null,
    minPrice: null,
    maxPrice: null,
    sortBy: 'name-asc'
  };

  isMobileFiltersOpen = false;

  ngOnInit() {
    this.emitFilters();
  }

  emitFilters() {
    this.filtersChanged.emit({ ...this.filters });
  }

  selectCategory(id: number | null) {
    this.filters.categoriaId = id;
    this.emitFilters();
  }

  selectColor(id: number | null) {
    this.filters.colorId = this.filters.colorId === id ? null : id; // Toggle
    this.emitFilters();
  }

  selectTalla(id: number | null) {
    this.filters.tallaId = this.filters.tallaId === id ? null : id; // Toggle
    this.emitFilters();
  }

  resetFilters() {
    this.filters = {
      searchQuery: '',
      categoriaId: null,
      marcaId: null,
      genero: '',
      temporada: '',
      telaId: null,
      colorId: null,
      tallaId: null,
      minPrice: null,
      maxPrice: null,
      sortBy: 'name-asc'
    };
    this.emitFilters();
  }
}
