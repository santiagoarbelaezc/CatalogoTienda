import { Producto, Categoria, Marca, Tela, Color, Talla } from '../models/catalog.models';

// Categorías
export const CATEGORIAS: Categoria[] = [
  {
    id: 1,
    nombre: 'Superior',
    subcategorias: [
      { id: 11, nombre: 'Camisas', id_padre: 1 },
      { id: 12, nombre: 'Camisetas', id_padre: 1 },
      { id: 13, nombre: 'Chaquetas', id_padre: 1 }
    ]
  },
  {
    id: 2,
    nombre: 'Inferior',
    subcategorias: [
      { id: 21, nombre: 'Pantalones', id_padre: 2 },
      { id: 22, nombre: 'Bermudas', id_padre: 2 }
    ]
  },
  {
    id: 3,
    nombre: 'Accesorios',
    subcategorias: [
      { id: 31, nombre: 'Gorros', id_padre: 3 }
    ]
  }
];

// Marcas
export const MARCAS: Marca[] = [
  { id: 1, nombre: 'Atelier Premium' },
  { id: 2, nombre: 'Urban Wear' },
  { id: 3, nombre: 'EcoThreads' }
];

// Telas
export const TELAS: Tela[] = [
  { id: 1, nombre: 'Algodón Pima', composicion: '100% Algodón Pima Peruano' },
  { id: 2, nombre: 'Denim Selvedge', composicion: '98% Algodón, 2% Elastano' },
  { id: 3, nombre: 'Lino Orgánico', composicion: '100% Lino Italiano' },
  { id: 4, nombre: 'Lana Merino', composicion: '100% Lana Merino de Nueva Zelanda' },
  { id: 5, nombre: 'Cuero Nappa', composicion: '15% Forro Poliéster, 85% Cuero Vacuno' }
];

// Colores
export const COLORES: Color[] = [
  { id: 1, nombre: 'Negro Absoluto', hex: '#0B0B0C' },
  { id: 2, nombre: 'Blanco Crudo', hex: '#F5F5F0' },
  { id: 3, nombre: 'Azul Navy', hex: '#1C2E4A' },
  { id: 4, nombre: 'Verde Oliva', hex: '#4B5320' },
  { id: 5, nombre: 'Gris Melange', hex: '#8E9196' },
  { id: 6, nombre: 'Camel', hex: '#C19A6B' }
];

// Tallas
export const TALLAS: Talla[] = [
  { id: 1, nombre: 'S' },
  { id: 2, nombre: 'M' },
  { id: 3, nombre: 'L' },
  { id: 4, nombre: 'XL' }
];

