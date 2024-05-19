import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ProductService} from "../../utility/service/product.service";
import {MatStepper} from "@angular/material/stepper";
import {LocalStorageService} from "../../local-storage.service";

export interface Offer {
  items: any[];
  id: string;
  name: string;
  sellingMode: {
    price: {
      amount: string;
      currency: string;
    };
  };
  stock: {
    available: number;
    sold: number;
  };
  stats: { watchersCount: number, visitsCount: number };
  primaryImage: {
    url: string;
  }
}

@Component({
  selector: 'app-allegro-synchronization',
  templateUrl: './allegro-synchronization.component.html',
  styleUrl: './allegro-synchronization.component.css'
})
export class AllegroSynchronizationComponent implements OnInit {
  offers: Offer[] = [];
  printItems: any = [
    {
      "name": "asdsa",
      "id": "1234",
      "quantity": 1
    },
    {
      "name": "sdfsdfdsfs",
      "id": "12344",
      "quantity": 1
    }
  ]
  firstFormGroup: FormGroup;
  displayedColumns: string[] = ['name', 'quantity', 'action']

  constructor(private formBuilder: FormBuilder, private productService: ProductService, private localStorageService: LocalStorageService) {
    this.firstFormGroup = this.formBuilder.group({});
  }

  updated: boolean = false;
  updatedCount: number = 0;

  update() {
    // Logika aktualizacji
    this.offers.forEach(offer => {
      this.productService.createOfferProducts(
        {
          "id": offer.id,
          "offerName": offer.name,
          productsQuantities: offer.items.map(item => {
            return {
              "productId": item.id,
              "quantity": item.quantity,
            }
          })
        }
      ).subscribe(response => console.log(response));
    })
    this.updatedCount = this.offers.length;
    this.updated = true;
    this.offers = [];
  }

  createForm(): FormGroup {
    return this.firstFormGroup;
  }

  ngOnInit(): void {
    this.productService.getOffers(this.localStorageService.getItem('allegro-token')!).subscribe((data: any) => {
        this.offers = data.offers;
      },
      error => {
        console.log(error)
      }
    );
    this.productService.getProducts().subscribe(
      (response: any[]) => {
        response.forEach(offer => {
          offer.quantity = 1;
        })
        this.printItems = response;
      }
    )
  }

  addQuantity(row: any) {
    row.quantity++;
  }

  subtractQuantity(row: any) {
    if (row.quantity == 0) return;
    row.quantity--;
  }

  deleteRow(row: any) {
    this.offers = this.offers.filter(offer => offer.id !== row.id);
    console.log(this.offers);
  }

  isLastStep(stepper: MatStepper) {
    return stepper.selectedIndex === stepper.steps.length - 1;
  }
}
