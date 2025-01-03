import {Component, inject, OnInit, TemplateRef} from '@angular/core';
import { Order } from './model/orders-model';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import {ProductService} from "../../utility/service/product.service";
import {ToastService} from "../../utility/service/toast-service";

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
  // Lista zamówień (zamiast jednego obiektu "order")
  orders: Order[] = [];
  toastSuccessMessage: string = '';
  toastService = inject(ToastService);
  // Kolumny do wyświetlenia w tabeli
  columnsToDisplay: string[] = [
    'orderId',
    'saleDate',
    'market',
    'status',
    'totalAmount'
  ];

  // Zmienna do śledzenia aktualnie rozwiniętego wiersza
  expandedElement: Order | null = null;

  constructor(
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // Przykładowe dane — możesz je oczywiście pobrać z API itp.
    this.orders = [
      {
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
      },
      // Możesz dodać kolejne zamówienia:
      {
        orderId: '54321',
        market: 'amazon',
        status: 'SHIPPED',
        saleDate: '2024-12-29T19:15:00.123Z',
        buyer: {
          firstName: 'Ewa',
          lastName: 'Kowalska',
          email: 'ewa@example.com',
          phoneNumber: '+48 505 000 000',
          language: 'polski'
        },
        delivery: {
          methodName: 'Kurier DHL',
          cost: 14.99,
          dispatchTimeFrom: '2024-12-30T00:00:00.000Z',
          dispatchTimeTo: '2024-12-30T23:59:59.999Z',
          deliveryTimeFrom: '2025-01-02T23:00:00Z',
          deliveryTimeTo: '2025-01-03T22:59:59.999Z',
          deliveryAddress: {
            street: 'ul. Kwiatowa 50',
            city: 'Kraków',
            postCode: '30-001',
            countryCode: 'PL'
          }
        },
        products: [
          { name: 'Podkładka', quantity: 2, unitPrice: 39.99, totalPrice: 79.98 },
          { name: 'Zasilacz', quantity: 1, unitPrice: 100, totalPrice: 100 }
        ],
        totalAmount: 179.98
      }
    ];
  }

  synchronizeOrders(template: TemplateRef<any>): void {
    const token = localStorage.getItem('allegro-token') || '';
    this.productService.synchronizeOrders(token).subscribe(
      (response: { created: number; updated: number }) => {
        if(response.created == 0 && response.updated == 0) {
          this.toastSuccessMessage = `Pomyślnie zsynchronizowano. Brak aktualizacji.`
        } else {
          this.toastSuccessMessage = `Pomyślnie zsynchronizowano.\n${response.created} nowych zamówień\n${response.updated} zaktualizowanych zamówień.`;
        }
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

  showSuccess(template: TemplateRef<any>) {
    this.toastService.show({template, classname: 'bg-success text-light', delay: 2000, text: this.toastSuccessMessage});
  }


}
