import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CatalogService } from '../../../core/catalog.service';
import { Producto } from '../../../models/catalog.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface KpiCard {
  title: string;
  value: string;
  icon: string;
  trend: number;
  trendLabel: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('salesChart') chartCanvas!: ElementRef<HTMLCanvasElement>;

  topProducts: Producto[] = [];
  private chart: Chart | null = null;

  kpis: KpiCard[] = [
    {
      title: 'Ventas del Mes',
      value: '$ 4,850,000',
      icon: 'paid',
      trend: 14.2,
      trendLabel: 'vs mes anterior'
    },
    {
      title: 'Pedidos Pendientes',
      value: '8',
      icon: 'shopping_bag',
      trend: -5,
      trendLabel: 'vs mes anterior'
    },
    {
      title: 'Nuevos Usuarios',
      value: '34',
      icon: 'group_add',
      trend: 22.5,
      trendLabel: 'vs mes anterior'
    },
    {
      title: 'Ticket Promedio',
      value: '$ 142,600',
      icon: 'receipt_long',
      trend: 4.8,
      trendLabel: 'vs mes anterior'
    }
  ];

  constructor(private catalogService: CatalogService) {}

  ngOnInit() {
    this.topProducts = this.catalogService.getTopProducts(3);
  }

  ngAfterViewInit() {
    this.buildChart();
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  private buildChart() {
    const labels = this.generateLast30DaysLabels();
    const data = this.generateMockSalesData();

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Ventas',
          data,
          borderColor: '#111111',
          backgroundColor: 'rgba(17,17,17,0.04)',
          borderWidth: 2,
          pointBackgroundColor: '#111111',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
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
            bodyColor: 'rgba(255,255,255,0.7)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: ctx => ` $ ${(ctx.parsed.y ?? 0).toLocaleString('es-CO')}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: '#9ca3af',
              font: { size: 11, family: 'Outfit' },
              maxTicksLimit: 8,
            }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            border: { display: false },
            ticks: {
              color: '#9ca3af',
              font: { size: 11, family: 'Outfit' },
              callback: val => `${(+val / 1000).toFixed(0)}k`
            }
          }
        }
      }
    });
  }

  private generateLast30DaysLabels(): string[] {
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }));
    }
    return days;
  }

  private generateMockSalesData(): number[] {
    const base = [420000, 580000, 510000, 640000, 590000, 780000, 860000, 720000,
                  690000, 810000, 930000, 870000, 760000, 840000, 920000, 880000,
                  790000, 850000, 960000, 830000, 710000, 650000, 740000, 820000,
                  900000, 870000, 940000, 820000, 880000, 750000];
    return base;
  }

  getProductStock(product: Producto): number {
    return product.variantes.reduce((s, v) => s + v.stock, 0);
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(val);
  }

  get trendPositive(): boolean {
    return true;
  }
}
