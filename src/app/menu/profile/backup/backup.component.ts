import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {BackupInfo, BackupModule, BackupService, MultiBackupInfo} from "../../../utility/service/backup.service";

@Component({
  selector: 'app-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.css']
})
export class BackupComponent implements OnInit, OnDestroy {
  selectedModules = new Set<BackupModule>([
    BackupModule.PRODUCTS,
    BackupModule.ACCESSORIES,
    BackupModule.OFFERS,
    BackupModule.ORDERS,
    BackupModule.INVOICES
  ]);

  availableModules = [
    {
      key: BackupModule.PRODUCTS,
      icon: 'bx-box',
      title: 'Produkty',
      description: 'Dane produktów i materiałów'
    },
    {
      key: BackupModule.ACCESSORIES,
      icon: 'bx-cog',
      title: 'Akcesoria',
      description: 'Elementy złączne, kartony, filamenty'
    },
    {
      key: BackupModule.OFFERS,
      icon: 'bx-shopping-bag',
      title: 'Oferty',
      description: 'Oferty w serwisach sprzedażowych'
    },
    {
      key: BackupModule.ORDERS,
      icon: 'bx-cart',
      title: 'Zamówienia',
      description: 'Historia zamówień i statusy'
    },
    {
      key: BackupModule.INVOICES,
      icon: 'bx-receipt',
      title: 'Faktury',
      description: 'Dokumenty księgowe'
    }
  ];

  backupList: MultiBackupInfo[] = [];
  isCreatingBackup = false;
  createProgress = 0;
  isRestoringBackup = false;
  restoreProgress = 0;

  selectedFile: File | null = null;
  backupMetadata: { [key: string]: BackupInfo } | null = null;
  showRestoreOptions = false;
  overwriteExisting = true;

  // Modal state
  showRestoreModal = false;
  currentRestoreBackupId: string | null = null;
  modalOverwriteExisting = true;

  private subscriptions: Subscription[] = [];

  constructor(private backupService: BackupService) {}

