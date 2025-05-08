import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorageService } from '../../local-storage.service';

export interface RouteNote {
  route: string;
  notes: string;
  lastUpdated: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private STORAGE_KEY = 'route_notes';
  private notesSubject = new BehaviorSubject<RouteNote[]>([]);
  public notes$: Observable<RouteNote[]> = this.notesSubject.asObservable();

  constructor(private localStorageService: LocalStorageService) {
    this.loadNotes();
  }

  private loadNotes(): void {
    const storedNotes = this.localStorageService.getItem(this.STORAGE_KEY);
    if (storedNotes) {
      try {
        const parsedNotes = JSON.parse(storedNotes);
        this.notesSubject.next(parsedNotes);
      } catch (e) {
        console.error('Failed to parse stored notes', e);
        this.notesSubject.next([]);
      }
    } else {
      this.notesSubject.next([]);
    }
  }

  private saveNotes(notes: RouteNote[]): void {
    this.localStorageService.setItem(this.STORAGE_KEY, JSON.stringify(notes));
    this.notesSubject.next(notes);
  }

  public getNoteForRoute(route: string): RouteNote | undefined {
    const notes = this.notesSubject.value;
    return notes.find(note => note.route === route);
  }

  public getAllNotes(): RouteNote[] {
    return this.notesSubject.value;
  }

  public saveNote(route: string, noteText: string): void {
    const notes = this.notesSubject.value;
    const existingNoteIndex = notes.findIndex(note => note.route === route);

    if (existingNoteIndex >= 0) {
      // Update existing note
      const updatedNotes = [...notes];
      updatedNotes[existingNoteIndex] = {
        ...updatedNotes[existingNoteIndex],
        notes: noteText,
        lastUpdated: new Date().toISOString()
      };
      this.saveNotes(updatedNotes);
    } else {
      // Add new note
      const newNote: RouteNote = {
        route,
        notes: noteText,
        lastUpdated: new Date().toISOString()
      };
      this.saveNotes([...notes, newNote]);
    }
  }

  public deleteNote(route: string): void {
    const notes = this.notesSubject.value;
    const filteredNotes = notes.filter(note => note.route !== route);
    this.saveNotes(filteredNotes);
  }

  public clearAllNotes(): void {
    this.saveNotes([]);
  }
}
