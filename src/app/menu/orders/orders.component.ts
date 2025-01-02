import {Component, OnInit} from '@angular/core';
import {Order} from "./model/orders-model";

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit  {
  order!: Order; // Pojedyncze zamówienie
  displayedColumns: string[] = ['quantity', 'name', 'unitPrice', 'totalPrice'];

  constructor() {}

  ngOnInit(): void {
    // Przykładowe dane
    this.order = {
      orderId: '12345',
      market: 'allegro-pl',
      status: 'READY_FOR_PROCESSING',
      saleDate: '2024-12-28T21:26:26.745Z',
      buyer: {
        firstName: 'Adam',
        lastName: 'Podczerewiński',
        email: 'adam@example.com',
        phoneNumber: '+48 539 444 444',
        language: 'polski'
      },
      delivery: {
        methodName: 'Allegro Paczkomaty InPost',
        cost: 0.00,
        dispatchTimeFrom: '2024-12-31T23:59:59.999Z',
        dispatchTimeTo: '2024-12-31T23:59:59.999Z',
        deliveryTimeFrom: '2025-01-01T23:00:00Z',
        deliveryTimeTo: '2025-01-02T22:59:59.999Z',
        deliveryAddress: {
          street: 'Podczerwone 112',
          city: 'Czarny Dunajec',
          postCode: '34-470',
          countryCode: 'PL'
        }
      },
      products: [
        { name: 'VaBanQ Slim', quantity: 1, unitPrice: 24.99, totalPrice: 24.99 },
        { name: 'Znacznik 4cm', quantity: 5, unitPrice: 29.99, totalPrice: 149.95 }
      ],
      totalAmount: 174.94
    };
  }
}
