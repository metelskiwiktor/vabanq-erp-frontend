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

  populateFormWithData(product: ProductResponse) {
    // Set product data in form
    this.addProductRequest.name = product.name;
    this.addProductRequest.ean = product.ean;
    this.addProductRequest.description = product.description || '';
    this.addProductRequest.allegroTax = product.allegroTax.toString();
    this.duration = `${product.printTime.hours}:${product.printTime.minutes}`;
    this.addProductRequest.tags = product.tags;

    this.preview = [];
    this.files = [];

// Convert Uint8Array to Blob and create a File object for preview
    if (product.preview) {
      console.log("Preview data format:", typeof product.preview.data);

      if (product.preview.data instanceof Uint8Array) {
        console.log("Preview data is a Uint8Array");

        // Convert Uint8Array to Blob
        const blob = new Blob([product.preview.data], { type: 'image/png' });
        const previewFile = new File([blob], product.preview.filename, { type: 'image/png' });

        // Use FileReader to read data as Base64
        const reader = new FileReader();
        reader.onload = (loadEvent: any) => {
          const base64Data = loadEvent.target.result;
          console.log("Base64 data of recreated previewFile:", base64Data);
        };
        reader.readAsDataURL(previewFile);

        this.preview.push(previewFile);

      } else if (typeof product.preview.data === 'string') {
        console.log("Preview data is a string");

        // Convert Base64 string back to binary data (Blob)
        const byteCharacters = atob(product.preview.data); // Decode base64 to binary
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const previewFile = new File([blob], product.preview.filename, { type: 'image/png' });

        // Use FileReader to read data as Base64 again (optional)
        const reader = new FileReader();
        reader.onload = (loadEvent: any) => {
          const base64Data = loadEvent.target.result;
          console.log("Base64 data of recreated previewFile from Base64 string:", base64Data);
        };
        reader.readAsDataURL(previewFile);

        // Add the File object to preview array
        this.preview.push(previewFile);

      } else {
        console.error("Invalid data format for product preview.");
      }
    }

    this.originalFiles = []; // Kopiowanie oryginalnych plików

    if (product.files && product.files.length > 0) {
      product.files.forEach(file => {
        const fileExtension = file.filename.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        if (fileExtension === 'txt') mimeType = 'text/plain';
        else if (fileExtension === 'jpg' || fileExtension === 'jpeg') mimeType = 'image/jpeg';
        else if (fileExtension === 'png') mimeType = 'image/png';
        else if (fileExtension === 'pdf') mimeType = 'application/pdf';

        const blob = new Blob([file.data], { type: mimeType });
        const productFile = new File([blob], file.filename, { type: mimeType });

        this.files.push(productFile);
        this.originalFiles.push(productFile);  // Przechowujemy oryginalne pliki
      });
    }
    // Map product accessories to selected materials using dataSource
    const selectedMaterials  = [
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
      }).filter(Boolean)
    ];
    this.selectedListedMaterials = selectedMaterials;
    this.filamentMaterials = selectedMaterials.filter(material => material.type === 'Filament');
    this.fastenerMaterials = selectedMaterials.filter(material => material.type === 'Elementy złączne');


    this.calculateMaterialsPrice();
  }


  fetchData(): void {
    this.productService.getMaterials().subscribe(
      (response: GroupedAccessoriesResponse) => {
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

        // Combine all accessory types into a single array
        this.dataSource = [...fasteners, ...filaments];

        // After dataSource is populated, populate the form if in edit mode
        if (this.isEditMode) {
          this.populateFormWithData(this.data!);
        }
      },
      (error: any) => {
        console.error('Błąd podczas pobierania danych:', error);
      }
    );
    this.productService.getTags().subscribe(
      (response: string[]) => {
        this.tags = response;
      },
      (error: any) => {
        console.log('Błąd podczas pobierania tagów:', error)
      }
    )
  }

  materialsPrice: number = 0;

  displayedColumns: string[] = ['name', 'price', 'q'];
  dataSource: any[] = [];
  addProductRequest = new AddProductRequest();
  selectedListedMaterials: any[] = [];
  filamentMaterials: any[] = [];
  fastenerMaterials: any[] = [];
  originalFiles: File[] = [];
  tags: string[] = [];

  groupMaterialsByFn = (item: { type: any }) => item.type;

  groupMaterialsValueFn = (_: string, children: any[]) => ({name: children[0].type});

  files: File[] = [];
  preview: File[] = [];
  duration: string = '';

  addNewTag(tagName: string) {
    if(!this.addProductRequest.tags.includes(tagName)) {
      this.tags.push(tagName); // Add to available tags
      this.addProductRequest.tags = [...this.addProductRequest.tags, tagName]; // Add to selected tag
    }
  }

  onSelectFiles(event: any) {
    this.files.push(...event.addedFiles);
  }

  onSelectPreview(event: any) {
    this.preview = [];
    const file = event.addedFiles[0];
    this.preview = [file];

    // Log the File object
    console.log("File selected for preview:", file);

    // Użyj FileReader do odczytu danych pliku w formacie Base64
    const reader = new FileReader();
    reader.onload = (loadEvent: any) => {
      // Zapisz dane jako Base64
      const base64Data = loadEvent.target.result;
      console.log("Base64 data of selected preview file:", base64Data);
    };

    // Czytaj plik jako Base64
    reader.readAsDataURL(file);
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
      allegroTax: 0,
      description: this.addProductRequest.description,
      tags: this.addProductRequest.tags
    };

    if (this.isEditMode && this.data) {
      // Update existing product
      this.productService.updateProduct(this.data.id, productRequest).subscribe(
        response => {
          this.showSuccess(successTpl, `Produkt ${productRequest.name} został zaktualizowany`);
          // Pliki do usunięcia (obecne w originalFiles, ale nie w files)
          const filesToDelete = this.originalFiles.filter(originalFile =>
            !this.files.some(newFile => newFile.name === originalFile.name)
          );

          // Pliki do dodania (obecne w files, ale nie w originalFiles)
          const filesToAdd = this.files.filter(newFile =>
            !this.originalFiles.some(originalFile => originalFile.name === newFile.name)
          );

          // Usuwanie plików
          filesToDelete.forEach(file => {
            const fileId = file.name;
            this.productService.deleteFile(this.data!.id, fileId).subscribe(
              () => {
                this.showSuccess(successTpl, `Plik ${file.name} został usunięty`);
                console.log(`File ${file.name} deleted successfully`);
              },
              error => {
                this.showError(errorTpl, error.error.message || 'Nieznany błąd');
                console.error(`Error deleting file ${file.name}:`, error);
              }
            );
          });

          // Dodawanie nowych plików
          filesToAdd.forEach(file => {
            this.productService.addFile(this.data!.id, file).subscribe(
              () => {
                this.showSuccess(successTpl, `Plik ${file.name} został przesłany`);
                console.log(`File ${file.name} uploaded successfully`);
              },
              error => {
                this.showError(errorTpl, error.error.message || 'Nieznany błąd');
                console.error(`Error uploading file ${file.name}:`, error);
              }
            );
          });
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

  onMaterialsChangeTable(event: any): void {
    this.selectedListedMaterials = event;
    this.filamentMaterials = this.selectedListedMaterials.filter(item => item.type === 'Filament');
    this.fastenerMaterials = this.selectedListedMaterials.filter(item => item.type === 'Elementy złączne');
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
    this.materialsPrice = 0;
  }
}
