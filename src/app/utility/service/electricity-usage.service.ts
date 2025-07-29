// src/app/utility/service/electricity-usage.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ElectricityUsageResponse {
  month: string; // Format: YYYY-MM (YearMonth)
  kwhPerHour: number;
  grossPricePerKwh: number;
}

export interface ElectricityUsageRequest {
  kwhPerHour: number;
  grossPricePerKwh: number;
}

@Injectable({
  providedIn: 'root'
})
export class ElectricityUsageService {
  private readonly apiUrl = `${environment.backendUrl}/api/electricity-usage`;

  constructor(private http: HttpClient) { }

  /**
   * Pobiera zużycie elektryczności dla określonego miesiąca
   * Jeśli month nie jest podany, zwraca dane dla aktualnego miesiąca
   */
  getUsage(month?: string): Observable<ElectricityUsageResponse> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<ElectricityUsageResponse>(this.apiUrl, { params });
  }

  /**
   * Aktualizuje zużycie elektryczności dla określonego miesiąca
   */
  updateUsage(month: string, request: ElectricityUsageRequest): Observable<void> {
    let params = new HttpParams().set('month', month);
    return this.http.put<void>(this.apiUrl, request, { params });
  }

  /**
   * Formatuje YearMonth do czytelnego formatu
   */
  formatYearMonth(yearMonth: string): string {
    const [year, month] = yearMonth.split('-');
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  /**
   * Tworzy YearMonth string z bieżącej daty
   */
  getCurrentYearMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Oblicza miesięczny koszt elektryczności
   */
  calculateMonthlyCost(kwhPerHour: number, pricePerKwh: number, hoursInMonth: number = 730): number {
    return kwhPerHour * hoursInMonth * pricePerKwh;
  }
}
