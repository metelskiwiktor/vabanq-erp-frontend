import {Component, Inject, inject, OnDestroy, OnInit, Optional, TemplateRef} from '@angular/core';
import {ProductService} from '../../../utility/service/product.service';
import {AddProductRequest, GroupedAccessoriesResponse} from "../../../utility/model/request/add-product-request";
import {FormBuilder, FormGroup} from "@angular/forms";
import {ToastService} from "../../../utility/service/toast-service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ProductResponse} from "../../../utility/model/response/product-response.model";
import JsBarcode from "jsbarcode";
import {Subscription} from "rxjs";

interface FileWithId {
  id: string | null;
  file: File;
  url: string;
}

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  public form: FormGroup;
  toastService = inject(ToastService);
  isEditMode: boolean = false;
  isViewMode: boolean = false;
  dialogTitle: string = "Stwórz nowy produkt";
  buttonText: string = "Utwórz";
  toastMessage: string = "Pomyślnie utworzono";

  materialsPrice: number = 0;
  displayedColumns: string[] = ['name', 'price', 'q'];
  dataSource: any[] = [];
  addProductRequest = new AddProductRequest();
  selectedListedMaterials: any[] = [];
  filamentMaterials: any[] = [];
  fastenerMaterials: any[] = [];
  tags: string[] = [];

  originalPreview: File[] = [];

  groupMaterialsByFn = (item: { type: any }) => item.type;
  groupMaterialsValueFn = (_: string, children: any[]) => ({name: children[0].type});

  files: FileWithId[] = [];
  originalFiles: FileWithId[] = [];
  preview: File[] = [];
  duration: string = '';

  previewUrl: string = '';

  constructor(
    private productService: ProductService,
    fb: FormBuilder,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any,
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
      this.isEditMode = !this.data.viewMode;  // Disable edit mode if viewMode is true
      this.isViewMode = this.data.viewMode;   // Set view mode based on passed data

      if (this.isViewMode) {
        this.dialogTitle = `Podgląd produktu (ID: ${this.data.product.id})`;
      } else {
        this.dialogTitle = `Edytuj produkt (ID: ${this.data.product.id})`;
        this.buttonText = "Zaktualizuj";
        this.toastMessage = "Pomyślnie zaktualizowano";
      }
    } else {
      this.dialogTitle = "Stwórz nowy produkt";
      this.buttonText = "Utwórz";
      this.toastMessage = "Pomyślnie utworzono";
    }
    this.subscription.add(
      this.productService.materialsUpdated$.subscribe(() => {
        this.fetchData(); // Re-fetch materials when updated
      })
    );
    this.fetchData();
  }


  ngOnDestroy(): void {
    // Revoke all object URLs to prevent memory leaks
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  fetchData(): void {
    this.productService.getMaterials().subscribe(
      (response: GroupedAccessoriesResponse) => {
        const fasteners = response.fasteners.map(item => ({
          id: item.id,
          name: item.name,
          type: 'Elementy złączne',
          price: item.netPricePerQuantity,
          q: 0
        }));
        const filaments = response.filaments.map(item => ({
          id: item.id,
          name: item.name,
          type: 'Filament',
          price: item.pricePerKg,
          q: 0
        }));

        this.dataSource = [...fasteners, ...filaments];
        this.dataSource.sort((a, b) => a.name.localeCompare(b.name));
        if (this.isEditMode || this.isViewMode) {
          this.populateFormWithData(this.data.product!);
          this.generateEANImage();
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
        console.log('Błąd podczas pobierania tagów:', error);
      }
    );
  }

  base64ToBlob(base64Data: string, contentType: string): Blob {
    const sliceSize = 512;
    const byteCharacters = atob(base64Data);
    const byteArrays: Uint8Array[] = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, {type: contentType});
  }

  populateFormWithData(product: ProductResponse) {
    this.addProductRequest.name = product.name;
    this.addProductRequest.ean = product.ean;
    this.addProductRequest.eanName = product.eanName || '';
    this.addProductRequest.description = product.description || '';
    this.duration = `${product.printTime.hours}:${product.printTime.minutes}`;
    this.addProductRequest.tags = product.tags;
    this.preview = [];
    this.files = [];

    if (product.preview) {
      if (product.preview.data instanceof Uint8Array) {
        const blob = new Blob([product.preview.data], {type: 'image/png'});
        const previewFile = new File([blob], product.preview.filename, {type: 'image/png'});
        this.previewUrl = URL.createObjectURL(previewFile);
        this.preview.push(previewFile);
      } else if (typeof product.preview.data === 'string') {
        const byteCharacters = atob(product.preview.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: 'image/png'});
        const previewFile = new File([blob], product.preview.filename, {type: 'image/png'});
        this.previewUrl = URL.createObjectURL(previewFile);
        this.preview.push(previewFile);
      } else {
        console.error("Invalid data format for product preview.");
      }
      this.originalPreview = [...this.preview];
    }

    this.originalFiles = [];
    // Handle files
    if (product.files && product.files.length > 0) {
      product.files.forEach(file => {
        const fileExtension = file.filename.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        if (fileExtension === 'txt') mimeType = 'text/plain';
        else if (fileExtension === 'jpg' || fileExtension === 'jpeg') mimeType = 'image/jpeg';
        else if (fileExtension === 'png') mimeType = 'image/png';
        else if (fileExtension === 'pdf') mimeType = 'application/pdf';

        let productFile: File;

        if (typeof file.data === 'string') {
          const blob = this.base64ToBlob(file.data, mimeType);
          productFile = new File([blob], file.filename, {type: mimeType});
        } else if (Array.isArray(file.data)) {
          const byteArray = new Uint8Array(file.data);
          const blob = new Blob([byteArray], {type: mimeType});
          productFile = new File([blob], file.filename, {type: mimeType});
        } else {
          console.error("Invalid data format for file:", file.filename);
          return;
        }

        const url = URL.createObjectURL(productFile);
        this.objectUrls.push(url);

        const fileWithId: FileWithId = {
          id: file.id,
          file: productFile,
          url: url
        };

        this.files.push(fileWithId);
        this.originalFiles.push(fileWithId);
      });
    }

    const selectedMaterials = [
      ...product.productAccessories.fasteners.map(item => {
        const material = this.dataSource.find(m => m.id === item.second.id);
        if (material) {
          material.q = item.first.toString();
          return material;
        }
      }).filter(Boolean),
      ...product.productAccessories.filaments.map(item => {
        const material = this.dataSource.find(m => m.id === item.second.id);
        if (material) {
          material.q = item.first.toString();
          return material;
        }
      }).filter(Boolean)
    ];
    this.selectedListedMaterials = selectedMaterials;
    this.selectedListedMaterials.sort((a, b) => a.name.localeCompare(b.name));
    this.filamentMaterials = selectedMaterials.filter(material => material.type === 'Filament');
    this.fastenerMaterials = selectedMaterials.filter(material => material.type === 'Elementy złączne');
    this.calculateMaterialsPrice();
  }

  addNewTag(tagName: string) {
    if (!this.tags.includes(tagName)) {
      this.tags.push(tagName);
    }
  }

  private previewChanged(): boolean {
    if (this.preview.length !== this.originalPreview.length) {
      return true;
    }
    if (this.preview.length === 0 && this.originalPreview.length === 0) {
      return false;
    }
    // Porównaj nazwy plików
    return this.preview[0].name !== this.originalPreview[0].name;
  }


  onSelectFiles(event: any) {
    const filesWithId = event.addedFiles.map((file: File) => ({
      id: null,
      file: file
    }));
    this.files.push(...filesWithId);
  }

  onSelectPreview(event: any) {
    this.preview = [];
    const file = event.addedFiles[0];
    this.preview = [file];
    this.previewUrl = URL.createObjectURL(file);
  }

  private objectUrls: string[] = [];
  eanImageUrl: string = '';
  errorMessage: string = '';

  onRemoveFiles(fileWithId: FileWithId) {
    const index = this.files.indexOf(fileWithId);
    if (index >= 0) {
      this.files.splice(index, 1);
      // Revoke the object URL when the file is removed
      URL.revokeObjectURL(fileWithId.url);
      const urlIndex = this.objectUrls.indexOf(fileWithId.url);
      if (urlIndex >= 0) {
        this.objectUrls.splice(urlIndex, 1);
      }
    }
  }

  onRemovePreview(event: any) {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = '';
    }
    this.preview = [];
  }

  onProductSubmit(successTpl: TemplateRef<any>, errorTpl: TemplateRef<any>) {
    const [printHours, printMinutes] = this.parsePrintTime(this.duration);
    const accessoriesQ = this.prepareAccessories();

    const productRequest = {
      name: this.addProductRequest.name,
      ean: this.addProductRequest.ean,
      eanName: this.addProductRequest.eanName,
      accessoriesQ: accessoriesQ,
      printHours: printHours,
      printMinutes: printMinutes,
      price: this.total(),
      description: this.addProductRequest.description,
      tags: this.addProductRequest.tags
    };

    if (this.isEditMode && this.data) {
      this.onEditProductSubmit(productRequest, successTpl, errorTpl);
    } else {
      this.onCreateProductSubmit(productRequest, successTpl, errorTpl);
    }
  }

  private parsePrintTime(duration: string): [number, number] {
    const hoursStr = duration.slice(0, 2);
    const minutesStr = duration.slice(2);
    return [parseInt(hoursStr, 10), parseInt(minutesStr, 10)];
  }

  private prepareAccessories() {
    return this.selectedListedMaterials.map(material => ({
      first: Number(material.q),
      second: material.id
    }));
  }

  private onCreateProductSubmit(productRequest: any, successTpl: TemplateRef<any>, errorTpl: TemplateRef<any>) {
    this.productService.addProduct(productRequest).subscribe(
      response => {
        const productId = response.id;
        this.showSuccess(successTpl, `Produkt ${productRequest.name} został utworzony`);
        this.uploadFiles(productId, successTpl, errorTpl);
        this.resetForm();
      },
      error => {
        this.showError(errorTpl, error.error.message || 'Nieznany błąd');
      }
    );
  }

  private uploadPreviewImage(productId: string, successTpl: TemplateRef<any>, errorTpl: TemplateRef<any>) {
    if (this.preview.length > 0) {
      this.productService.addPreview(productId, this.preview[0]).subscribe(
        () => {
          this.showSuccess(successTpl, `Przesłano nowy obraz podglądu ${this.preview[0].name}`);
        },
        error => {
          this.showError(errorTpl, error.error.message || 'Nieznany błąd podczas przesyłania nowego obrazu podglądu');
        }
      );
    } else {
      // Jeśli usunięto obraz podglądu i nie dodano nowego
      this.showSuccess(successTpl, `Usunięto obraz podglądu`);
    }
  }


  private onEditProductSubmit(productRequest: any, successTpl: TemplateRef<any>, errorTpl: TemplateRef<any>) {
    if (!this.data) return;

    const productId = this.data.product.id;

    this.productService.updateProduct(productId, productRequest).subscribe(
      response => {
        this.showSuccess(successTpl, `Produkt ${productRequest.name} został zaktualizowany`);

        // Sprawdź, czy obraz podglądu został zmieniony
        if (this.previewChanged()) {
          // Usuń stary obraz podglądu, jeśli istnieje
          if (this.originalPreview.length > 0) {
            this.productService.deletePreview(productId).subscribe(
              () => {
                this.uploadPreviewImage(productId, successTpl, errorTpl);
              },
              error => {
                this.showError(errorTpl, error.error.message || 'Nieznany błąd podczas usuwania starego obrazu podglądu');
              }
            );
          } else {
            // Jeśli nie było poprzedniego obrazu, po prostu prześlij nowy
            this.uploadPreviewImage(productId, successTpl, errorTpl);
          }
        }

        // Obsługa plików
        this.manageFilesOnEdit(productId, successTpl, errorTpl);
      },
      error => {
        this.showError(errorTpl, error.error.message || 'Nieznany błąd podczas aktualizacji produktu');
      }
    );
  }

  private uploadFiles(productId: string, successTpl: TemplateRef<any>, errorTpl: TemplateRef<any>) {
    if (this.preview.length > 0) {
      this.productService.addPreview(productId, this.preview[0]).subscribe(
        () => {
          this.showSuccess(successTpl, `Przesłano plik ${this.preview[0].name}`);
        },
        error => {
          this.showError(errorTpl, error.error.message || 'Nieznany błąd');
        }
      );
    }

    if (this.files.length > 0) {
      this.files.forEach(file => {
        this.productService.addFile(productId, file.file).subscribe(
          () => {
            this.showSuccess(successTpl, `Przesłano plik ${file.file.name}`);
          },
          error => {
            this.showError(errorTpl, error.error.message || 'Nieznany błąd');
          }
        );
      });
    }
  }

  private manageFilesOnEdit(productId: string, successTpl: TemplateRef<any>, errorTpl: TemplateRef<any>) {
    const filesToDelete = this.originalFiles.filter(originalFile =>
      !this.files.some(newFile => newFile.id === originalFile.id)
    );

    const filesToAdd = this.files.filter(newFile =>
      !this.originalFiles.some(originalFile => originalFile.id === newFile.id)
    );

    filesToDelete.forEach(fileWithId => {
      const fileId = fileWithId.id;
      if (fileId) {
        this.productService.deleteFile(productId, fileId).subscribe(
          () => {
            this.showSuccess(successTpl, `Plik ${fileWithId.file.name} został usunięty`);
          },
          error => {
            this.showError(errorTpl, error.error.message || 'Nieznany błąd');
          }
        );
      }
    });

    filesToAdd.forEach(fileWithId => {
      this.productService.addFile(productId, fileWithId.file).subscribe(
        () => {
          this.showSuccess(successTpl, `Plik ${fileWithId.file.name} został przesłany`);
        },
        error => {
          this.showError(errorTpl, error.error.message || 'Nieznany błąd');
        }
      );
    });
  }

  showSuccess(template: TemplateRef<any>, message: string) {
    this.toastService.show({template, classname: 'bg-success text-light', delay: 2000, text: message});
  }

  showError(template: TemplateRef<any>, errorMessage: string) {
    this.toastService.show({template, classname: 'bg-danger text-light', delay: 4000, text: errorMessage});
  }

  onMaterialsChangeTable(event: any): void {
    this.selectedListedMaterials = event;
    this.selectedListedMaterials.sort((a, b) => a.name.localeCompare(b.name));

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

    // Clear additional form fields
    this.duration = "";
    this.materialsPrice = 0;
    this.selectedListedMaterials = [];
    this.filamentMaterials = [];
    this.fastenerMaterials = [];
    this.tags = [];

    // Clear EAN image
    if (this.eanImageUrl) {
      URL.revokeObjectURL(this.eanImageUrl);
      this.eanImageUrl = '';
    }
    this.errorMessage = '';

    // Clear preview image and revoke URL
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = '';
    }
    this.preview = [];

    // Clear files and revoke URLs
    this.files.forEach(fileWithId => {
      URL.revokeObjectURL(fileWithId.url);
    });
    this.files = [];

    // Clear form controls if needed
    this.form.reset();
  }

  generateEANImage() {
    if (!this.addProductRequest.ean || this.addProductRequest.ean.length !== 13) {
      this.errorMessage = 'EAN musi składać się z 13 cyfr.';
      this.eanImageUrl = '';
      return;
    }

    const canvasBarcode = document.createElement('canvas');
    try {
      JsBarcode(canvasBarcode, this.addProductRequest.ean, {
        format: 'ean13',
        displayValue: true,
        fontSize: 18,
        textMargin: 5,
        width: 2,
        height: 100,
        margin: 10,
      });

      // Only create name canvas if eanName is provided
      let canvasNameHeight = 0;
      const canvasName = document.createElement('canvas');
      const ctxName = canvasName.getContext('2d');
      if (ctxName && this.addProductRequest.eanName) {
        let fontSize = 18;
        canvasName.width = canvasBarcode.width;

        const wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
          const words = text.split(' ');
          let lines: string[] = [];
          let currentLine = words[0];

          for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = context.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
              currentLine += ' ' + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          lines.push(currentLine);
          return lines;
        };

        do {
          ctxName.font = `${fontSize}px Arial`;
          var lines = wrapText(ctxName, this.addProductRequest.eanName, canvasName.width - 20);
          if (lines.length > 3) {
            fontSize -= 1;
          }
        } while (lines.length > 3 && fontSize > 10);

        const lineHeight = fontSize + 3;
        canvasName.height = lines.length * lineHeight + 5;
        canvasNameHeight = canvasName.height - 3; // Adjusted spacing between text and barcode

        ctxName.fillStyle = '#FFFFFF';
        ctxName.fillRect(0, 0, canvasName.width, canvasName.height);
        ctxName.font = `${fontSize}px Arial`;
        ctxName.fillStyle = '#000000';
        ctxName.textAlign = 'center';
        ctxName.textBaseline = 'top';

        const centerX = canvasName.width / 2;
        let y = 5;

        for (let i = 0; i < lines.length; i++) {
          ctxName.fillText(lines[i], centerX, y);
          y += lineHeight;
        }
      }

      const mainCanvas = document.createElement('canvas');
      mainCanvas.width = canvasBarcode.width;
      mainCanvas.height = canvasBarcode.height + canvasNameHeight;
      const ctxMain = mainCanvas.getContext('2d');

      if (ctxMain) {
        ctxMain.fillStyle = '#FFFFFF';
        ctxMain.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
        if (this.addProductRequest.eanName) {
          ctxMain.drawImage(canvasName, 0, 0); // Draw text above the barcode if eanName exists
        }
        ctxMain.drawImage(canvasBarcode, 0, canvasNameHeight); // Position barcode below text
      }

      this.eanImageUrl = mainCanvas.toDataURL('image/png');
      this.errorMessage = '';
    } catch (error) {
      console.log(error);
      this.errorMessage = `Błąd generowania obrazu EAN: ${error}`;
      this.eanImageUrl = '';
    }
  }

  // generateEANImage() {
  //   if (!this.addProductRequest.ean || this.addProductRequest.ean.length !== 13) {
  //     // alert('Proszę wprowadzić poprawny kod EAN-13.');
  //     this.eanImageUrl = '';
  //     return;
  //   }
  //
  //   // Tworzymy canvas dla kodu kreskowego
  //   const canvasBarcode = document.createElement('canvas');
  //   try {
  //     JsBarcode(canvasBarcode, this.addProductRequest.ean, {
  //       format: 'ean13',
  //       displayValue: true,
  //       fontSize: 18,
  //       textMargin: 5,
  //       width: 2,
  //       height: 100,
  //       margin: 10,
  //     });
  //   } catch (error) {
  //     console.log(error);
  //     this.errorMessage = `Wystąpił błąd przy generowaniu kodu kreskowego: ${error}`;
  //     return;
  //   }
  //
  //   // Tworzymy canvas dla nazwy EAN, dopasowując szerokość do kodu kreskowego
  //   const canvasName = document.createElement('canvas');
  //   const ctxName = canvasName.getContext('2d');
  //   if (ctxName) {
  //     let fontSize = 18; // Domyślny rozmiar czcionki
  //     canvasName.width = canvasBarcode.width; // Szerokość taka sama jak kod kreskowy
  //
  //     const wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  //       const words = text.split(' ');
  //       let lines: string[] = [];
  //       let currentLine = words[0];
  //
  //       for (let i = 1; i < words.length; i++) {
  //         const word = words[i];
  //         const width = context.measureText(currentLine + ' ' + word).width;
  //         if (width < maxWidth) {
  //           currentLine += ' ' + word;
  //         } else {
  //           lines.push(currentLine);
  //           currentLine = word;
  //         }
  //       }
  //       lines.push(currentLine);
  //
  //       // Obsługa słów dłuższych niż maxWidth
  //       for (let i = 0; i < lines.length; i++) {
  //         let line = lines[i];
  //         let lineWidth = context.measureText(line).width;
  //         if (lineWidth > maxWidth) {
  //           const chars = line.split('');
  //           let subLine = '';
  //           let subLines: string[] = [];
  //           for (let j = 0; j < chars.length; j++) {
  //             const char = chars[j];
  //             const subLineWidth = context.measureText(subLine + char).width;
  //             if (subLineWidth < maxWidth) {
  //               subLine += char;
  //             } else {
  //               subLines.push(subLine);
  //               subLine = char;
  //             }
  //           }
  //           subLines.push(subLine);
  //           // Zastępujemy linię podliniami
  //           lines.splice(i, 1, ...subLines);
  //           i += subLines.length - 1; // Dostosowujemy indeks
  //         }
  //       }
  //
  //       return lines;
  //     };
  //
  //     // Dostosowanie rozmiaru czcionki, jeśli liczba linii przekracza trzy
  //     do {
  //       ctxName.font = `${fontSize}px Arial`;
  //       var lines = wrapText(ctxName, this.addProductRequest.eanName, canvasName.width - 20);
  //       if (lines.length > 3) {
  //         fontSize -= 1;
  //       }
  //     } while (lines.length > 3 && fontSize > 10); // Ustawiamy minimalny rozmiar czcionki
  //
  //     // Ustawiamy wysokość canvasa na podstawie liczby linii i rozmiaru czcionki
  //     const lineHeight = fontSize + 5;
  //     canvasName.height = lines.length * lineHeight + 10; // +10 dla górnego i dolnego marginesu
  //
  //     // Wypełniamy tło na biało
  //     ctxName.fillStyle = '#FFFFFF';
  //     ctxName.fillRect(0, 0, canvasName.width, canvasName.height);
  //
  //     // Ustawiamy czcionkę do ostatecznego rysowania
  //     ctxName.font = `${fontSize}px Arial`;
  //     ctxName.fillStyle = '#000000'; // Kolor tekstu czarny
  //     ctxName.textAlign = 'left';
  //     ctxName.textBaseline = 'top';
  //     const x = 10; // Lewy margines
  //     let y = 5; // Górny margines
  //
  //     for (let i = 0; i < lines.length; i++) {
  //       ctxName.fillText(lines[i], x, y);
  //       y += lineHeight;
  //     }
  //   }
  //
  //   // Tworzymy główny canvas i łączymy oba elementy
  //   const mainCanvas = document.createElement('canvas');
  //   mainCanvas.width = canvasBarcode.width;
  //   mainCanvas.height = canvasName.height + canvasBarcode.height;
  //   const ctxMain = mainCanvas.getContext('2d');
  //
  //   if (ctxMain) {
  //     // Wypełniamy tło na biało
  //     ctxMain.fillStyle = '#FFFFFF';
  //     ctxMain.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
  //
  //     // Rysujemy nazwę EAN na górze
  //     ctxMain.drawImage(canvasName, 0, 0);
  //     // Rysujemy kod kreskowy poniżej nazwy
  //     ctxMain.drawImage(canvasBarcode, 0, canvasName.height);
  //   }
  //
  //   this.eanImageUrl = mainCanvas.toDataURL('image/png');
  // }

}
