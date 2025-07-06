// src/app/utility/service/expense-category-mapper.service.ts
import { Injectable } from '@angular/core';
import { CostInvoiceCategory } from './cost-invoice.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseCategoryMapperService {

  /**
   * Mapuje kategorię faktury kosztowej na kategorię wydatku
   */
  mapInvoiceCategoryToExpenseCategory(invoiceCategory: CostInvoiceCategory | string | undefined): string {
    if (!invoiceCategory) return 'OTHER';

    const categoryMapping: { [key: string]: string } = {
      'GOODS_OR_MATERIALS_PURCHASE': 'MATERIALS',
      'ELECTRONIC_SERVICES': 'SOFTWARE',
      'ACCOUNTING_SERVICES': 'SERVICES',
      'HOUSING_FEES': 'UTILITIES',
      'ENTREPRENEUR_EXPENSES': 'OFFICE',
      'SALARY': 'SERVICES',
      'EMPLOYEE_SOCIAL_SECURITY': 'SERVICES',
      'NONE': 'OTHER',
      'OTHER': 'OTHER'
    };

    return categoryMapping[invoiceCategory as string] || 'OTHER';
  }

  /**
   * Pobiera sugerowaną nazwę wydatku na podstawie faktury
   */
  generateExpenseNameFromInvoice(
    invoiceNumber: string,
    sellerName?: string | null,
    description?: string | null
  ): string {
    const currentDate = new Date();
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];

    const month = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    // Hierarchia nazw: opis > sprzedawca > numer faktury
    if (description && description !== 'null' && description.trim()) {
      return `${description.trim()} - ${month} ${year}`;
    } else if (sellerName && sellerName !== 'null' && sellerName.trim()) {
      return `Wydatek ${sellerName.trim()} - ${month} ${year}`;
    } else {
      return `Wydatek dla faktury ${invoiceNumber} - ${month} ${year}`;
    }
  }

  /**
   * Pobiera sugerowane tagi na podstawie faktury
   */
  generateTagsFromInvoice(
    category: CostInvoiceCategory | string | undefined,
    sellerName?: string | null,
    description?: string | null
  ): string[] {
    const tags: string[] = [];

    // Dodaj tag na podstawie kategorii
    if (category && category !== 'NONE' && category !== 'OTHER') {
      const categoryTag = this.getCategoryTag(category);
      if (categoryTag) {
        tags.push(categoryTag);
      }
    }

    // Dodaj tag na podstawie sprzedawcy (pierwsze słowo)
    if (sellerName && sellerName !== 'null' && sellerName.trim()) {
      const firstWord = sellerName.trim().split(' ')[0].toLowerCase();
      if (firstWord.length > 2) {
        tags.push(firstWord);
      }
    }

    // Dodaj tag na podstawie opisu (słowa kluczowe)
    if (description && description !== 'null' && description.trim()) {
      const keywords = this.extractKeywordsFromDescription(description);
      tags.push(...keywords);
    }

    // Usuń duplikaty i ogranicz do 5 tagów
    return [...new Set(tags)].slice(0, 5);
  }

  private getCategoryTag(category: string): string | null {
    const categoryTags: { [key: string]: string } = {
      'GOODS_OR_MATERIALS_PURCHASE': 'materiały',
      'ELECTRONIC_SERVICES': 'elektronika',
      'ACCOUNTING_SERVICES': 'księgowość',
      'HOUSING_FEES': 'mieszkanie',
      'ENTREPRENEUR_EXPENSES': 'przedsiębiorca',
      'SALARY': 'wynagrodzenie',
      'EMPLOYEE_SOCIAL_SECURITY': 'zus'
    };

    return categoryTags[category] || null;
  }

  private extractKeywordsFromDescription(description: string): string[] {
    const keywords: string[] = [];
    const text = description.toLowerCase();

    // Słowa kluczowe do wyszukania
    const keywordPatterns = [
      'drukarka', 'printer', 'filament', 'materiał', 'material',
      'biuro', 'office', 'komputer', 'computer', 'software',
      'energia', 'prąd', 'electric', 'internet', 'telefon',
      'marketing', 'reklama', 'serwis', 'naprawa', 'transport'
    ];

    keywordPatterns.forEach(pattern => {
      if (text.includes(pattern)) {
        keywords.push(pattern);
      }
    });

    return keywords.slice(0, 3); // Maksymalnie 3 słowa kluczowe
  }

  /**
   * Sprawdza czy faktura powinna utworzyć wydatek stały czy zmienny
   */
  suggestExpenseType(
    category: CostInvoiceCategory | string | undefined,
    sellerName?: string | null,
    amount?: number
  ): 'FIXED' | 'VARIABLE' {
    // Kategorie które zwykle są kosztami stałymi
    const fixedCategories = [
      'HOUSING_FEES',
      'ELECTRONIC_SERVICES',
      'ACCOUNTING_SERVICES',
      'EMPLOYEE_SOCIAL_SECURITY'
    ];

    if (category && fixedCategories.includes(category)) {
      return 'FIXED';
    }

    // Sprzedawcy którzy zwykle wystawiają faktury cykliczne
    if (sellerName && sellerName !== 'null') {
      const cyclicVendors = ['energa', 'pge', 'orange', 'play', 'ifakt', 'wfirma'];
      const vendorLower = sellerName.toLowerCase();

      if (cyclicVendors.some(vendor => vendorLower.includes(vendor))) {
        return 'FIXED';
      }
    }

    // Wysokie kwoty (powyżej 1000 PLN) mogą być kosztami stałymi
    if (amount && amount > 1000) {
      return 'FIXED';
    }

    // Domyślnie sugeruj koszt zmienny
    return 'VARIABLE';
  }
}