// Listado de Productos
export const PRODUCTOS: Producto[] = [
  {
    id: 1,
    nombre: 'Camiseta Pima Essential',
    descripcion: 'Camiseta de corte clásico confeccionada en algodón Pima peruano de tacto ultrasuave. Su tejido de alta densidad ofrece una caída perfecta y resistencia superior al desgaste y los lavados.',
    precio_base: 89000,
    genero: 'Unisex',
    temporada: 'Primavera-Verano',
    activo: true,
    categoria: CATEGORIAS[0].subcategorias![1], // Camisetas
    marca: MARCAS[1], // Urban Wear
    tela: TELAS[0], // Algodón Pima
    imagenes: [
      { id: 101, url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', es_principal: true },
      { id: 102, url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80', es_principal: false }
    ],
    variantes: [
      { id: 1, sku: 'TS-PIM-BLK-S', precio: 89000, stock: 15, color: COLORES[0], talla: TALLAS[0] }, // Negro S
      { id: 2, sku: 'TS-PIM-BLK-M', precio: 89000, stock: 25, color: COLORES[0], talla: TALLAS[1] }, // Negro M
      { id: 3, sku: 'TS-PIM-BLK-L', precio: 89000, stock: 8, color: COLORES[0], talla: TALLAS[2] },  // Negro L
      { id: 4, sku: 'TS-PIM-WHT-S', precio: 89000, stock: 12, color: COLORES[1], talla: TALLAS[0] }, // Blanco S
      { id: 5, sku: 'TS-PIM-WHT-M', precio: 89000, stock: 0, color: COLORES[1], talla: TALLAS[1] },  // Blanco M (Sin Stock)
      { id: 6, sku: 'TS-PIM-WHT-L', precio: 95000, stock: 10, color: COLORES[1], talla: TALLAS[2] }  // Blanco L (Variación precio)
    ]
  },
  {
    id: 2,
    nombre: 'Chaqueta de Cuero Nappa Biker',
    descripcion: 'Diseño icónico rebelde elaborado en cuero nappa premium. Cremalleras metálicas YKK de alta resistencia y forro interior satinado para máximo confort. Corte entallado y detalles acolchados en hombros.',
    precio_base: 450000,
    genero: 'Hombre',
    temporada: 'Otoño-Invierno',
    activo: true,
    categoria: CATEGORIAS[0].subcategorias![2], // Chaquetas
    marca: MARCAS[0], // Atelier Premium
    tela: TELAS[4], // Cuero Nappa
    imagenes: [
      { id: 201, url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80', es_principal: true }
    ],
    variantes: [
      { id: 7, sku: 'JK-NAP-BLK-M', precio: 450000, stock: 5, color: COLORES[0], talla: TALLAS[1] },
      { id: 8, sku: 'JK-NAP-BLK-L', precio: 450000, stock: 3, color: COLORES[0], talla: TALLAS[2] },
      { id: 9, sku: 'JK-NAP-BLK-XL', precio: 470000, stock: 2, color: COLORES[0], talla: TALLAS[3] },
      { id: 10, sku: 'JK-NAP-CAM-M', precio: 460000, stock: 4, color: COLORES[5], talla: TALLAS[1] } // Camel M
    ]
  },
  {
    id: 3,
    nombre: 'Jeans Selvedge Slim Fit',
    descripcion: 'Jeans confeccionados en denim selvedge de alta calidad con un toque de elasticidad. El color añil profundo desarrollará un desgaste único y personalizado con el uso prolongado. Acabados a mano.',
    precio_base: 189000,
    genero: 'Hombre',
    temporada: 'Otoño-Invierno',
    activo: true,
    categoria: CATEGORIAS[1].subcategorias![0], // Pantalones
    marca: MARCAS[1], // Urban Wear
    tela: TELAS[1], // Denim Selvedge
    imagenes: [
      { id: 301, url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80', es_principal: true }
    ],
    variantes: [
      { id: 11, sku: 'JN-SLV-NAV-S', precio: 189000, stock: 10, color: COLORES[2], talla: TALLAS[0] },
      { id: 12, sku: 'JN-SLV-NAV-M', precio: 189000, stock: 15, color: COLORES[2], talla: TALLAS[1] },
      { id: 13, sku: 'JN-SLV-NAV-L', precio: 189000, stock: 20, color: COLORES[2], talla: TALLAS[2] }
    ]
  },
  {
    id: 4,
    nombre: 'Camisa Lino Orgánico Resort',
    descripcion: 'Camisa ligera y transpirable, confeccionada en lino orgánico de alta calidad. Perfecta para climas cálidos y ocasiones casuales elegantes. Cuello campana retro y botones de coco natural.',
    precio_base: 149000,
    genero: 'Unisex',
    temporada: 'Primavera-Verano',
    activo: true,
    categoria: CATEGORIAS[0].subcategorias![0], // Camisas
    marca: MARCAS[2], // EcoThreads
    tela: TELAS[2], // Lino Orgánico
    imagenes: [
      { id: 401, url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80', es_principal: true }
    ],
    variantes: [
      { id: 14, sku: 'SH-LIN-WHT-S', precio: 149000, stock: 8, color: COLORES[1], talla: TALLAS[0] }, // Blanco S
      { id: 15, sku: 'SH-LIN-WHT-M', precio: 149000, stock: 14, color: COLORES[1], talla: TALLAS[1] }, // Blanco M
      { id: 16, sku: 'SH-LIN-WHT-L', precio: 149000, stock: 9, color: COLORES[1], talla: TALLAS[2] },  // Blanco L
      { id: 17, sku: 'SH-LIN-OLV-M', precio: 159000, stock: 6, color: COLORES[3], talla: TALLAS[1] }   // Oliva M
    ]
  },
  {
    id: 5,
    nombre: 'Abrigo Overcoat de Lana Merino',
    descripcion: 'Abrigo largo estructurado, tejido en pura lana merino italiana. Una prenda atemporal diseñada para el frío extremo, con solapas de muesca clásica, bolsillos de doble vivo y forro completo a tono.',
    precio_base: 380000,
    genero: 'Mujer',
    temporada: 'Otoño-Invierno',
    activo: true,
    categoria: CATEGORIAS[0].subcategorias![2], // Chaquetas
    marca: MARCAS[0], // Atelier Premium
    tela: TELAS[3], // Lana Merino
    imagenes: [
      { id: 501, url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80', es_principal: true }
    ],
    variantes: [
      { id: 18, sku: 'CO-MER-CAM-S', precio: 380000, stock: 4, color: COLORES[5], talla: TALLAS[0] }, // Camel S
      { id: 19, sku: 'CO-MER-CAM-M', precio: 380000, stock: 6, color: COLORES[5], talla: TALLAS[1] }, // Camel M
      { id: 20, sku: 'CO-MER-BLK-M', precio: 380000, stock: 3, color: COLORES[0], talla: TALLAS[1] }  // Negro M
    ]
  }
];
