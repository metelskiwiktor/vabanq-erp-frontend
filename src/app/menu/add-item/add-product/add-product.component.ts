import {Component, inject, OnInit, TemplateRef} from '@angular/core';
import {ProductService} from '../../../utility/service/product.service';
import {
  AddMaterialRequest,
  AddProductRequest,
  GroupedAccessoriesResponse,
  PrintTime
} from "../../../utility/model/request/add-product-request";
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {Router} from "@angular/router";
import {ToastService} from "../../../utility/service/toast-service";

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
    this.productService.getMaterials().subscribe(
      (response: GroupedAccessoriesResponse) => {
        // Przetwarzamy fasteners, filaments i packages na jednolitą strukturę
        const fasteners = response.fasteners.map(item => ({
          id: item.id,
          name: item.name,
          type: 'Elementy złączne',
          price: item.netPricePerQuantity,
          q: item.quantity
        }));

        const filaments = response.filaments.map(item => ({
          id: item.id,
          name: item.name,
          type: 'Filament',
          price: item.pricePerKg,
          q: item.quantity
        }));

        const packages = response.packages.map(item => ({
          id: item.id,
          name: item.name,
          type: 'Kartony',
          price: item.netPricePerQuantity,
          q: item.quantity
        }));

        // Łączymy wszystkie typy akcesoriów w jedną tablicę
        this.dataSource = [...fasteners, ...filaments, ...packages];
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
  selectedListedMaterials: PeriodicElement[] = [];

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

  onProductSubmit(successTpl: TemplateRef<any>, errorTpl: TemplateRef<any>) {
    const [hoursStr, minutesStr] = this.duration.split(':');
    const printHours = parseInt(hoursStr, 10);
    const printMinutes = parseInt(minutesStr, 10);

    const accessoriesQ = this.selectedListedMaterials.map(material => ({
      first: Number(material.q),
      second: material.id
    }));

    const productRequest = {
      name: this.addProductRequest.name,
      ean: this.addProductRequest.ean,
      accessoriesQ: accessoriesQ,
      printHours: printHours,
      printMinutes: printMinutes,
      price: this.total(),
      allegroTax: this.addProductRequest.allegroTax,
      description: this.addProductRequest.description
    };

    // Przesłanie produktu
    this.productService.addProduct(productRequest).subscribe(
      response => {
        const productId = response.id;
        this.showSuccess(successTpl, `Produkt ${productRequest.name} został utworzony`);

        // Przesyłanie głównego widoku, jeśli został wybrany
        if (this.preview.length > 0) {
          this.productService.addPreview(productId, this.preview[0]).subscribe(
            () => {
              this.showSuccess(successTpl, `Przesłano plik ${this.preview[0].name}`);
              console.log('Preview uploaded successfully');
            },
            error => {
              this.showError(errorTpl, error.error.message || 'Nieznany błąd');
              console.error('Error uploading preview:', error);
            }
          );
        }

        // Przesyłanie dodatkowych plików
        if (this.files.length > 0) {
          this.files.forEach(file => {
            this.productService.addFile(productId, file).subscribe(
              () => {
                this.showSuccess(successTpl, `Przesłano plik ${file.name}`);
                console.log('File uploaded successfully');
              },
              error => {
                this.showError(errorTpl, error.error.message || 'Nieznany błąd');
                console.error('Error uploading file:', error);
              }
            );
          });
        }

        // Resetowanie formularza po przesłaniu
        this.resetForm();
      },
      error => {
        console.error('Error occurred:', error);
        this.showError(errorTpl, error.error.message || 'Nieznany błąd');
      }
    );
  }

  showSuccess(template: TemplateRef<any>, message: string) {
    this.toastService.show({ template, classname: 'bg-success text-light', delay: 2000, text:message });
  }

  showError(template: TemplateRef<any>, errorMessage: string) {
    this.toastService.show({ template, classname: 'bg-danger text-light', delay: 4000, text: errorMessage });
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

  resetForm() {
    this.addProductRequest = new AddProductRequest();
    this.duration = undefined;
    this.selectedListedMaterials = [];
    this.files = [];
  }
}
