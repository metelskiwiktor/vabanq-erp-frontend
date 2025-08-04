// src/app/shared/components/vega-chart/vega-chart.component.ts
import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { VisualizationSpec } from 'vega-embed';

// Declare vega-embed as external module
declare var vegaEmbed: any;

@Component({
  selector: 'app-vega-chart',
  template: `<div #chartContainer class="vega-chart-container"></div>`,
  styleUrls: ['./vega-chart.component.css']
})
export class VegaChartComponent implements OnChanges, AfterViewInit {
  // @ts-ignore
  @Input() spec: VisualizationSpec = {};
  @Input() data: any[] = [];

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  private vegaView: any;

  ngAfterViewInit() {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['spec'] || changes['data']) && this.chartContainer) {
      this.renderChart();
    }
  }

  private async renderChart() {
    if (!this.spec || !this.chartContainer) {
      return;
    }

    try {
      // Clear previous chart
      if (this.vegaView) {
        this.vegaView.finalize();
      }

      // Prepare spec with data
      const specWithData = {
        ...this.spec,
        data: {
          values: this.data
        }
      };

      // Check if vegaEmbed is available (loaded from CDN)
      if (typeof vegaEmbed !== 'undefined') {
        const result = await vegaEmbed(this.chartContainer.nativeElement, specWithData, {
          actions: false, // Hide toolbar
          renderer: 'svg' // Use SVG renderer for better quality
        });

        this.vegaView = result.view;
      } else {
        console.error('Vega-Embed not loaded. Please include the CDN script.');
        this.chartContainer.nativeElement.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Chart loading failed. Vega-Embed library not available.</p>';
      }
    } catch (error) {
      console.error('Error rendering Vega chart:', error);
      this.chartContainer.nativeElement.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Error rendering chart.</p>';
    }
  }
}
