// allegro-synchronized.component.ts

import {Component, OnInit} from '@angular/core';
import {ProductService} from "../../utility/service/product.service";
import {HttpHeaders} from "@angular/common/http";
import {MatDialog} from "@angular/material/dialog";
import {OfferEditDialogComponent} from "./offer-edit-dialog/offer-edit-dialog.component";

export interface Offer {
  number: number;
  imageUrl: string;
  auctionName: string;
  offerNumber: string;
  linkedProducts: string;
  price: number;
  allegroQuantity: string;
  wmsQuantity: number;
  commission: number;
  ean: string;
}

@Component({
  selector: 'app-allegro-synchronized',
  templateUrl: './allegro-synchronized.component.html',
  styleUrls: ['./allegro-synchronized.component.css']
})
export class AllegroSynchronizedComponent implements OnInit {
  displayedColumns: string[] = [
    'number',
    'imageUrl',
    'auctionName',
    'offerNumber',
    'linkedProducts',
    'price',
    'allegroQuantity',
    'wmsQuantity',
    'commission',
    'ean',
    'auctionStatus',
    'actions'
  ];

  offers: Offer[] = [];

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
        allegroQuantity: item.availableStock + "/" + (item.availableStock + item.soldStock) || "0",
        wmsQuantity: item.soldStock || 0,
        commission: 0, // jeśli brak w backendzie, ustaw np. 0
        ean: item.ean || '',
        auctionStatus: item.auctionStatus || '?'
      }));
    });
  }

  synchronize(): void {
    const token = localStorage.getItem('allegro-token') || '';
    this.productService.synchronize(token).subscribe(() => {
      this.loadOffers(); // Po synchronizacji przeładuj oferty
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
}
