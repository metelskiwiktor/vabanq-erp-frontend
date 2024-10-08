import {Component, Inject, inject, OnInit, Optional, TemplateRef} from '@angular/core';
import {ProductService} from '../../../utility/service/product.service';
import {
  AddProductRequest,
  GroupedAccessoriesResponse,
} from "../../../utility/model/request/add-product-request";
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {ToastService} from "../../../utility/service/toast-service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ProductFile, ProductResponse} from "../../../utility/model/response/product-response.model";

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
  isEditMode: boolean = false;
  dialogTitle: string = "Stwórz nowy produkt";
  buttonText: string = "Utwórz";
  toastMessage: string = "Pomyślnie utworzono";

  constructor(
    private productService: ProductService,
    fb: FormBuilder,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: ProductResponse,  // Optional ProductResponse for editing
    @Optional() public dialogRef?: MatDialogRef<AddProductComponent>
  ) {
    this.form = fb.group({
      name: [''],
      ean: [''],
      description: [''],
      printTime: [''],
      allegroTax: ['']
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.isEditMode = true;
      this.dialogTitle = `Edytuj produkt (ID: ${this.data.id})`;
      this.buttonText = "Zaktualizuj";
      this.toastMessage = "Pomyślnie zaktualizowano";
    }
    this.fetchData();  // Fetch materials
  }

  convertUint8ArrayToFile(fileData: ProductFile, fileName: string): File {
    const blob = new Blob([fileData.data], {type: 'image/png'}); // Użyj odpowiedniego typu MIME
    return new File([blob], fileName);
  }

  populateFormWithData(product: ProductResponse) {
    // Set product data in form
    this.addProductRequest.name = product.name;
    this.addProductRequest.ean = product.ean;
    this.addProductRequest.description = product.description || '';
    this.addProductRequest.allegroTax = product.allegroTax.toString();
    this.duration = `${product.printTime.hours}:${product.printTime.minutes}`;

    if(product.preview) {
      const previewFile = this.convertUint8ArrayToFile(product.preview, product.preview.filename);
      this.preview.push(previewFile);
    }

    // Map product accessories to selected materials using dataSource
    this.selectedListedMaterials = [
      ...product.productAccessories.fasteners.map(item => {
        const material = this.dataSource.find(m => m.id === item.second.id);
        if (material) {
          material.q = item.first.toString(); // Set quantity
          return material;
        }
      }).filter(Boolean),
      ...product.productAccessories.filaments.map(item => {
        const material = this.dataSource.find(m => m.id === item.second.id);
        if (material) {
          material.q = item.first.toString(); // Set quantity
          return material;
        }
      }).filter(Boolean),
      ...product.productAccessories.packagings.map(item => {
        const material = this.dataSource.find(m => m.id === item.second.id);
        if (material) {
          material.q = item.first.toString(); // Set quantity
          return material;
        }
      }).filter(Boolean)
    ];

    this.calculateMaterialsPrice();
  }


  fetchData(): void {
    this.productService.getMaterials().subscribe(
      (response: GroupedAccessoriesResponse) => {
        // Process fasteners, filaments, and packages into a uniform structure
        const fasteners = response.fasteners.map(item => ({
          id: item.id,
          name: item.name,
          type: 'Elementy złączne',
          price: item.netPricePerQuantity,
          q: item.quantity.toString()
        }));
        const filaments = response.filaments.map(item => ({
          id: item.id,
          name: item.name,
          type: 'Filament',
          price: item.pricePerKg,
          q: item.quantity.toString()
        }));
        const packages = response.packages.map(item => ({
          id: item.id,
          name: item.name,
          type: 'Kartony',
          price: item.netPricePerQuantity,
          q: item.quantity.toString()
        }));

        // Combine all accessory types into a single array
        this.dataSource = [...fasteners, ...filaments, ...packages];

        // After dataSource is populated, populate the form if in edit mode
        if (this.isEditMode) {
          this.populateFormWithData(this.data!);
        }
      },
      (error: any) => {
        console.error('Błąd podczas pobierania danych:', error);
      }
    );
  }

  materialsPrice: number = 0;

  displayedColumns: string[] = ['name', 'type', 'price', 'q'];
  dataSource: any[] = [];
  addProductRequest = new AddProductRequest();
  selectedListedMaterials: any[] = [];

  groupMaterialsByFn = (item: { type: any }) => item.type;

  groupMaterialsValueFn = (_: string, children: any[]) => ({name: children[0].type});

  files: File[] = [];
  preview: File[] = [];
  duration: string = '';

  onSelectFiles(event: any) {
    this.files.push(...event.addedFiles);
  }

  onSelectPreview(event: any) {
    this.preview = [];
    this.preview = [event.addedFiles[0]];
    console.log(this.preview);
  }

  onRemoveFiles(event: any) {
    this.files.splice(this.files.indexOf(event), 1);
  }

  onRemovePreview(event: any) {
    this.preview = [];
  }

  onProductSubmit(successTpl: TemplateRef<any>, errorTpl: TemplateRef<any>) {
    const hoursStr = this.duration.slice(0, 2);  // Pierwsze dwie cyfry to godziny
    const minutesStr = this.duration.slice(2);   // Ostatnie dwie cyfry to minuty

// Parsujemy godziny i minuty
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

    if (this.isEditMode && this.data) {
      // Update existing product
      this.productService.updateProduct(this.data.id, productRequest).subscribe(
        response => {
          this.showSuccess(successTpl, `Produkt ${productRequest.name} został zaktualizowany`);

          this.resetForm();
        },
        error => {
          console.error('Error occurred:', error);
          this.showError(errorTpl, error.error.message || 'Nieznany błąd');
        }
      );
    } else {
      // Create new product
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
          this.resetForm();
        },
        error => {
          console.error('Error occurred:', error);
          this.showError(errorTpl, error.error.message || 'Nieznany błąd');
        }
      );
    }
  }

  showSuccess(template: TemplateRef<any>, message: string) {
    this.toastService.show({template, classname: 'bg-success text-light', delay: 2000, text: message});
  }

  showError(template: TemplateRef<any>, errorMessage: string) {
    this.toastService.show({template, classname: 'bg-danger text-light', delay: 4000, text: errorMessage});
  }

  onMaterialsChangeTable($event: any) {
    this.selectedListedMaterials = $event;
    this.calculateMaterialsPrice();
  }

  compareFn(item1: any, item2: any): boolean {
    return item1 && item2 && item1.id === item2.id;
  }

  calculateMaterialsPrice() {
    this.materialsPrice = this.selectedListedMaterials.map(material => {
      if (material.q && !isNaN(Number(material.q))) {
        let q = Number(material.q);
        if (material.type == 'Filament') {
          q = q / 1000;
        }
        return Number(material.price) * q;
      } else {
        return 0;
      }
    }).reduce((total, current) => total + current, 0);
  }

  total() {
    const totalAmount = Number(this.materialsPrice) + Number(this.addProductRequest.allegroTax);
    return totalAmount.toFixed(2);
  }

  resetForm() {
    this.addProductRequest = new AddProductRequest();
    this.duration = "";
    this.selectedListedMaterials = [];
    this.files = [];
  }
}
