import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CatalogService } from '../../../core/catalog.service';
import { Producto } from '../../../models/catalog.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface KpiCard {
  title: string;
  value: string;
  icon: string;
  trendLabel: string;
  isPositive: boolean;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('inventoryChart') chartCanvas!: ElementRef<HTMLCanvasElement>;

  allProducts: Producto[] = [];
  topProducts: Producto[] = [];
  private chart: Chart | null = null;
  private sub!: Subscription;

  chartMode: 'category' | 'gender' = 'category';

  kpis: KpiCard[] = [
    {
      title: 'Total Productos',
      value: '0',
      icon: 'inventory_2',
      trendLabel: 'Cargando catálogo...',
      isPositive: true
    },
    {
      title: 'Existencias (Stock)',
      value: '0',
      icon: 'stacked_bar_chart',
      trendLabel: 'Calculando unidades...',
      isPositive: true
    },
    {
      title: 'Valorización Inventario',
      value: '$ 0',
      icon: 'payments',
      trendLabel: 'Precio base promedio: $ 0',
      isPositive: true
    },
    {
      title: 'Alerta Bajo Stock',
      value: '0',
      icon: 'warning',
      trendLabel: 'Verificando existencias...',
      isPositive: true
    }
  ];

  constructor(private catalogService: CatalogService) {}

  ngOnInit() {
    this.sub = this.catalogService.products$.subscribe(list => {
      this.allProducts = list || [];
      this.topProducts = this.catalogService.getTopProducts(5);
      this.updateKpis();
      if (this.chart) {
        this.updateChartData();
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.buildChart();
    }, 100);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.chart?.destroy();
  }

  updateKpis() {
    const totalProd = this.allProducts.length;
    const activeProd = this.allProducts.filter(p => p.activo).length;
    
    let totalStock = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let totalVariants = 0;

    this.allProducts.forEach(p => {
      (p.variantes || []).forEach(v => {
        totalVariants++;
        const st = v.stock || 0;
        totalStock += st;
        totalValue += st * (v.precio || p.precio_base || 0);
        if (st < 10) lowStockCount++;
      });
    });

    const avgPrice = totalProd > 0
      ? this.allProducts.reduce((acc, p) => acc + (p.precio_base || 0), 0) / totalProd
      : 0;

    this.kpis = [
      {
        title: 'Total Productos',
        value: `${totalProd}`,
        icon: 'inventory_2',
        trendLabel: `${activeProd} activos · ${totalProd - activeProd} inactivos`,
        isPositive: true
      },
      {
        title: 'Existencias (Stock)',
        value: `${totalStock.toLocaleString('es-CO')}`,
        icon: 'stacked_bar_chart',
        trendLabel: `Distribuido en ${totalVariants} variantes`,
        isPositive: true
      },
      {
        title: 'Valorización Inventario',
        value: this.formatPrice(totalValue),
        icon: 'payments',
        trendLabel: `Precio base prom: ${this.formatPrice(avgPrice)}`,
        isPositive: true
      },
      {
        title: 'Alerta Bajo Stock',
        value: `${lowStockCount}`,
        icon: 'warning',
        trendLabel: lowStockCount > 0 ? `${lowStockCount} variantes con stock < 10 uds.` : 'Inventario 100% saludable',
        isPositive: lowStockCount === 0
      }
    ];
  }

  setChartMode(mode: 'category' | 'gender') {
    if (this.chartMode === mode) return;
    this.chartMode = mode;
    this.updateChartData();
  }

  private buildChart() {
    if (!this.chartCanvas) return;

    const { labels, data } = this.getChartLabelsAndData();

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Unidades en Stock',
          data,
          backgroundColor: '#111111',
          hoverBackgroundColor: '#3f3f46',
          borderRadius: 8,
          barThickness: 36
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111',
            titleColor: '#fff',
            bodyColor: 'rgba(255,255,255,0.85)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: ctx => ` ${ctx.parsed.y ?? 0} unidades en almacén`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: '#4b5563',
              font: { size: 12, family: 'Outfit', weight: 600 }
            }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            border: { display: false },
            ticks: {
              color: '#9ca3af',
              font: { size: 11, family: 'Outfit' },
              callback: val => `${val} uds.`
            }
          }
        }
      }
    });
  }

  private updateChartData() {
    if (!this.chart) return;
    const { labels, data } = this.getChartLabelsAndData();
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.update();
  }

  private getChartLabelsAndData(): { labels: string[], data: number[] } {
    const map = new Map<string, number>();

    if (this.chartMode === 'category') {
      this.allProducts.forEach(p => {
        const key = p.categoria?.nombre || 'General';
        const st = (p.variantes || []).reduce((s, v) => s + (v.stock || 0), 0);
        map.set(key, (map.get(key) || 0) + st);
      });
    } else {
      this.allProducts.forEach(p => {
        const key = p.genero || 'Unisex';
        const st = (p.variantes || []).reduce((s, v) => s + (v.stock || 0), 0);
        map.set(key, (map.get(key) || 0) + st);
      });
    }

    if (map.size === 0) {
      return { labels: ['Sin datos'], data: [0] };
    }

    const labels = Array.from(map.keys());
    const data = Array.from(map.values());
    return { labels, data };
  }

  getProductStock(product: Producto): number {
    return (product.variantes || []).reduce((s, v) => s + (v.stock || 0), 0);
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(val);
  }
}
