import {Component, OnInit} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {ProductService} from "../../utility/service/product.service";

interface WmsItem {
  type: 'product'|'filament'|'packaging'|'fasteners';
  id: string;
  name: string;
  wms: {enabled: boolean, quantity: number, criticalStock: number};
}


@Component({
  selector: 'app-product-materials-wms-table',
  templateUrl: './product-materials-wms-table.component.html',
  styleUrl: './product-materials-wms-table.component.css'
})
export class ProductMaterialsWmsTableComponent implements OnInit {
  displayedColumns = ['name','enabled','quantity','criticalStock','actions'];
  dataSource = new MatTableDataSource<WmsItem>();
  editForm: {[key: string]: FormGroup} = {};

  constructor(private productService: ProductService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(){
    this.productService.getProducts().subscribe(products=>{
      this.productService.getMaterials().subscribe(materials=>{
        const items:WmsItem[] = [];
        products.forEach(p=>items.push({type:'product',id:p.id,name:p.name,wms:p.wms}));
        materials.filaments.forEach(f=>items.push({type:'filament',id:f.id,name:f.name,wms:f.wms}));
        materials.packages.forEach(p=>items.push({type:'packaging',id:p.id,name:p.name,wms:p.wms}));
        materials.fasteners.forEach(f=>items.push({type:'fasteners',id:f.id,name:f.name,wms:f.wms}));
        this.dataSource.data=items;
        items.forEach(i=>{
          this.editForm[i.id]=this.fb.group({
            enabled:[i.wms.enabled],
            quantity:[i.wms.quantity],
            criticalStock:[i.wms.criticalStock]
          });
        });
      });
    });
  }

  saveWms(item:WmsItem){
    const wms = this.editForm[item.id].value;
    if(item.type==='product') this.productService.updateWmsProduct(item.id,wms).subscribe(()=>this.loadData());
    if(item.type==='filament') this.productService.updateWmsFilamentAccessory(item.id,wms).subscribe(()=>this.loadData());
    if(item.type==='packaging') this.productService.updateWmsPackagingAccessory(item.id,wms).subscribe(()=>this.loadData());
    if(item.type==='fasteners') this.productService.updateWmsFastenersAccessory(item.id,wms).subscribe(()=>this.loadData());
  }

  getControl(id: string, controlName: string): FormControl {
    return this.editForm[id]?.get(controlName) as FormControl;
  }
}
