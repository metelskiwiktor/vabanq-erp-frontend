// src/app/utility/model/expense-models.ts
export interface LinkedInvoice {
  id: string;
  number: string;
  netAmount: number;
  grossAmount: number;
  currency: string;
  category: string;
  issuedAt: string;
  supplierName?: string;
}

// Rozszerzenie dla kosztów stałych
export interface FixedExpenseResponse {
  id: string;
  name: string;
  category: string;
  netAmount: number;
  grossAmount: number;
  month: number;
  year: number;
  isRecurring: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Nowe pole dla przypisanych faktur
  linkedInvoices?: LinkedInvoice[];
}

// Rozszerzenie dla kosztów zmiennych
export interface VariableExpenseResponse {
  id: string;
  name: string;
  category: string;
  netAmount: number;
  grossAmount: number;
  expenseDate: string;
  supplier: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Nowe pole dla przypisanych faktur
  linkedInvoices?: LinkedInvoice[];
}

// Request do przypisania faktury do wydatku
export interface AssignInvoiceToExpenseRequest {
  expenseId: string;
  invoiceId: string;
  expenseType: 'fixed' | 'variable';
}

// Response po przypisaniu faktury
export interface AssignInvoiceToExpenseResponse {
  success: boolean;
  message: string;
  linkedInvoice?: LinkedInvoice;
}

// Request do usunięcia przypisania faktury
export interface UnassignInvoiceFromExpenseRequest {
  expenseId: string;
  invoiceId: string;
  expenseType: 'fixed' | 'variable';
}
