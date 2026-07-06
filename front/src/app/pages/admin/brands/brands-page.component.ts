import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrandsService } from '../../../core/brands.service';
import { ToastService } from '../../../core/toast.service';
import { Marca } from '../../../models/catalog.models';

@Component({
  selector: 'app-brands-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './brands-page.component.html',
  styleUrls: ['./brands-page.component.scss']
})
export class BrandsPageComponent implements OnInit {
  brands: Marca[] = [];
  newName = '';
  editingId: number | null = null;
  editingName = '';
  deleteConfirmId: number | null = null;

  constructor(private brandsService: BrandsService, private toast: ToastService) {}

  ngOnInit() {
    this.brandsService.brands$.subscribe(list => {
      this.brands = list;
    });
  }

  createBrand() {
    if (!this.newName.trim()) return;
    this.brandsService.createBrand(this.newName);
    this.toast.success('Marca creada exitosamente');
    this.newName = '';
  }

  startEdit(marca: Marca) {
    this.editingId = marca.id;
    this.editingName = marca.nombre;
  }

  saveEdit() {
    if (this.editingId !== null && this.editingName.trim()) {
      this.brandsService.updateBrand(this.editingId, this.editingName);
      this.toast.success('Marca actualizada correctamente');
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
      this.brandsService.deleteBrand(this.deleteConfirmId);
      this.toast.success('Marca eliminada del catálogo');
      this.deleteConfirmId = null;
    }
  }
}
