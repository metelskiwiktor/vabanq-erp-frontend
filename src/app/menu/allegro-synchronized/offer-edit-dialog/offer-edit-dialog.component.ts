
// 3. Dodaj nowy komponent OfferEditDialogComponent
// offer-edit-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ProductService } from "../../../utility/service/product.service";

interface ProductQuantityRequest {
  productId: string;
  quantity: number;
}

interface LinkedProduct {
  productId: string;
  productName: string;
  productEan: string;
  quantity: number;
}

@Component({
  selector: 'app-offer-edit-dialog',
  styleUrl: './offer-edit-dialog.component.css',
  templateUrl: './offer-edit-dialog.component.html'
})
export class OfferEditDialogComponent implements OnInit {
  offerNumber: string = '';
  products: LinkedProduct[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<OfferEditDialogComponent>,
    private productService: ProductService
  ) {
    // Przekazujemy z parenta: data.offer
    this.offerNumber = data.offer.offerNumber;
  }

  ngOnInit() {
    // Załóżmy, że w polu 'linkedProducts' mamy nazwy, ale
    // w oryginalnym obiekcie (z backendu) powinniśmy mieć tablicę `products`.
    // Tutaj trzeba pobrać ofertę (z ewent. innym endpointem) albo
    // założyć że w data.offer mamy "raw" tablicę item.products
    //
    // Przykład: item.products => { productId, productName, productEan, quantity }
    //
    // Jeśli w tym momencie mamy tylko string, to trzeba to przepisać,
    // ale w idealnym scenariuszu w data.offer mamy już szczegółowe info:

    // Tu uproszczony wariant (jeśli w data.offer mamy `products` jako tablicę obiektów):
    const backendProducts = this.data.offer.products || [];
    this.products = backendProducts.map((bp: any) => ({
      productId: bp.productId,
      productName: bp.productName,
      productEan: bp.productEan,
      quantity: bp.quantity
    }));
  }

  onSave() {
    // Szykujemy tablicę ProductQuantityRequest do wysłania do backendu
    const token = localStorage.getItem('allegro-token') || '';
    const body: ProductQuantityRequest[] = this.products.map((p) => ({
      productId: p.productId,
      quantity: p.quantity
    }));

    this.productService.updateOfferAssignment(this.offerNumber, body, token).subscribe(() => {
      this.dialogRef.close(true);
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
