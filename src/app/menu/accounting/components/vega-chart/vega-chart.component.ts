// src/app/menu/accounting/components/vega-chart/vega-chart.component.ts
import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  OnDestroy
} from '@angular/core';

import embed from 'vega-embed';
import {VisualizationSpec} from 'vega-embed';

import { View } from 'vega';

@Component({
  selector: 'app-vega-chart',
  template: `
    <div class="vega-chart-container">
      <div #vegaContainer class="vega-chart"></div>
    </div>
  `,
  styleUrls: ['./vega-chart.component.css']
})
export class VegaChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('vegaContainer', { static: true }) vegaContainer!: ElementRef;
  // @ts-ignore
  @Input() spec!: VisualizationSpec;
  @Input() data: any[] = [];

  private view: View | null = null;

  ngOnInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['spec']) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    if (this.view) {
      this.view.finalize();
    }
  }

  private async renderChart(): Promise<void> {
    if (!this.spec || !this.vegaContainer) return;

    try {
      // Clean up previous chart
      if (this.view) {
        this.view.finalize();
      }

      // Create spec with data
      const specWithData = {
        ...this.spec,
        data: { values: this.data }
      };

      // Render chart
      const result = await embed(this.vegaContainer.nativeElement, specWithData, {
        actions: false,
        tooltip: true,
        hover: true,
        renderer: 'svg'
      });

      this.view = result.view;

    } catch (error) {
      console.error('Error rendering Vega-Lite chart:', error);
    }
  }
}
