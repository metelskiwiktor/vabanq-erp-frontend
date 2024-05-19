import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {PrintItem} from "../list-products.component";
import {ProductService} from "../../../utility/service/product.service";
import {PeriodicElement} from "../../add-product/add-product.component";

function base64toFile(base64Data: string, filename: string, mimeType: string): File {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], filename, {type: mimeType});
}

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.css'
})
export class EditProductComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<EditProductComponent>,
    private productService: ProductService,
    @Inject(MAT_DIALOG_DATA) public printItem: PrintItem,
  ) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  dataSource: PeriodicElement[] = [];
  selectedListedMaterials: PeriodicElement[] = [];
  materialsPrice: number = this.printItem.accessoriesQ.reduce((sum, value) => sum + Number(value.accessory.price), 0);
  displayedColumns: string[] = ['name', 'type', 'price', 'q'];
  files: File[] = [];
  preview: File[] = [];
  duration = this.toDuration();

  private toDuration() {
    return this.printItem.printTime.hours + ":" + this.printItem.printTime.minutes;
  }

  ngOnInit(): void {
    this.productService.getMaterials()
      .subscribe(
        (response: any[]) => {
          this.dataSource = response.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            type: item.type,
            q: item.q
          }));
        },
        (error: any) => {
          console.error('Błąd podczas pobierania danych:', error);
        }
      );
    if (this.printItem.files != null) {
      this.files = this.printItem.files.map(value => base64toFile(value.data, value.filename, "image/jpeg"));
    }
    if (this.printItem.preview != null) {
      this.preview = [base64toFile(this.printItem.preview.data, this.printItem.preview.filename, "image/jpeg")];
    }
    this.selectedListedMaterials = this.printItem.accessoriesQ.map(item => ({
      id: item.accessory.id,
      name: item.accessory.name,
      price: item.accessory.price,
      type: item.accessory.type,
      q: item.quantity
    }));
    this.calculateMaterialsPrice();
  }

  groupMaterialsByFn = (item: { type: any }) => item.type;

  groupMaterialsValueFn = (_: string, children: any[]) => ({name: children[0].type});

  compareFn(item1: any, item2: any): boolean {
    return item1 && item2 && item1.id === item2.id;
  }

  onMaterialsChangeTable($event: any) {
    this.calculateMaterialsPrice();
  }

  calculateMaterialsPrice() {
    this.materialsPrice = this.selectedListedMaterials.map(material => {
      if (material.q && !isNaN(Number(material.q))) {
        let q = Number(material.q);
        if (material.type == 'FILAMENT') {
          q = q / 1000;
        }
        return Number(material.price) * q;
      } else {
        return 0;
      }
    }).reduce((total, current) => total + current, 0);
    console.log(this.selectedListedMaterials);
  }

  total() {
    return Number(this.materialsPrice) + Number(this.printItem.allegroTax);
  }

  onSelectFiles(event: any) {
    this.files.push(...event.addedFiles);
  }

  onSelectPreview(event: any) {
    this.preview = [];
    this.preview = [event.addedFiles[0]];
  }

  onRemoveFiles(event: any) {
    this.files.splice(this.files.indexOf(event), 1);
  }

  onRemovePreview(event: any) {
    this.preview = [];
  }

  onProductSubmit() {
    this.onNoClick();
    // const formData: FormData = new FormData();
    // // @ts-ignore
    // formData.append("name", this.addProductRequest.name);
    // this.addProductRequest.accessoryIds = this.selectedListedMaterials.map(value => value.id);
    // // @ts-ignore
    // formData.append("accessories", this.addProductRequest.accessoryIds.join(','));
    // formData.append("price", this.total().toString())
    // const [hoursStr, minutesStr] = this.duration.split(':');
    // this.addProductRequest.printTime = new PrintTime(parseInt(hoursStr), parseInt(minutesStr));
    // // @ts-ignore
    // formData.append("printTime.hours", this.addProductRequest.printTime.hours?.toString() ?? '');
    // formData.append("printTime.minutes", this.addProductRequest.printTime.minutes?.toString() ?? '');
    //
    // formData.append('preview', this.preview[0], this.preview[0].name);
    // this.files.forEach((file) => {
    //   formData.append('files', file);
    // });
    // formData.forEach((value, key) => {
    //   console.log(key, formData.get(key)); // uzyskanie klucza za pomocą get()
    // });
    // this.productService.addProduct(formData).subscribe(
    //   response => this.onNoClick(),
    //   error => console.error('Error occurred:', error)
    // );
  }
}
