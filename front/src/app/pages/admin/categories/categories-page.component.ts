import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CategoriesService } from '../../../core/categories.service';
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

  constructor(private categoriesService: CategoriesService) {}

  ngOnInit() {
    this.sub = this.categoriesService.categories$.subscribe(cats => this.categories = cats);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  createCategory() {
    if (!this.newName.trim()) return;
    if (this.newParentId !== null) {
      this.categoriesService.createSubcategory(this.newName.trim(), this.newParentId);
    } else {
      this.categoriesService.createParent(this.newName.trim());
    }
    this.newName = '';
    this.newParentId = null;
  }

  startEdit(cat: Categoria) {
    this.editingId = cat.id;
    this.editingName = cat.nombre;
  }

  saveEdit() {
    if (this.editingId !== null && this.editingName.trim()) {
      this.categoriesService.updateCategory(this.editingId, this.editingName.trim());
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
      this.deleteConfirmId = null;
    }
  }

  get parentCategories(): Categoria[] {
    return this.categories.filter(c => !c.id_padre);
  }
}
