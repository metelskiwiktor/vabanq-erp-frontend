import {Component, OnInit} from '@angular/core';
import {ProductService} from "../../utility/service/product.service";
import {MatDialog} from "@angular/material/dialog";
import {EditProductComponent} from "./edit-product/edit-product.component";

export interface PrintItem {
  allegroTax: number;
  id: string;
  name: string;
  ean: string;
  accessoriesQ: AccessoryQ[];
  printTime: PrintTime;
  preview?: Media;
  files?: Media[];
  price: number;
  hasPreview: boolean
}

export interface AccessoryQ {
  accessory: Accessory;
  quantity: number;
}

export interface Accessory {
  id: string;
  name: string;
  price: string;
  type: string;
}

export interface PrintTime {
  hours: number;
  minutes: number;
}

export interface Media {
  data: string;
  filename: string;
}


@Component({
  selector: 'app-list-products',
  templateUrl: './list-products.component.html',
  styleUrl: './list-products.component.css'
})
export class ListProductsComponent implements OnInit {
  printItems: PrintItem[] = [];

  constructor(private productService: ProductService, public dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.productService.getProducts().subscribe(products => {
      console.log(products);
      this.printItems = products;
    })
  }

  edit(printItem: PrintItem) {
    const dialogRef = this.dialog.open(EditProductComponent, {
      data: printItem,
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      printItem = result;
    });
  }

  hasPreview(printItem: PrintItem) {
    return printItem.preview != null;
  }
}