  ngOnInit(): void {
    this.refreshBackupList();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Module selection methods
  toggleModule(module: BackupModule): void {
    if (this.selectedModules.has(module)) {
      this.selectedModules.delete(module);
    } else {
      this.selectedModules.add(module);
    }
  }

  toggleAllModules(): void {
    if (this.selectedModules.size === this.availableModules.length) {
      this.selectedModules.clear();
    } else {
      this.selectedModules.clear();
      this.availableModules.forEach(module => this.selectedModules.add(module.key));
    }
  }

  isModuleSelected(module: BackupModule): boolean {
    return this.selectedModules.has(module);
  }

  getAllSelectButtonText(): string {
    return this.selectedModules.size === this.availableModules.length
      ? 'Odznacz wszystko'
      : 'Zaznacz wszystko';
  }

  getAllSelectButtonIcon(): string {
    return this.selectedModules.size === this.availableModules.length
      ? 'bx-check-square'
      : 'bx-square';
  }

  // Backup creation
  async createBackup(): Promise<void> {
    if (this.selectedModules.size === 0) {
      alert('Wybierz przynajmniej jeden moduł do utworzenia kopii zapasowej');
      return;
    }

    this.isCreatingBackup = true;
    this.createProgress = 0;

    // Simulate progress
    const progressInterval = setInterval(() => {
      this.createProgress += Math.random() * 20;
      if (this.createProgress > 90) this.createProgress = 90;
    }, 500);

    try {
      const modules = Array.from(this.selectedModules);
      const backupId = await this.backupService.createMultiBackup(modules).toPromise();

      clearInterval(progressInterval);
      this.createProgress = 100;

      setTimeout(() => {
        alert(`Kopia zapasowa została utworzona pomyślnie!\nID: ${backupId || 'nieznany'}`);
        this.refreshBackupList();
        this.resetCreateForm();
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error creating backup:', error);
      alert('Błąd podczas tworzenia kopii zapasowej: ' + error);
      this.resetCreateForm();
    }
  }

  private resetCreateForm(): void {
    this.isCreatingBackup = false;
    this.createProgress = 0;
  }

  // Backup list management
  refreshBackupList(): void {
    const sub = this.backupService.listBackups().subscribe({
      next: (backups) => {
        this.backupList = backups || [];
      },
      error: (error) => {
        console.error('Error fetching backup list:', error);
        alert('Błąd podczas pobierania listy kopii zapasowych');
        this.backupList = [];
      }
    });
    this.subscriptions.push(sub);
  }

  downloadBackup(backupId: string): void {
    const sub = this.backupService.downloadBackup(backupId).subscribe({
      next: (blob) => {
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${backupId}.zip`;
          link.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (error) => {
        console.error('Error downloading backup:', error);
        alert('Błąd podczas pobierania kopii zapasowej');
      }
    });
    this.subscriptions.push(sub);
  }

  // Restore modal methods
  showRestoreDialog(backupId: string): void {
    this.currentRestoreBackupId = backupId;
    this.showRestoreModal = true;
  }

  hideRestoreDialog(): void {
    this.showRestoreModal = false;
    this.currentRestoreBackupId = null;
  }

  async confirmRestoreBackup(): Promise<void> {
    if (!this.currentRestoreBackupId) return;

    try {
      // Since we have a multi-backup, we need to restore each module
      const backup = this.backupList.find(b => b.id === this.currentRestoreBackupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      for (const module of Object.keys(backup.modules) as BackupModule[]) {
        await this.backupService.restoreBackupById(module, this.currentRestoreBackupId, this.modalOverwriteExisting).toPromise();
      }

      alert('Kopia zapasowa została przywrócona pomyślnie!');
      this.hideRestoreDialog();

    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Błąd podczas przywracania kopii zapasowej: ' + error);
    }
  }

  // File upload methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.readBackupMetadata();
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0 && files[0].name.endsWith('.zip')) {
      this.selectedFile = files[0];
      this.readBackupMetadata();
    } else {
      alert('Proszę wybrać plik w formacie .zip');
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  private async readBackupMetadata(): Promise<void> {
    if (!this.selectedFile) return;

    try {
      const metadata = await this.backupService.readBackupMetadata(this.selectedFile).toPromise();
      this.backupMetadata = metadata || null;
      this.showRestoreOptions = this.backupMetadata !== null;
    } catch (error) {
      console.error('Error reading backup metadata:', error);
      alert('Błąd podczas odczytu metadanych kopii zapasowej');
      this.resetRestoreForm();
    }
  }

  async restoreFromFile(): Promise<void> {
    if (!this.selectedFile || !this.backupMetadata) {
      alert('Najpierw wybierz plik kopii zapasowej');
      return;
    }

    const confirmMessage = `Czy na pewno chcesz przywrócić dane z pliku ${this.selectedFile.name}?\n\n${
      this.overwriteExisting ? 'Istniejące dane zostaną nadpisane!' : 'Istniejące dane będą zachowane.'
    }`;

    if (!confirm(confirmMessage)) {
      return;
    }

    this.isRestoringBackup = true;
    this.restoreProgress = 0;

    // Simulate progress
    const progressInterval = setInterval(() => {
      this.restoreProgress += Math.random() * 15;
      if (this.restoreProgress > 90) this.restoreProgress = 90;
    }, 300);

    try {
      // Restore each module from the file
      for (const module of Object.keys(this.backupMetadata) as BackupModule[]) {
        await this.backupService.restoreBackupFromFile(module, this.selectedFile, this.overwriteExisting).toPromise();
      }

      clearInterval(progressInterval);
      this.restoreProgress = 100;

      setTimeout(() => {
        alert('Kopia zapasowa została przywrócona pomyślnie!');
        this.resetRestoreForm();
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error restoring from file:', error);
      alert('Błąd podczas przywracania z pliku: ' + error);
      this.resetRestoreForm();
    }
  }

  private resetRestoreForm(): void {
    this.isRestoringBackup = false;
    this.restoreProgress = 0;
    this.selectedFile = null;
    this.backupMetadata = null;
    this.showRestoreOptions = false;

    // Reset file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'ready':
        return 'status-success';
      case 'processing':
      case 'creating':
        return 'status-processing';
      case 'error':
      case 'failed':
        return 'status-error';
      default:
        return 'status-processing';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Gotowa';
      case 'processing':
        return 'Tworzenie';
      case 'error':
        return 'Błąd';
      default:
        return status || 'Nieznany';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pl-PL');
  }

  getModuleBadges(modules: { [key: string]: BackupInfo }): string[] {
    return Object.keys(modules);
  }

  getItemCount(modules: { [key: string]: BackupInfo }): number {
    return Object.values(modules).reduce((sum, info) => sum + info.itemCount, 0);
  }

  getTotalSize(modules: { [key: string]: BackupInfo }): number {
    return Object.values(modules).reduce((sum, info) => sum + info.sizeBytes, 0);
  }

  getMetadataEntries(): { key: string; value: BackupInfo }[] {
    if (!this.backupMetadata) return [];
    return Object.entries(this.backupMetadata).map(([key, value]) => ({ key, value }));
  }
}
