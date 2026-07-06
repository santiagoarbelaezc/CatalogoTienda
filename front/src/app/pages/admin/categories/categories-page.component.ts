import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CategoriesService } from '../../../core/categories.service';
import { ToastService } from '../../../core/toast.service';
import { Categoria } from '../../../models/catalog.models';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss']
})
export class CategoriesPageComponent implements OnInit, OnDestroy {
  categories: Categoria[] = [];
  private sub!: Subscription;

  // Form
  newName = '';
  newParentId: number | null = null;
  editingId: number | null = null;
  editingName = '';
  deleteConfirmId: number | null = null;

  // Form UX state
  formMode: 'parent' | 'sub' = 'parent';

  constructor(private categoriesService: CategoriesService, private toast: ToastService) {}

  ngOnInit() {
    this.sub = this.categoriesService.categories$.subscribe(cats => {
      this.categories = cats;
      if (this.formMode === 'sub' && !this.newParentId && this.parentCategories.length > 0) {
        this.newParentId = this.parentCategories[0].id;
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  setFormMode(mode: 'parent' | 'sub', parentId: number | null = null) {
    this.formMode = mode;
    if (mode === 'parent') {
      this.newParentId = null;
    } else if (parentId !== null) {
      this.newParentId = parentId;
    } else if (this.parentCategories.length > 0 && !this.newParentId) {
      this.newParentId = this.parentCategories[0].id;
    }
  }

  quickAddSub(parentCat: Categoria) {
    this.setFormMode('sub', parentCat.id);
    setTimeout(() => {
      const inputEl = document.getElementById('cat-nombre');
      if (inputEl) {
        inputEl.focus();
      }
    }, 50);
  }

  createCategory() {
    if (!this.newName.trim()) return;
    if (this.formMode === 'sub' && this.newParentId === null) {
      this.toast.error('Selecciona una categoría principal para la subcategoría');
      return;
    }

    if (this.formMode === 'sub' && this.newParentId !== null) {
      this.categoriesService.createSubcategory(this.newName.trim(), this.newParentId);
      this.toast.success('Subcategoría creada exitosamente');
    } else {
      this.categoriesService.createParent(this.newName.trim());
      this.toast.success('Categoría principal creada exitosamente');
    }
    this.newName = '';
  }

  startEdit(cat: Categoria) {
    this.editingId = cat.id;
    this.editingName = cat.nombre;
  }

  saveEdit() {
    if (this.editingId !== null && this.editingName.trim()) {
      this.categoriesService.updateCategory(this.editingId, this.editingName.trim());
      this.toast.success('Categoría actualizada correctamente');
    }
    this.editingId = null;
    this.editingName = '';
  }

  cancelEdit() {
    this.editingId = null;
    this.editingName = '';
  }

  confirmDelete(id: number) {
    this.deleteConfirmId = id;
  }

  executeDelete() {
    if (this.deleteConfirmId !== null) {
      this.categoriesService.deleteCategory(this.deleteConfirmId);
      this.toast.success('Categoría eliminada del catálogo');
      this.deleteConfirmId = null;
    }
  }

  get parentCategories(): Categoria[] {
    return this.categories.filter(c => !c.id_padre);
  }
}
