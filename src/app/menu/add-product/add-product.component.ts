import {Component, OnInit} from '@angular/core';
import {ProductService} from '../../utility/service/product.service';
import {AddMaterialRequest, AddProductRequest, PrintTime} from "../../utility/model/request/add-product-request";
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {ColorEvent} from "ngx-color";

export interface PeriodicElement {
  id: string,
  name: string;
  type: string;
  price: string;
  q?: string;
}


@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent implements OnInit {
  public form: FormGroup;

  constructor(private productService: ProductService, fb: FormBuilder) {
    this.form = fb.group({
      phone: [''],
      tuut: ['']
    });
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.productService.getMaterials()
      .subscribe(
        (response: any[]) => {
          this.dataSource = response.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            type: item.type,
          }));
        },
        (error: any) => {
          console.error('Błąd podczas pobierania danych:', error);
        }
      );
  }

  materialsPrice: number = 0;

  displayedColumns: string[] = ['name', 'type', 'price', 'q'];
  dataSource: PeriodicElement[] = [
    {id: '123', name: 'Hydrogen', type: 'Fil', price: 'H'},
    {id: '124', name: 'Helium', type: 'Pack', price: 'He'},
    {id: '125', name: 'Lithium', type: 'El.zł', price: 'Li'},
  ];
  addProductRequest = new AddProductRequest();
  addMaterialRequest = new AddMaterialRequest();
  selectedListedMaterials: PeriodicElement[] = [];

  accessoryTypes = [
    {translation: 'Filament', name: 'FILAMENT'},
    {translation: 'Kartony', name: 'PACKAGING'},
    {translation: 'Elementy złączne', name: 'FASTENERS'},
  ];
  filamentTypes = [
    "PLA", "PETG", "ASA", "ABS", "PLA+", "Nylon", "TPU"
  ]
  packageSize = [
    "A", "B", "C"
  ]
  showFilamentOptions: boolean = false;
  showPackageOptions: boolean = false;

  onMaterialsChange($event: any) {
    this.showFilamentOptions = $event.name === 'FILAMENT';
    this.showPackageOptions = $event.name === 'PACKAGING';
    this.addMaterialRequest.accessoryType = $event.name;
  }

  groupMaterialsByFn = (item: { type: any }) => item.type;

  groupMaterialsValueFn = (_: string, children: any[]) => ({name: children[0].type});

  files: File[] = [];
  preview: File[] = [];
  duration: any;

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
    const formData: FormData = new FormData();
    // @ts-ignore
    formData.append("name", this.addProductRequest.name);
    this.addProductRequest.accessoryIds = this.selectedListedMaterials.map(value => value.id);
    // @ts-ignore
    formData.append("accessories", this.addProductRequest.accessoryIds.join(','));
    const [hoursStr, minutesStr] = this.duration.split(':');
    this.addProductRequest.printTime = new PrintTime(parseInt(hoursStr), parseInt(minutesStr));
    // @ts-ignore
    formData.append("printTime.hours", this.addProductRequest.printTime.hours?.toString() ?? '');
    formData.append("printTime.minutes", this.addProductRequest.printTime.minutes?.toString() ?? '');

    formData.append('preview', this.preview[0], this.preview[0].name);
    this.files.forEach((file) => {
      formData.append('files', file);
    });
    formData.forEach((value, key) => {
      console.log(key, formData.get(key)); // uzyskanie klucza za pomocą get()
    });
    this.productService.addProduct(formData).subscribe(
      response => console.log('Product added!', response),
      error => console.error('Error occurred:', error)
    );
  }

  handleChange($event: ColorEvent) {
    this.addMaterialRequest.color = $event.color.hex;
  }

  onMaterialSubmit() {
    this.productService.addMaterial(this.addMaterialRequest).subscribe(
      response => {
        console.log('Product added!', response);
        this.addMaterialRequest = new AddMaterialRequest();
        this.fetchData();
      },
      error => console.error('Error occurred:', error)
    );
  }

  onMaterialsChangeTable($event: any) {
    this.selectedListedMaterials = $event;
    this.calculateMaterialsPrice();
  }

  compareFn(item1: any, item2: any): boolean {
    return item1 && item2 && item1.id === item2.id;
  }

  calculateMaterialsPrice() {
    console.log(this.duration);

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
  }

  total() {
    return Number(this.materialsPrice) + Number(this.addProductRequest.allegroTax);
  }
}
