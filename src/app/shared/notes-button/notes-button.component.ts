import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotesDialogComponent } from '../notes-dialog/notes-dialog.component';

@Component({
  selector: 'app-notes-button',
  templateUrl: './notes-button.component.html',
  styleUrls: ['./notes-button.component.css']
})
export class NotesButtonComponent implements OnInit {
  currentRoute: string = '';

  constructor(
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Track the current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.urlAfterRedirects || event.url;
    });

    // Set initial route
    this.currentRoute = this.router.url;
  }

  openNotesDialog(): void {
    this.dialog.open(NotesDialogComponent, {
      width: '600px',
      data: { currentRoute: this.currentRoute },
      panelClass: 'notes-dialog-container'
    });
  }
}
