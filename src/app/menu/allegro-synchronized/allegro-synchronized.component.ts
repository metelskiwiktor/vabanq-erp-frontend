// allegro-synchronized.component.ts

import {Component, inject, OnInit, TemplateRef} from '@angular/core';
import {ProductService, LinkedOffersPageResponse} from "../../utility/service/product.service";
import {MatDialog} from "@angular/material/dialog";
import {OfferEditDialogComponent} from "./offer-edit-dialog/offer-edit-dialog.component";
import {ToastService} from "../../utility/service/toast-service";
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

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
  filteredOffers: Offer[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;

  // Pagination properties
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;

  // Search debouncing
  private searchSubject = new Subject<string>();

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

  // Expose Math for template
  Math = Math;

  constructor(
    private productService: ProductService,
    private dialog: MatDialog
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.currentPage = 0; // Reset to first page on search
      this.loadOffers();
    });
  }

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.isLoading = true;
    const token = localStorage.getItem('allegro-token') || '';

    const searchParam = this.searchTerm.trim() || undefined;

    this.productService.getLinkedOffersPaginated(token, this.currentPage, this.pageSize, searchParam).subscribe({
      next: (response: LinkedOffersPageResponse) => {
        // Map response to Offer interface
        this.filteredOffers = response.content.map((item, index) => ({
          number: (this.currentPage * this.pageSize) + index + 1,
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

        // Update pagination info
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.number;

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
        this.loadOffers(); // Reload current page
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
      // Po zapisie odśwież aktualną stronę
      if (saved) {
        this.loadOffers();
      }
    });
  }

  // Search functionality with debouncing
  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadOffers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadOffers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadOffers();
    }
  }

// W allegro-synchronized.component.ts - zaktualizuj metodę getPageNumbers()

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      // Show all pages if total pages is small
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (this.currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, this.currentPage + 1); // +1 bo currentPage jest 0-indexed
      const end = Math.min(this.totalPages - 1, this.currentPage + 3); // +3 zamiast +2

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== this.totalPages) {
          pages.push(i);
        }
      }

      if (this.currentPage < this.totalPages - 3) {
        pages.push('...');
      }

      // Always show last page if more than 1 page
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }

    return pages;
  }

  // Helper methods for template
  getProductsArray(offer: Offer): string[] {
    return (offer.products || []).map(p => p.productName + (p.quantity ? ` (${p.quantity})` : ''));
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

  getActiveOffersCount(): number {
    return this.filteredOffers.filter(offer => offer.auctionStatus === 'ACTIVE').length;
  }

  getTotalAvailable(): number {
    return this.filteredOffers.reduce((total, offer) => {
      const available = offer.allegroQuantity.split('/')[0];
      return total + (parseInt(available) || 0);
    }, 0);
  }

  getTotalSold(): number {
    return this.filteredOffers.reduce((total, offer) => {
      const quantities = offer.allegroQuantity.split('/');
      if (quantities.length === 2) {
        const available = parseInt(quantities[0]) || 0;
        const total_stock = parseInt(quantities[1]) || 0;
        const sold = total_stock - available;
        return total + sold;
      }
      return total;
    }, 0);
  }
}
