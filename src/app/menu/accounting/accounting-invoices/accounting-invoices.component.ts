import {Component, OnInit} from '@angular/core';
import {MatIcon} from "@angular/material/icon";
import {DatePipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";

interface MockInvoice {
  id: string;
  customer: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  source: 'own' | 'own-shop' | 'allegro-pl' | 'allegro-cz' | 'allegro-de';
  details: {
    items: { name: string; quantity: number; price: number; total: number }[];
    paymentMethod: string;
    paymentDue: string;
    notes: string;
  };
}


@Component({
  selector: 'app-accounting-invoices',
  standalone: true,
  imports: [
    MatIcon,
    NgIf,
    DatePipe,
    NgClass,
    FormsModule,
    NgForOf
  ],
  templateUrl: './accounting-invoices.component.html',
  styleUrl: './accounting-invoices.component.css'
})
export class AccountingInvoicesComponent implements OnInit {
  // Mock invoices data
  invoices: MockInvoice[] = [
    {
      id: 'INV-2023-0125',
      customer: 'Acme Corp',
      amount: 4500,
      date: '2023-05-01',
      status: 'Paid',
      source: 'own',
      details: {
        items: [{ name: 'Usługa consultingowa', quantity: 1, price: 4500, total: 4500 }],
        paymentMethod: 'Przelew bankowy',
        paymentDue: '2023-05-15',
        notes: 'Faktura z odroczonym terminem płatności'
      }
    },
    {
      id: 'INV-2023-0126',
      customer: 'TechStart Inc',
      amount: 3200,
      date: '2023-05-03',
      status: 'Paid',
      source: 'own',
      details: {
        items: [
          { name: 'Licencja oprogramowania', quantity: 2, price: 1200, total: 2400 },
          { name: 'Wsparcie techniczne', quantity: 2, price: 400, total: 800 }
        ],
        paymentMethod: 'Karta kredytowa',
        paymentDue: '2023-05-03',
        notes: 'Płatność zrealizowana natychmiast'
      }
    },
    {
      id: 'INV-2023-0127',
      customer: 'Global Services',
      amount: 7800,
      date: '2023-05-05',
      status: 'Pending',
      source: 'own-shop',
      details: {
        items: [{ name: 'Komputer stacjonarny', quantity: 3, price: 2600, total: 7800 }],
        paymentMethod: 'Przelew bankowy',
        paymentDue: '2023-05-20',
        notes: 'Dostawa w ciągu 5 dni roboczych'
      }
    },
    {
      id: 'INV-2023-0128',
      customer: 'Local Shop',
      amount: 950,
      date: '2023-05-08',
      status: 'Paid',
      source: 'allegro-pl',
      details: {
        items: [{ name: 'Drukarka laserowa', quantity: 1, price: 950, total: 950 }],
        paymentMethod: 'PayU',
        paymentDue: '2023-05-08',
        notes: 'Zamówienie z Allegro PL'
      }
    },
    {
      id: 'INV-2023-0129',
      customer: 'WebDesign Pro',
      amount: 3600,
      date: '2023-05-10',
      status: 'Overdue',
      source: 'allegro-cz',
      details: {
        items: [{ name: 'Monitor 32"', quantity: 2, price: 1800, total: 3600 }],
        paymentMethod: 'Przelew bankowy',
        paymentDue: '2023-05-17',
        notes: 'Zamówienie z Allegro CZ, termin płatności minął'
      }
    },
    {
      id: 'INV-2023-0130',
      customer: 'Marketing Solutions',
      amount: 5200,
      date: '2023-05-12',
      status: 'Pending',
      source: 'allegro-pl',
      details: {
        items: [
          { name: 'Laptop biznesowy', quantity: 1, price: 4500, total: 4500 },
          { name: 'Torba na laptopa', quantity: 1, price: 350, total: 350 },
          { name: 'Mysz bezprzewodowa', quantity: 1, price: 350, total: 350 }
        ],
        paymentMethod: 'Przelew bankowy',
        paymentDue: '2023-05-26',
        notes: 'Zamówienie z Allegro PL'
      }
    },
    {
      id: 'INV-2023-0131',
      customer: 'Creative Agency',
      amount: 8400,
      date: '2023-05-15',
      status: 'Paid',
      source: 'own-shop',
      details: {
        items: [
          { name: 'Aparat fotograficzny', quantity: 2, price: 3200, total: 6400 },
          { name: 'Statyw', quantity: 2, price: 600, total: 1200 },
          { name: 'Karta pamięci', quantity: 4, price: 200, total: 800 }
        ],
        paymentMethod: 'Karta kredytowa',
        paymentDue: '2023-05-15',
        notes: 'Zamówienie ze sklepu własnego'
      }
    }
  ];

  // Filters
  searchQuery: string = '';
  selectedStatus: string = 'All';
  selectedSource: string = 'all';
  filteredInvoices: MockInvoice[] = [];
  showAdvancedFilters: boolean = false;
  dateRange = { from: '', to: '' };
  amountRange = { min: '', max: '' };

  // Modal states
  viewingInvoice: MockInvoice | null = null;
  paymentConfirmation: MockInvoice | null = null;

  // Source options
  sourceOptions = [
    { value: 'all', label: 'Wszystkie źródła' },
    { value: 'own', label: 'Infakt' },
    { value: 'own-shop', label: 'Sklep własny' },
    { value: 'allegro-pl', label: 'Allegro PL' },
    { value: 'allegro-cz', label: 'Allegro CZ' },
    { value: 'allegro-de', label: 'Allegro DE' }
  ];

  ngOnInit(): void {
    this.filteredInvoices = [...this.invoices];
  }

  // Filter methods
  filterInvoices(): void {
    let result = [...this.invoices];

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(invoice =>
        invoice.id.toLowerCase().includes(query) ||
        invoice.customer.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (this.selectedStatus !== 'All') {
      result = result.filter(invoice => invoice.status === this.selectedStatus);
    }

    // Filter by source
    if (this.selectedSource !== 'all') {
      result = result.filter(invoice => invoice.source === this.selectedSource);
    }

    // Filter by date range
    if (this.dateRange.from) {
      result = result.filter(invoice => new Date(invoice.date) >= new Date(this.dateRange.from));
    }
    if (this.dateRange.to) {
      result = result.filter(invoice => new Date(invoice.date) <= new Date(this.dateRange.to));
    }

    // Filter by amount range
    if (this.amountRange.min) {
      result = result.filter(invoice => invoice.amount >= parseFloat(this.amountRange.min));
    }
    if (this.amountRange.max) {
      result = result.filter(invoice => invoice.amount <= parseFloat(this.amountRange.max));
    }

    this.filteredInvoices = result;
  }

  onSearchChange(): void {
    this.filterInvoices();
  }

  onStatusChange(): void {
    this.filterInvoices();
  }

  onSourceChange(): void {
    this.filterInvoices();
  }

  onDateRangeChange(): void {
    this.filterInvoices();
  }

  onAmountRangeChange(): void {
    this.filterInvoices();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = 'All';
    this.selectedSource = 'all';
    this.dateRange = { from: '', to: '' };
    this.amountRange = { min: '', max: '' };
    this.showAdvancedFilters = false;
    this.filterInvoices();
  }

  // Modal methods
  openInvoiceDetails(invoice: MockInvoice): void {
    this.viewingInvoice = invoice;
  }

  closeInvoiceDetails(): void {
    this.viewingInvoice = null;
  }

  openPaymentConfirmation(invoice: MockInvoice): void {
    this.paymentConfirmation = invoice;
  }

  closePaymentConfirmation(): void {
    this.paymentConfirmation = null;
  }

  markAsPaid(): void {
    if (this.paymentConfirmation) {
      const invoice = this.invoices.find(inv => inv.id === this.paymentConfirmation!.id);
      if (invoice) {
        invoice.status = 'Paid';
        this.filterInvoices();
      }
      this.closePaymentConfirmation();
    }
  }

  // Action methods
  downloadInvoice(invoiceId: string): void {
    alert(`Pobieranie faktury ${invoiceId}`);
  }

  createNewInvoice(): void {
    alert('Przekierowanie do zewnętrznego systemu Infakt w celu wystawienia nowej faktury');
  }

  // Helper methods
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(value);
  }

  getSourceDisplayName(source: string): string {
    const sourceMap: { [key: string]: string } = {
      'own': 'Infakt',
      'own-shop': 'Sklep własny',
      'allegro-pl': 'Allegro PL',
      'allegro-cz': 'Allegro CZ',
      'allegro-de': 'Allegro DE'
    };
    return sourceMap[source] || source;
  }

  getSourceBadgeColor(source: string): string {
    const colorMap: { [key: string]: string } = {
      'own': 'source-own',
      'own-shop': 'source-own-shop',
      'allegro-pl': 'source-allegro-pl',
      'allegro-cz': 'source-allegro-cz',
      'allegro-de': 'source-allegro-de'
    };
    return colorMap[source] || 'source-unknown';
  }

  getStatusBadgeColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'Paid': 'status-paid',
      'Pending': 'status-pending',
      'Overdue': 'status-overdue'
    };
    return colorMap[status] || 'status-unknown';
  }

  getStatusTranslation(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Paid': 'Zapłacona',
      'Pending': 'Oczekująca',
      'Overdue': 'Zaległa'
    };
    return statusMap[status] || status;
  }

  hasActiveFilters(): boolean {
    return this.searchQuery !== '' ||
      this.selectedStatus !== 'All' ||
      this.selectedSource !== 'all' ||
      this.dateRange.from !== '' ||
      this.dateRange.to !== '' ||
      this.amountRange.min !== '' ||
      this.amountRange.max !== '';
  }
}
