import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import { Order } from './model/orders-model';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { ProductService } from "../../utility/service/product.service";
import { ToastService } from "../../utility/service/toast-service";

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  toastSuccessMessage: string = '';
  toastService = inject(ToastService);

  columnsToDisplay: string[] = [
    'orderId',
    'saleDate',
    'market',
    'status',
    'totalAmount'
  ];

  expandedElement: Order | null = null;
  allExpanded: boolean = false;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    const token = localStorage.getItem('allegro-token') || '';
    this.productService.getOrders(token).subscribe({
      next: (orders: Order[]) => {
        this.orders = orders.map(order => ({ ...order, isExpanded: false }));
        console.log('Fetched orders:', this.orders);
      },
      error: (error) => {
        console.error('Failed to fetch orders:', error);
      }
    });
  }

  synchronizeOrders(template: TemplateRef<any>): void {
    const token = localStorage.getItem('allegro-token') || '';
    this.productService.synchronizeOrders(token).subscribe(
      (response: { created: number; updated: number }) => {
        if (response.created === 0 && response.updated === 0) {
          this.toastSuccessMessage = `Successfully synchronized. No updates.`;
        } else {
          this.toastSuccessMessage = `Successfully synchronized.\n${response.created} new orders\n${response.updated} updated orders.`;
        }
        this.fetchOrders();
        this.showSuccess(template);
      },
      (error) => {
        console.error('Synchronization failed:', error);
        this.toastService.show({
          template: template,
          classname: 'bg-danger text-light',
          delay: 2000,
          text: 'Synchronization failed. Please try again.',
        });
      }
    );
  }

  toggleAllDetails(): void {
    this.allExpanded = !this.allExpanded;
    this.orders = this.orders.map(order => ({ ...order, isExpanded: this.allExpanded }));
  }

  showSuccess(template: TemplateRef<any>): void {
    this.toastService.show({
      template,
      classname: 'bg-success text-light',
      delay: 2000,
      text: this.toastSuccessMessage
    });
  }
}
