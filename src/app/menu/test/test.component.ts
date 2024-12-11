import { Component } from '@angular/core';
import {Edge, Node} from "@swimlane/ngx-graph";


@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {
  nodes: Node[] = [];
  links: Edge[] = [];
  line: any;

  constructor() {
    // this.line = shape.line()
    //   .x((d: any) => d.x)
    //   .y((d: any) => d.y);

    this.initializeGraph();
  }

  initializeGraph() {
    // Przykładowe dane produktów
    const products = [
      { id: 'product1', label: 'Produkt 1' },
      { id: 'product2', label: 'Produkt 2' },
      { id: 'product3', label: 'Produkt 3' }
    ];

    // Przykładowe dane materiałów
    const materials = [
      { id: 'material1', label: 'Materiał A' },
      { id: 'material2', label: 'Materiał B' },
      { id: 'material3', label: 'Materiał C' }
    ];

    // Dodajemy produkty i materiały jako węzły
    this.nodes = [
      ...products.map(product => ({
        id: product.id,
        label: product.label,
        data: { type: 'product' }
      })),
      ...materials.map(material => ({
        id: material.id,
        label: material.label,
        data: { type: 'material' }
      }))
    ];

    // Przykładowe powiązania produktów z materiałami wraz z ilościami/gramaturami
    this.links = [
      {
        id: 'link1',
        source: 'product1',
        target: 'material1',
        label: 'Ilość: 10g'
      },
      {
        id: 'link2',
        source: 'product1',
        target: 'material2',
        label: 'Ilość: 5 szt.'
      },
      {
        id: 'link3',
        source: 'product2',
        target: 'material2',
        label: 'Ilość: 20g'
      },
      {
        id: 'link4',
        source: 'product2',
        target: 'material3',
        label: 'Ilość: 15 szt.'
      },
      {
        id: 'link5',
        source: 'product3',
        target: 'material1',
        label: 'Ilość: 30g'
      },
      {
        id: 'link6',
        source: 'product3',
        target: 'material3',
        label: 'Ilość: 25 szt.'
      }
    ];
  }

  generateLine(points: any[]): string {
    return this.line(points);
  }
}
