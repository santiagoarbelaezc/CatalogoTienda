import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CatalogService } from '../../../core/catalog.service';
import { AnalyticsService, AnalyticKpi, TopVariantMetric, ChartDistribution, CategorySummaryItem, BrandSummaryItem } from '../../../core/analytics.service';
import { Producto } from '../../../models/catalog.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics-page.component.html',
  styleUrls: ['./analytics-page.component.scss']
})
export class AnalyticsPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('distChart') distChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('waChart') waChartCanvas!: ElementRef<HTMLCanvasElement>;

  private distChart: Chart | null = null;
  private waChart: Chart | null = null;

  isLoading = true;
  distributionMode: 'category' | 'brand' | 'gender' = 'category';

  kpis: AnalyticKpi[] = [];
  topVariants: TopVariantMetric[] = [];

  categoryDistribution: ChartDistribution = { labels: [], data: [] };
  brandDistribution: ChartDistribution = { labels: [], data: [] };
  genderDistribution: ChartDistribution = { labels: [], data: [] };
  quotesByDayData: ChartDistribution = { labels: [], data: [] };

  categorySummaries: CategorySummaryItem[] = [];
  brandSummaries: BrandSummaryItem[] = [];

  constructor(
    private catalogService: CatalogService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit() {
    this.loadAnalyticsFromBackend();
  }

  loadAnalyticsFromBackend() {
    this.isLoading = true;
    this.analyticsService.getDashboardAnalytics().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success && res.data) {
          const d = res.data;
          this.kpis = d.kpis || [];
          this.categoryDistribution = d.categoryDistribution || { labels: [], data: [] };
          this.brandDistribution = d.brandDistribution || { labels: [], data: [] };
          this.genderDistribution = d.genderDistribution || { labels: [], data: [] };
          this.quotesByDayData = d.quotesByDay || { labels: [], data: [] };
          this.topVariants = d.topVariants || [];

          if (d.catalogSummary) {
            this.categorySummaries = d.catalogSummary.categories || [];
            this.brandSummaries = d.catalogSummary.brands || [];
          }

          this.updateDistChart();
          this.updateWaChart();
        }
      },
      error: (err) => {
        console.warn('Backend analytics unaccessible, calculating from local catalog:', err);
        this.isLoading = false;
        this.catalogService.products$.subscribe(list => {
          this.computeLocalAnalytics(list || []);
        });
      }
    });
  }

  setDistributionMode(mode: 'category' | 'brand' | 'gender') {
    this.distributionMode = mode;
    this.updateDistChart();
  }

  private computeLocalAnalytics(products: Producto[]) {
    const totalProd = products.length;
    let activeProd = 0;
    let totalStock = 0;
    let totalValue = 0;
    let lowStock = 0;
    let variantCount = 0;

    const catMap = new Map<string, number>();
    const brandMap = new Map<string, number>();
    const genderMap = new Map<string, number>();

    products.forEach(p => {
      if (p.activo) activeProd++;
      const catName = p.categoria?.nombre || 'Sin Categoría';
      catMap.set(catName, (catMap.get(catName) || 0) + 1);

      const brandName = p.marca?.nombre || 'Sin Marca';
      brandMap.set(brandName, (brandMap.get(brandName) || 0) + 1);

      const gender = p.genero || 'Sin Definir';
      genderMap.set(gender, (genderMap.get(gender) || 0) + 1);

      (p.variantes || []).forEach(v => {
        variantCount++;
        const s = v.stock || 0;
        const pr = v.precio && v.precio > 0 ? v.precio : (p.precio_base || 0);
        totalStock += s;
        totalValue += (s * pr);
        if (s <= 5) lowStock++;
      });
    });

    this.categoryDistribution = {
      labels: Array.from(catMap.keys()),
      data: Array.from(catMap.values())
    };

    this.brandDistribution = {
      labels: Array.from(brandMap.keys()),
      data: Array.from(brandMap.values())
    };

    this.genderDistribution = {
      labels: Array.from(genderMap.keys()),
      data: Array.from(genderMap.values())
    };

    this.kpis = [
      {
        title: 'Total Productos en Catálogo',
        value: `${totalProd}`,
        icon: 'inventory_2',
        trend: totalProd > 0 ? Math.round((activeProd / totalProd) * 100) : 0,
        trendLabel: `${activeProd} activos en tienda`
      },
      {
        title: 'Valorización del Inventario',
        value: this.formatCurrency(totalValue),
        icon: 'paid',
        trend: variantCount,
        trendLabel: `en ${variantCount} variantes`
      },
      {
        title: 'Existencias Totales (Stock)',
        value: `${totalStock}`,
        icon: 'stacked_bar_chart',
        trend: lowStock > 0 ? -lowStock : 0,
        trendLabel: lowStock > 0 ? `${lowStock} variantes bajo stock` : 'Stock saludable'
      },
      {
        title: 'Cotizaciones WhatsApp',
        value: '0',
        icon: 'chat',
        trend: 0,
        trendLabel: 'Sin eventos registrados'
      }
    ];

    this.updateDistChart();
    this.updateWaChart();
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val).replace('COP', '$').trim();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initDistChart();
      this.initWaChart();
    }, 100);
  }

  ngOnDestroy() {
    this.distChart?.destroy();
    this.waChart?.destroy();
  }

  private getCurrentDistributionData(): ChartDistribution {
    if (this.distributionMode === 'brand') return this.brandDistribution;
    if (this.distributionMode === 'gender') return this.genderDistribution;
    return this.categoryDistribution;
  }

  private initDistChart() {
    if (!this.distChartCanvas?.nativeElement) return;
    const ctx = this.distChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const dataObj = this.getCurrentDistributionData();
    const colors = [
      '#111111', '#4b5563', '#9ca3af', '#d1d5db',
      '#eac7d2', '#c59b27', '#2563eb', '#10b981',
      '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'
    ];

    this.distChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: dataObj.labels.length ? dataObj.labels : ['Sin datos'],
        datasets: [{
          data: dataObj.data.length ? dataObj.data : [1],
          backgroundColor: colors.slice(0, Math.max(1, dataObj.labels.length)),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 14,
              font: { family: 'inherit', size: 12, weight: 600 }
            }
          }
        }
      }
    });
  }

  private updateDistChart() {
    if (!this.distChart) {
      this.initDistChart();
      return;
    }
    const dataObj = this.getCurrentDistributionData();
    const colors = [
      '#111111', '#4b5563', '#9ca3af', '#d1d5db',
      '#eac7d2', '#c59b27', '#2563eb', '#10b981',
      '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'
    ];

    this.distChart.data.labels = dataObj.labels.length ? dataObj.labels : ['Sin datos'];
    this.distChart.data.datasets[0].data = dataObj.data.length ? dataObj.data : [0];
    this.distChart.data.datasets[0].backgroundColor = colors.slice(0, Math.max(1, dataObj.labels.length));
    this.distChart.update();
  }

  private initWaChart() {
    if (!this.waChartCanvas?.nativeElement) return;
    const ctx = this.waChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const dataObj = this.quotesByDayData;

    this.waChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dataObj.labels.length ? dataObj.labels : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Cotizaciones WhatsApp',
          data: dataObj.data.length ? dataObj.data : [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: '#25D366',
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'inherit', size: 11, weight: 600 } }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0,
              font: { family: 'inherit', size: 11 }
            },
            grid: { color: '#f1f3f5' }
          }
        }
      }
    });
  }

  private updateWaChart() {
    if (!this.waChart) {
      this.initWaChart();
      return;
    }
    this.waChart.data.labels = this.quotesByDayData.labels;
    this.waChart.data.datasets[0].data = this.quotesByDayData.data;
    this.waChart.update();
  }
}
