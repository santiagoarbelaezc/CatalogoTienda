import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CatalogService } from '../../../../core/catalog.service';
import { CategoriesService } from '../../../../core/categories.service';
import { BrandsService } from '../../../../core/brands.service';
import { ToastService } from '../../../../core/toast.service';
import { Producto, Categoria, Variante, Color, Talla, Marca } from '../../../../models/catalog.models';
import { TELAS, COLORES, TALLAS } from '../../../../data/mock-data';

interface VarianteForm {
  sku: string;
  precio: number;
  stock: number;
  colorId: number;
  tallaId: number;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit, OnDestroy {
  isEditMode = false;
  editingId: number | null = null;

  // Form model
  nombre = '';
  descripcion = '';
  precioBase = 0;
  genero: 'Hombre' | 'Mujer' | 'Unisex' = 'Unisex';
  temporada = '';
  activo = true;
  categoriaId: number | null = null;
  marcaId: number = 1;
  telaId: number = 1;

  // Variants
  variantes: VarianteForm[] = [{ sku: '', precio: 0, stock: 0, colorId: 1, tallaId: 1 }];

  // Options
  categorias: Categoria[] = [];
  marcas: Marca[] = [];
  telas = TELAS;
  colores = COLORES;
  tallas = TALLAS;

  isSaving = false;
  isGeneratingAI = false;
  private subs = new Subscription();

  constructor(
    private catalogService: CatalogService,
    private categoriesService: CategoriesService,
    private brandsService: BrandsService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.subs.add(this.categoriesService.categories$.subscribe(() => {
      this.categorias = this.categoriesService.getAllFlat();
      if (this.categorias.length > 0 && this.categoriaId === null && !this.isEditMode) {
        this.categoriaId = this.categorias[0].id;
      }
    }));
    this.categoriesService.loadFromServer();

    this.subs.add(this.brandsService.brands$.subscribe(list => {
      this.marcas = list;
      if (this.marcas.length > 0 && !this.marcaId && !this.isEditMode) {
        this.marcaId = this.marcas[0].id;
      }
    }));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingId = +id;
      this.subs.add(this.catalogService.products$.subscribe(() => {
        if (this.editingId) {
          const product = this.catalogService.getById(this.editingId);
          if (product) this.loadProduct(product);
        }
      }));
      const initialProduct = this.catalogService.getById(this.editingId);
      if (initialProduct) this.loadProduct(initialProduct);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  private loadProduct(p: Producto) {
    this.nombre = p.nombre;
    this.descripcion = p.descripcion;
    this.precioBase = p.precio_base;
    this.genero = p.genero;
    this.temporada = p.temporada;
    this.activo = p.activo;
    this.categoriaId = p.categoria.id;
    this.marcaId = p.marca.id;
    this.telaId = p.tela.id;
    this.variantes = p.variantes.map(v => ({
      sku: v.sku,
      precio: v.precio,
      stock: v.stock,
      colorId: v.color.id,
      tallaId: v.talla.id
    }));
  }

  get formattedPrecioCOP(): string {
    const val = Number(this.precioBase) || 0;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  }

  validatePrice() {
    if (this.precioBase < 0 || isNaN(this.precioBase)) {
      this.precioBase = 0;
    }
  }

  validateVariantPrice(v: VarianteForm) {
    if (v.precio < 0 || isNaN(v.precio)) {
      v.precio = 0;
    }
  }

  addVariant() {
    this.variantes.push({ sku: '', precio: this.precioBase, stock: 0, colorId: 1, tallaId: 1 });
  }

  removeVariant(i: number) {
    if (this.variantes.length > 1) {
      this.variantes.splice(i, 1);
    }
  }

  save() {
    if (!this.nombre.trim() || this.categoriaId === null) return;
    if (this.precioBase < 0) {
      this.toast.error('El precio base no puede ser negativo.');
      return;
    }
    if (this.variantes.some(v => (v.precio || 0) < 0)) {
      this.toast.error('El precio de una variante no puede ser negativo.');
      return;
    }

    this.isSaving = true;

    const categoria = this.categorias.find(c => c.id === Number(this.categoriaId)) || this.categorias[0];
    const marca = this.marcas.find(m => m.id === Number(this.marcaId)) || this.marcas[0];
    const tela = this.telas.find(t => t.id === Number(this.telaId)) || this.telas[0];

    const variantesBuilt: Variante[] = this.variantes.map((v, idx) => ({
      id: idx + 1,
      sku: v.sku || `SKU-${idx + 1}`,
      precio: v.precio || this.precioBase,
      stock: v.stock,
      color: this.colores.find(c => c.id === v.colorId)!,
      talla: this.tallas.find(t => t.id === v.tallaId)!
    }));

    const productData = {
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio_base: this.precioBase,
      genero: this.genero,
      temporada: this.temporada,
      activo: this.activo,
      categoria,
      marca,
      tela,
      imagenes: [{ id: 1, url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', es_principal: true }],
      variantes: variantesBuilt,
    };

    const obs$ = (this.isEditMode && this.editingId !== null)
      ? this.catalogService.update(this.editingId, productData)
      : this.catalogService.create(productData);

    obs$.subscribe({
      next: () => {
        this.isSaving = false;
        if (this.isEditMode) {
          this.toast.success('Producto actualizado correctamente');
        } else {
          this.toast.success('Producto creado exitosamente');
        }
        this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error al guardar el producto:', err);
        this.toast.error('Hubo un error al guardar el producto: ' + (err.error?.message || 'Error de servidor'));
      }
    });
  }

  generateWithAI() {
    if (!this.nombre.trim()) {
      this.toast.error('Por favor, escribe primero el nombre del producto para la IA');
      return;
    }

    this.isGeneratingAI = true;
    this.toast.info('✨ IA generando descripción y categoría... Por favor espera');

    this.catalogService.generateAIProductInfo(this.nombre).subscribe({
      next: (res) => {
        this.isGeneratingAI = false;
        if (res.success && res.data) {
          if (res.data.descripcion) {
            this.descripcion = res.data.descripcion;
          }
          if (res.data.categoria_id) {
            const found = this.categorias.find(c => c.id === Number(res.data.categoria_id));
            if (found) {
              this.categoriaId = found.id;
            }
          }
          if (res.data.genero && ['Hombre', 'Mujer', 'Unisex'].includes(res.data.genero)) {
            this.genero = res.data.genero as any;
          }
          if (res.data.temporada) {
            this.temporada = res.data.temporada;
          }
          this.toast.success('✨ ¡Listo! Descripción creada y categoría asignada automáticamente.');
        } else {
          this.toast.error('No se pudo autocompletar el producto con IA.');
        }
      },
      error: (err) => {
        this.isGeneratingAI = false;
        console.error('Error IA:', err);
        this.toast.error('Error del asistente IA: ' + (err.error?.message || 'Revisa tu conexión o clave API'));
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/products']);
  }
}
