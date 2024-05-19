import {Component, inject, OnInit, TemplateRef} from '@angular/core';
import {ProductService} from '../../utility/service/product.service';
import {AddMaterialRequest, AddProductRequest, PrintTime} from "../../utility/model/request/add-product-request";
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {ColorEvent} from "ngx-color";
import {Router} from "@angular/router";
import {AccessoriesQ, SaveProductRequest} from "../../utility/model/request/save-product-request";
import {CreateWmsRequest} from "../../utility/model/request/create-wms-request";
import {ToastService} from "../../utility/service/toast-service";

export interface PeriodicElement {
  id: string,
  name: string;
  type: string;
  price: string;
  q?: number;
}


@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent implements OnInit {
  public form: FormGroup;
  toastService = inject(ToastService);

  constructor(private productService: ProductService, fb: FormBuilder, private router: Router) {
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
  dataSource: PeriodicElement[] = [];
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
  wmsMin: any;
  wmsMatMin: any;
  wmsMatCurrent: any;
  wmsCur: any;

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

  onProductSubmit(template: TemplateRef<any>) {
    const [hoursStr, minutesStr] = this.duration.split(':');
    //
    // formData.append('preview', this.preview[0], this.preview[0].name);
    // this.files.forEach((file) => {
    //   formData.append('files', file);
    // });
    // formData.forEach((value, key) => {
    //   console.log(key, formData.get(key)); // uzyskanie klucza za pomocą get()
    // });
    const accessoriesQ: AccessoriesQ[] = this.selectedListedMaterials
      .map(value => ({id: value.id, quantity: Number(value.q)}));

    const saveProduct: SaveProductRequest = {
      name: this.addProductRequest.name!,
      ean: this.addProductRequest.ean!,
      accessoriesQ: accessoriesQ,
      printHours: hoursStr,
      printMinutes: minutesStr,
      price: this.total().toString(),
      allegroTax: this.addProductRequest.allegroTax.toString()
    }
    this.productService.addProduct(saveProduct).subscribe(
      response => {
        const createWmsRequest: CreateWmsRequest = {
          id: {
            id: response.id,
            name: response.name,
          },
          currentStock: this.wmsCur,
          criticalStock: this.wmsMin,
          children: response.accessoriesQ.map((accessoriesQ: any) => {
            return {
              id: accessoriesQ.accessory.id,
              quantity: accessoriesQ.quantity,
            }
          })
        }
        this.addProductRequest = new AddProductRequest();
        this.duration = undefined;
        this.wmsCur = undefined;
        this.wmsMin = undefined;
        this.selectedListedMaterials = [];
        this.showSuccess(template);
        this.materialsPrice = 0;
        this.productService.createWms(createWmsRequest).subscribe(
          response => console.log(response)
        )
      },
      error => console.error('Error occurred:', error)
    );
  }

  handleChange($event: ColorEvent) {
    this.addMaterialRequest.color = $event.color.hex;
  }

  showSuccess(template: TemplateRef<any>) {
    this.toastService.show({ template, classname: 'bg-success text-light', delay: 2000 });
  }

  onMaterialSubmit(template: TemplateRef<any>) {
    this.productService.addMaterial(this.addMaterialRequest).subscribe(
      response => {
        const createWmsRequest: CreateWmsRequest = {
          id: {
            id: response.id,
            name: response.name,
          },
          currentStock: this.wmsMatCurrent,
          criticalStock: this.wmsMatMin,
          children: []
        }
        this.showSuccess(template);
        console.log('Product added!', response);
        this.addMaterialRequest = new AddMaterialRequest();
        this.wmsMatCurrent = undefined;
        this.wmsMatMin = undefined;
        this.productService.createWms(createWmsRequest).subscribe(
          // response => show
        )
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

  reloadPage() {
    this.router.navigateByUrl(this.router.url);
  }
}
