// allegro-synchronized.component.ts

import {Component, inject, OnInit, TemplateRef} from '@angular/core';
import {ProductService} from "../../utility/service/product.service";
import {MatDialog} from "@angular/material/dialog";
import {OfferEditDialogComponent} from "./offer-edit-dialog/offer-edit-dialog.component";
import {ToastService} from "../../utility/service/toast-service";

export interface Offer {
  number: number;
  imageUrl: string;
  auctionName: string;
  offerNumber: string;
  linkedProducts: string;
  price: number;
  allegroQuantity: string;
  ean: string;
  auctionStatus: string;
  // For backward compatibility
  packaging?: {
    id: string;
    name: string;
  };
  // New field for multiple packagings
  packagings?: {
    packagingId: string;
    packagingName: string;
    quantity: number;
  }[];
  products?: {
    productId: string;
    productName: string;
    productEan: string;
    quantity: number;
  }[];
}

@Component({
  selector: 'app-allegro-synchronized',
  templateUrl: './allegro-synchronized.component.html',
  styleUrls: ['./allegro-synchronized.component.css']
})
export class AllegroSynchronizedComponent implements OnInit {
  toastSuccessMessage: string = '';
  offers: Offer[] = [];
  filteredOffers: Offer[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;

  toastService = inject(ToastService);

  displayedColumns: string[] = [
    'offer',
    'ean',
    'products',
    'price',
    'quantity',
    'status',
    'packaging',
    'actions'
  ];

  constructor(
    private productService: ProductService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.isLoading = true;
    const token = localStorage.getItem('allegro-token') || '';

    this.productService.getLinkedOffers(token).subscribe({
      next: (response: any[]) => {
        // response to List<LinkedOfferResponse> z backendu
        // Mapujemy do interfejsu Offer
        this.offers = response.map((item, index) => ({
          number: index + 1,
          imageUrl: item.imageUrl || 'assets/default-image.png',
          auctionName: item.offerName,
          offerNumber: item.offerId,
          linkedProducts: (item.products || [])
            .map((p: any) => p.productName)
            .join(', '),
          price: item.price || 0,
          allegroQuantity: item.availableStock + "/" + (item.availableStock + item.soldStock) || "?",
          ean: item.ean || '?',
          auctionStatus: item.auctionStatus || 'INACTIVE',
          // Handle both single packaging and multiple packagings
          packaging: item.packaging || null,
          packagings: item.packagings || [],
          products: item.products
        }));

        this.filteredOffers = [...this.offers];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading offers:', error);
        this.isLoading = false;
      }
    });
  }

  synchronizeOffers(template: TemplateRef<any>): void {
    this.isLoading = true;
    const token = localStorage.getItem('allegro-token') || '';

    this.productService.synchronizeOffers(token).subscribe({
      next: (response: { created: number; updated: number }) => {
        this.isLoading = false;

        if(response.created == 0 && response.updated == 0) {
          this.toastSuccessMessage = `Pomyślnie zsynchronizowano. Brak aktualizacji.`
        } else {
          this.toastSuccessMessage = `Pomyślnie zsynchronizowano.\n${response.created} nowych ofert\n${response.updated} zaktualizowanych ofert.`;
        }
        this.showSuccess(template);
        this.loadOffers();
      },
      error: (error) => {
        console.error('Synchronization failed:', error);
        this.isLoading = false;
        this.toastService.show({
          template: template,
          classname: 'bg-danger text-light',
          delay: 2000,
          text: 'Synchronization failed. Please try again.',
        });
      }
    });
  }

  showSuccess(template: TemplateRef<any>) {
    this.toastService.show({
      template,
      classname: 'bg-success text-light',
      delay: 2000,
      text: this.toastSuccessMessage
    });
  }

  openEditDialog(offer: Offer): void {
    const dialogRef = this.dialog.open(OfferEditDialogComponent, {
      width: '500px',
      data: { offer }
    });

    dialogRef.afterClosed().subscribe((saved) => {
      // Po zapisie odśwież tabelę
      if (saved) {
        this.loadOffers();
      }
    });
  }

  // Search functionality
  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredOffers = [...this.offers];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredOffers = this.offers.filter(offer =>
      offer.auctionName.toLowerCase().includes(searchLower) ||
      offer.offerNumber.toLowerCase().includes(searchLower) ||
      offer.ean.toLowerCase().includes(searchLower) ||
      (offer.products || []).some(product =>
        product.productName.toLowerCase().includes(searchLower)
      )
    );
  }

  // Helper methods for template
  getProductsArray(offer: Offer): string[] {
    return (offer.products || []).map(p => p.productName);
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'ACTIVE': return 'Aktywna';
      case 'INACTIVE': return 'Nieaktywna';
      case 'ENDED': return 'Zakończona';
      default: return status || 'Nieznany';
    }
  }

  onImageError(event: any): void {
    event.target.src = 'assets/default-image.png';
  }

  // Stats methods
  getActiveOffersCount(): number {
    return this.offers.filter(offer => offer.auctionStatus === 'ACTIVE').length;
  }

  getInactiveOffersCount(): number {
    return this.offers.filter(offer => offer.auctionStatus !== 'ACTIVE').length;
  }

  getTotalQuantity(): number {
    return this.offers.reduce((total, offer) => {
      const quantity = offer.allegroQuantity.split('/')[0];
      return total + (parseInt(quantity) || 0);
    }, 0);
  }

  getTotalValue(): number {
    return this.offers.reduce((total, offer) => total + (offer.price || 0), 0);
  }
}
