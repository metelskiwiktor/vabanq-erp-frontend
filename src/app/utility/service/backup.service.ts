import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum BackupModule {
  ACCESSORIES = 'ACCESSORIES',
  PRODUCTS = 'PRODUCTS',
  OFFERS = 'OFFERS',
  ORDERS = 'ORDERS',
  INVOICES = 'INVOICES',
  ALL = 'ALL'
}

export interface BackupInfo {
  id: string;
  timestamp: string;
  schemaVersion: number;
  itemCount: number;
  sizeBytes: number;
}

export interface MultiBackupInfo {
  id: string;
  createdAt: string;
  status: string;
  modules: { [key: string]: BackupInfo };
}

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private readonly apiUrl = `${environment.backendUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Create a multi-module backup
   */
  createMultiBackup(modules: BackupModule[]): Observable<string> {
    const params = new HttpParams().set('modules', modules.join(','));
    return this.http.post<string>(`${this.apiUrl}/backup`, null, {
      params,
      responseType: 'text' as 'json'
    });
  }

  /**
   * List all multi-backups
   */
  listBackups(): Observable<MultiBackupInfo[]> {
    return this.http.get<MultiBackupInfo[]>(`${this.apiUrl}/backup`);
  }

  /**
   * Download a backup by ID
   */
  downloadBackup(backupId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/backup/${backupId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Restore backup by ID for a specific module
   */
  restoreBackupById(
    module: BackupModule,
    backupId: string,
    overwriteExisting: boolean = true
  ): Observable<void> {
    const params = new HttpParams()
      .set('backupId', backupId)
      .set('overwriteExisting', overwriteExisting.toString());

    return this.http.post<void>(`${this.apiUrl}/restore/${module}`, null, { params });
  }

  /**
   * Restore backup from file for a specific module
   */
  restoreBackupFromFile(
    module: BackupModule,
    file: File,
    overwriteExisting: boolean = true
  ): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new HttpParams()
      .set('overwriteExisting', overwriteExisting.toString());

    return this.http.post<void>(`${this.apiUrl}/restore/${module}`, formData, { params });
  }

  /**
   * Read metadata from backup file
   */
  readBackupMetadata(file: File): Observable<{ [key: string]: BackupInfo }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ [key: string]: BackupInfo }>(`${this.apiUrl}/backup/meta`, formData);
  }
}

// Import map operator
