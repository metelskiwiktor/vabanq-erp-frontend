import {Component, OnInit} from '@angular/core';
import {ProductService} from "../../utility/service/product.service";
import {LocalStorageService} from "../../local-storage.service";
import {NestedTreeControl} from "@angular/cdk/tree";
import {MatTreeNestedDataSource} from "@angular/material/tree";

interface SynchronizationNode {
  name: string;
  children?: SynchronizationNode[];
}

export interface Offer {
  number: number;
  imageUrl: string;
  auctionName: string;
  offerNumber: string;
  linkedProducts: string;
  price: number;
  allegroQuantity: number;
  wmsQuantity: number;
  commission: number;
  ean: string;
}

@Component({
  selector: 'app-allegro-synchronized',
  templateUrl: './allegro-synchronized.component.html',
  styleUrl: './allegro-synchronized.component.css'
})
export class AllegroSynchronizedComponent implements OnInit{
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
    'ean'
  ];

  offers: Offer[] = [];
  constructor(private productService: ProductService, private localStorageService: LocalStorageService) {

  }

  ngOnInit(): void {
    const token = localStorage.getItem('allegro-token')!;
    this.productService.getOffersProducts(token).subscribe((response: any[]) => {
      this.offers = response.map((item, index) => ({
        number: index + 1,
        imageUrl: item.imageUrl || 'assets/default-image.png', // Placeholder for missing images
        auctionName: item.offerName,
        offerNumber: item.offerId,
        linkedProducts: item.allegroOfferProducts.map((p: { productName: any; }) => p.productName).join(', '),
        price: item.price,
        allegroQuantity: item.allegroQuantity,
        wmsQuantity: item.wmsQuantity,
        commission: item.commission,
        ean: item.ean
      }));
    });
  }
  hasChild = (_: number, node: SynchronizationNode) => !!node.children && node.children.length > 0;

}
