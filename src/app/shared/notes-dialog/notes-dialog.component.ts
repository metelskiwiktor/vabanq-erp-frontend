import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotesService, RouteNote } from '../../utility/service/notes.service';

@Component({
  selector: 'app-notes-dialog',
  templateUrl: './notes-dialog.component.html',
  styleUrls: ['./notes-dialog.component.css']
})
export class NotesDialogComponent implements OnInit {
  currentRoute: string;
  selectedRoute: string;
  noteText: string = '';
  allNotes: RouteNote[] = [];

  constructor(
    public dialogRef: MatDialogRef<NotesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentRoute: string },
    private notesService: NotesService
  ) {
    this.currentRoute = data.currentRoute;
    this.selectedRoute = data.currentRoute;
  }

  ngOnInit(): void {
    this.loadAllNotes();
    this.loadNoteForCurrentRoute();
  }

  loadAllNotes(): void {
    this.allNotes = this.notesService.getAllNotes();
  }

  loadNoteForCurrentRoute(): void {
    const note = this.notesService.getNoteForRoute(this.selectedRoute);
    this.noteText = note ? note.notes : '';
  }

  onRouteChange(route: string): void {
    this.saveCurrentNote();
    this.selectedRoute = route;
    this.loadNoteForCurrentRoute();
  }

  saveCurrentNote(): void {
    if (this.noteText.trim()) {
      this.notesService.saveNote(this.selectedRoute, this.noteText);
    } else if (this.notesService.getNoteForRoute(this.selectedRoute)) {
      // Delete if the note is empty and existed before
      this.notesService.deleteNote(this.selectedRoute);
    }
    this.loadAllNotes();
  }

  isCurrentRouteNotInNotes(): boolean {
    return this.allNotes && !this.allNotes.some(note => note.route === this.currentRoute);
  }

  closeDialog(): void {
    this.saveCurrentNote();
    this.dialogRef.close();
  }

  deleteCurrentNote(): void {
    if (confirm('Are you sure you want to delete this note?')) {
      this.notesService.deleteNote(this.selectedRoute);
      this.noteText = '';
      this.loadAllNotes();
    }
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleString();
  }

  get hasNote(): boolean {
    return this.noteText.trim().length > 0;
  }

  getRouteDisplayName(route: string): string {
    // Remove leading slash and transform to more readable format
    let displayName = route.startsWith('/') ? route.substring(1) : route;

    // If empty, show as "home"
    if (!displayName) return 'home';

    // Replace dashes with spaces and capitalize
    return displayName
      .replace(/-/g, ' ')
      .replace(/\//g, ' > ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
