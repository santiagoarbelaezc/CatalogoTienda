export interface Categoria {
  id: number;
  nombre: string;
  id_padre?: number; // Para subcategorías
  subcategorias?: Categoria[];
}

export interface Marca {
  id: number;
  nombre: string;
}

export interface Tela {
  id: number;
  nombre: string;
  composicion: string; // Ejemplo: 100% Algodón, 60% Poliéster / 40% Algodón
}

export interface Color {
  id: number;
  nombre: string;
  hex: string; // Para mostrar la pastilla de color
}

export interface Talla {
  id: number;
  nombre: string; // S, M, L, XL, etc.
}

export interface Imagen {
  id: number;
  url: string;
  es_principal: boolean;
  id_variante?: number; // Asociada opcionalmente a una variante
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string;
}

export interface Variante {
  id: number;
  sku: string;
  precio: number;
  stock: number;
  color: Color;
  talla: Talla;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio_base: number;
  genero: 'Hombre' | 'Mujer' | 'Unisex';
  temporada: string; // Ejemplo: Primavera-Verano, Otoño-Invierno
  activo: boolean;
  
  categoria: Categoria;
  marca: Marca;
  tela: Tela;
  
  imagenes: Imagen[];
  variantes: Variante[];
  proveedores?: Proveedor[];
}
