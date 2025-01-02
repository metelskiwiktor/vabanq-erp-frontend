// allegro-synchronized.component.ts

import {Component, inject, OnInit, TemplateRef} from '@angular/core';
import {ProductService} from "../../utility/service/product.service";
import {HttpHeaders} from "@angular/common/http";
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
  toastService = inject(ToastService);
  displayedColumns: string[] = [
    'number',
    'imageUrl',
    'auctionName',
    'offerNumber',
    'linkedProducts',
    'price',
    'allegroQuantity',
    'ean',
    'auctionStatus',
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
    const token = localStorage.getItem('allegro-token') || '';
    this.productService.getLinkedOffers(token).subscribe((response: any[]) => {
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
        auctionStatus: item.auctionStatus || '?',
        products: item.products
      }));
    });
  }

  synchronize(template: TemplateRef<any>): void {
    const token = localStorage.getItem('allegro-token') || '';
    this.productService.synchronize(token).subscribe(
      (response: { created: number; updated: number }) => {
        if(response.created == 0 && response.updated == 0) {
          this.toastSuccessMessage = `Pomyślnie zsynchronizowano. Brak aktualizacji.`
        } else {
          this.toastSuccessMessage = `Pomyślnie zsynchronizowano.\n${response.created} nowych ofert\n${response.updated} zaktualizowanych ofert.`;
        }
        this.showSuccess(template);
        this.loadOffers();
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

  synchronizeOrders() {
    const token = localStorage.getItem('allegro-token') || '';
    this.productService.synchronizeOrders(token).subscribe(value => console.log(value));
  }
}
