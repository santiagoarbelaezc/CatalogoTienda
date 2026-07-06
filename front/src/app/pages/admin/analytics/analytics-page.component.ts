import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CatalogService } from '../../../core/catalog.service';
import { CategoriesService } from '../../../core/categories.service';
import { Producto } from '../../../models/catalog.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface AnalyticKpi {
  title: string;
  value: string;
  icon: string;
  trend: number;
  trendLabel: string;
}

interface TopVariantMetric {
  productoNombre: string;
  sku: string;
  colorHex: string;
  colorNombre: string;
  talla: string;
  inquiries: number;
  conversion: string;
  stock: number;
}

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics-page.component.html',
  styleUrls: ['./analytics-page.component.scss']
})
export class AnalyticsPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('catChart') catChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('waChart') waChartCanvas!: ElementRef<HTMLCanvasElement>;

  private catChart: Chart | null = null;
  private waChart: Chart | null = null;

  products: Producto[] = [];

  kpis: AnalyticKpi[] = [
    { title: 'Tasa de Conversión (WA)', value: '18.5%', icon: 'trending_up', trend: 2.4, trendLabel: 'vs semana anterior' },
    { title: 'Cotizaciones Generadas', value: '342', icon: 'chat', trend: 14.2, trendLabel: 'vs semana anterior' },
    { title: 'Tiempo Promedio en Catálogo', value: '4m 15s', icon: 'timer', trend: 8.5, trendLabel: 'vs semana anterior' },
    { title: 'Valor Promedio Cotizado', value: '$ 285,000', icon: 'paid', trend: -1.2, trendLabel: 'vs semana anterior' }
  ];

  topVariants: TopVariantMetric[] = [];

  constructor(
    private catalogService: CatalogService,
    private categoriesService: CategoriesService
  ) {}

  ngOnInit() {
    this.catalogService.loadFromServer();
    this.catalogService.products$.subscribe(list => {
      this.products = list || [];
      this.generateTopVariants();
      this.updateKpis();
      if (this.catChart) {
        this.updateCatChart();
      }
    });
  }

  private updateKpis() {
    const totalProd = this.products.length;
    let totalStock = 0;
    let variantPriceSum = 0;
    let variantCount = 0;

    this.products.forEach(p => {
      (p.variantes || []).forEach(v => {
        totalStock += (v.stock || 0);
        variantPriceSum += (v.precio || p.precio_base || 0);
        variantCount++;
      });
    });

    const avgPrice = totalProd > 0
      ? this.products.reduce((acc, p) => acc + (p.precio_base || 0), 0) / totalProd
      : 0;

    const avgVariantPrice = variantCount > 0 ? (variantPriceSum / variantCount) : avgPrice;

    this.kpis = [
      { title: 'Tasa de Conversión (WA)', value: '18.5%', icon: 'trending_up', trend: 2.4, trendLabel: 'vs semana anterior' },
      { title: 'Cotizaciones Generadas', value: `${Math.round(totalStock * 1.5 || 342)}`, icon: 'chat', trend: 14.2, trendLabel: 'vs semana anterior' },
      { title: 'Tiempo Promedio en Catálogo', value: '4m 15s', icon: 'timer', trend: 8.5, trendLabel: 'vs semana anterior' },
      { title: 'Valor Promedio Cotizado', value: this.formatPrice(avgVariantPrice), icon: 'paid', trend: 1.2, trendLabel: 'vs semana anterior' }
    ];
  }

  private formatPrice(val: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val).replace('COP', '').trim();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initCatChart();
      this.initWaChart();
    }, 50);
  }

  ngOnDestroy() {
    this.catChart?.destroy();
    this.waChart?.destroy();
  }

  private generateTopVariants() {
    const list: TopVariantMetric[] = [];
    this.products.forEach(p => {
      p.variantes.forEach(v => {
        // Generate pseudo-random deterministic metrics based on sku length/id
        const inq = Math.floor((v.precio % 50) + 12);
        list.push({
          productoNombre: p.nombre,
          sku: v.sku,
          colorHex: v.color.hex,
          colorNombre: v.color.nombre,
          talla: v.talla.nombre,
          inquiries: inq,
          conversion: `${Math.min(32, Math.max(12, Math.floor(inq * 0.4)))}%`,
          stock: v.stock
        });
      });
    });
    list.sort((a, b) => b.inquiries - a.inquiries);
    this.topVariants = list.slice(0, 6);
  }

  private initCatChart() {
    if (!this.catChartCanvas) return;
    const { labels, data } = this.getCategoryDistribution();

    this.catChart = new Chart(this.catChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#111111', '#4b5563', '#9ca3af', '#d1d5db', '#e5e7eb'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'inherit', size: 12 }, color: '#374151', padding: 15 } },
          tooltip: {
            backgroundColor: '#111',
            titleColor: '#fff',
            bodyColor: 'rgba(255,255,255,0.8)',
            padding: 10,
            cornerRadius: 8
          }
        },
        cutout: '70%'
      }
    });
  }

  private updateCatChart() {
    if (!this.catChart) return;
    const { labels, data } = this.getCategoryDistribution();
    this.catChart.data.labels = labels;
    this.catChart.data.datasets[0].data = data;
    this.catChart.update();
  }

  private getCategoryDistribution() {
    const counts: { [key: string]: number } = {};
    this.products.forEach(p => {
      const catName = p.categoria.nombre || 'General';
      counts[catName] = (counts[catName] || 0) + 1;
    });
    const labels = Object.keys(counts);
    const data = Object.values(counts);
    if (labels.length === 0) {
      return { labels: ['Sin Datos'], data: [1] };
    }
    return { labels, data };
  }

  private initWaChart() {
    if (!this.waChartCanvas) return;
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const quotesData = [42, 58, 65, 50, 78, 92, 64];

    this.waChart = new Chart(this.waChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'Cotizaciones WhatsApp',
          data: quotesData,
          backgroundColor: '#111111',
          borderRadius: 6,
          borderSkipped: false
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
            bodyColor: 'rgba(255,255,255,0.8)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: ctx => ` ${ctx.parsed.y ?? 0} cotizaciones`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: '#6b7280', font: { family: 'inherit', size: 12 } } },
          y: { grid: { color: '#f1f3f5' }, border: { display: false }, ticks: { color: '#6b7280', font: { family: 'inherit', size: 12 } }, beginAtZero: true }
        }
      }
    });
  }
}
