import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { AuthService, AdminUser } from '../../auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss']
})
export class AdminShellComponent implements OnInit {
  currentUser: AdminUser | null = null;
  isSidebarCollapsed = false;

  navItems: NavItem[] = [
    { label: 'Inicio',      icon: 'home',         route: '/admin/dashboard' },
    { label: 'Productos',   icon: 'inventory_2',  route: '/admin/products' },
    { label: 'Categorías',  icon: 'category',     route: '/admin/categories' },
    { label: 'Marcas',      icon: 'style',        route: '/admin/brands' },
  ];

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.currentUser$.subscribe(user => this.currentUser = user);
  }

  logout() {
    this.auth.logout();
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
