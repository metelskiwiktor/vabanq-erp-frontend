import { Component } from '@angular/core';
import {AddMaterialModule} from "../add-item/add-material/add-material.module";
import {AddProductModule} from "../add-item/add-product/add-product.module";
import {MatTab, MatTabGroup} from "@angular/material/tabs";
import {ListProductsComponent} from "./list-products/list-products.component";
import {ListMaterialsComponent} from "./list-materials/list-materials.component";

@Component({
  selector: 'app-list-items',
  templateUrl: './list-items.component.html',
  styleUrl: './list-items.component.css'
})
export class ListItemsComponent {

}
