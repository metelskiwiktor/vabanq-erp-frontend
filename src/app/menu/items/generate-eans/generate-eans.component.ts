import {Component, OnInit} from '@angular/core';

import { ProductService } from '../../../utility/service/product.service';
import { ProductResponse } from '../../../utility/model/response/product-response.model';
import JsBarcode from 'jsbarcode';
import {AddProductComponent} from "../../add-item/add-product/add-product.component";
import {MatDialog} from "@angular/material/dialog";
import jsPDF from "jspdf";

@Component({
  selector: 'app-generate-eans',
  templateUrl: './generate-eans.component.html',
  styleUrls: ['./generate-eans.component.css']
})
export class GenerateEansComponent implements OnInit {
  products: ProductResponse[] = [];
  selectedProductIds: string[] = [];
  selectedProducts: any[] = []; // Tablica przechowująca wybrane produkty z dodatkowymi polami
  selectedProductsMap: Map<string, any> = new Map();

  constructor(private productService: ProductService, public dialog: MatDialog){ }

  ngOnInit(): void {
    this.fetchProducts();
  }

  fetchProducts() {
    this.productService.getProducts().subscribe((data: ProductResponse[]) => {
      this.products = data;
    });
  }

  formatProductLabel(product: any) {
    const ean = product.ean || '';
    const name = product.name || '';
    const eanName = product.eanName ? `(${product.eanName})` : '';
    return `${ean} | ${name} ${eanName}`;
  }


  onProductsChange(selectedProducts: any[]) {
    const selectedProductIds = new Set(selectedProducts.map(p => p.id));

    for (const productId of this.selectedProductsMap.keys()) {
      if (!selectedProductIds.has(productId)) {
        this.selectedProductsMap.delete(productId);
      }
    }

    for (const product of selectedProducts) {
      if (!this.selectedProductsMap.has(product.id)) {
        const productCopy = {
          ...product,
          eanName: product.eanName || '',
          ean: product.ean || '',
          eanImageUrl: '',
          errorMessage: ''
        };
        this.generateEANImage(productCopy);
        this.selectedProductsMap.set(product.id, productCopy);
      }
    }

    this.selectedProducts = Array.from(this.selectedProductsMap.values());
  }

  customSearchFn(term: string, item: any) {
    term = term.toLowerCase();
    return item.name.toLowerCase().includes(term)
      || (item.ean && item.ean.toLowerCase().includes(term))
      || (item.eanName && item.eanName.toLowerCase().includes(term));
  }


  generateEANImage(product: any) {
    if (!product.ean || product.ean.length !== 13) {
      product.eanImageUrl = '';
      product.errorMessage = 'EAN musi składać się z 13 cyfr.';
      return;
    }

    // Tworzenie canvas dla kodu kreskowego
    const canvasBarcode = document.createElement('canvas');
    try {
      JsBarcode(canvasBarcode, product.ean, {
        format: 'ean13',
        displayValue: true,
        fontSize: 18,
        textMargin: 5,
        width: 2,
        height: 100,
        margin: 10,
      });
    } catch (error) {
      console.log(error);
      product.errorMessage = `Błąd generowania obrazu EAN: ${error}`;
      product.eanImageUrl = '';
      return;
    }

    // Tworzenie canvas dla nazwy EAN
    const canvasName = document.createElement('canvas');
    const ctxName = canvasName.getContext('2d');
    if (ctxName) {
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
        var lines = wrapText(ctxName, product.eanName, canvasName.width - 20);
        if (lines.length > 3) {
          fontSize -= 1;
        }
      } while (lines.length > 3 && fontSize > 10);

      const lineHeight = fontSize + 5;
      canvasName.height = lines.length * lineHeight + 10;

      ctxName.fillStyle = '#FFFFFF';
      ctxName.fillRect(0, 0, canvasName.width, canvasName.height);

      ctxName.font = `${fontSize}px Arial`;
      ctxName.fillStyle = '#000000';
      ctxName.textAlign = 'left';
      ctxName.textBaseline = 'top';
      const x = 10;
      let y = 5;

      for (let i = 0; i < lines.length; i++) {
        ctxName.fillText(lines[i], x, y);
        y += lineHeight;
      }
    }

    // Tworzenie głównego canvas i łączenie elementów
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = canvasBarcode.width;
    mainCanvas.height = canvasName.height + canvasBarcode.height;
    const ctxMain = mainCanvas.getContext('2d');

    if (ctxMain) {
      ctxMain.fillStyle = '#FFFFFF';
      ctxMain.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
      ctxMain.drawImage(canvasName, 0, 0);
      ctxMain.drawImage(canvasBarcode, 0, canvasName.height);
    }

    product.eanImageUrl = mainCanvas.toDataURL('image/png');
    product.errorMessage = ''; // Czyszczenie komunikatu o błędzie po pomyślnym wygenerowaniu
  }

  onEanNameChange(product: any) {
    this.generateEANImage(product);
  }

  onEanChange(product: any) {
    this.generateEANImage(product);
  }

  viewProduct(product: any): void {
    const selectedProduct = this.products.find(p => p.id === product.id);
    if (selectedProduct) {
      this.dialog.open(AddProductComponent, {
        data: {
          "product": selectedProduct,
          "viewMode": true
        },
        maxHeight: '100vh',
        width: '80%',
        hasBackdrop: true,
        autoFocus: false
      });
    }
  }

  async downloadPDF() {
    const doc = new jsPDF();

    let x = 10;
    let y = 10;
    const imgWidth = 40;
    const spacing = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const validProducts = this.selectedProducts.filter(product => product.eanImageUrl && !product.errorMessage);

    if (validProducts.length === 0) {
      alert('Brak poprawnych kodów EAN do wygenerowania PDF.');
      return;
    }

    const imagePromises = validProducts.map(product => {
      return new Promise<void>((resolve) => {
        const imgData = product.eanImageUrl;

        const image = new Image();
        image.src = imgData;

        image.onload = () => {
          const aspectRatio = image.width / image.height;
          const imgHeight = imgWidth / aspectRatio;

          if (x + imgWidth > pageWidth - 10) {
            x = 10;
            y += imgHeight + spacing;
          }

          if (y + imgHeight > pageHeight - 10) {
            doc.addPage();
            x = 10;
            y = 10;
          }

          doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

          x += imgWidth + spacing;

          resolve();
        };

        image.onerror = () => {
          console.error('Błąd ładowania obrazu.');
          resolve();
        };
      });
    });

    await Promise.all(imagePromises);

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pl-PL');
    const formattedTime = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const eanCount = validProducts.length;
    const fileName = `${formattedDate} ${formattedTime} ${eanCount} kody ean`;

    doc.save(`${fileName}.pdf`);
  }
}
