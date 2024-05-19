import {Component, OnInit} from '@angular/core';
import {ProductService} from "../../utility/service/product.service";
import {LocalStorageService} from "../../local-storage.service";
import {NestedTreeControl} from "@angular/cdk/tree";
import {MatTreeNestedDataSource} from "@angular/material/tree";

interface SynchronizationNode {
  name: string;
  children?: SynchronizationNode[];
}

const TREE_DATA: SynchronizationNode[] = [
  {
    name: 'Oferta1',
    children: [{name: 'Przedmiot1'}, {name: 'Przedmiot2'}, {name: 'Przedmiot3'}],
  },
  {
    name: 'Vegetables',
    children: [
      {
        name: 'Green',
        children: [{name: 'Broccoli'}, {name: 'Brussels sprouts'}],
      },
      {
        name: 'Orange',
        children: [{name: 'Pumpkins'}, {name: 'Carrots'}],
      },
    ],
  },
];

@Component({
  selector: 'app-allegro-synchronized',
  templateUrl: './allegro-synchronized.component.html',
  styleUrl: './allegro-synchronized.component.css'
})
export class AllegroSynchronizedComponent implements OnInit{
  treeControl = new NestedTreeControl<SynchronizationNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<SynchronizationNode>();
  constructor(private productService: ProductService, private localStorageService: LocalStorageService) {

  }

  ngOnInit(): void {
    this.productService.getOffersProducts(localStorage.getItem('allegro-token')!).subscribe(
      response => {
        const synchronizedData: SynchronizationNode[] = response.map((item: { offerName: any; allegroOfferProducts: any[]; }) => ({
          name: item.offerName,
          children: item.allegroOfferProducts.map(product => ({
            name: product.productName + "(" + product.quantity + ")",
            children: product.allegroOfferProducts ? product.allegroOfferProducts.map((innerProduct: { productName: any; quantity: any; }) => ({
              name: innerProduct.productName + "(" + innerProduct.quantity + ")",
              children: null
            })) : null
          }))
        }));
        this.dataSource.data = synchronizedData;
        console.log(synchronizedData);
      }
    );

  }
  hasChild = (_: number, node: SynchronizationNode) => !!node.children && node.children.length > 0;

}
