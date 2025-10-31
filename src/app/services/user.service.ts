import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export interface CurrentUser {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
  pseudo?: string;
  roles: string[];
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  get value(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: CurrentUser): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  bootstrapFromStorage(): void {
    const raw = localStorage.getItem('current_user');
    if (raw) {
      try {
        this.currentUserSubject.next(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }

  clear(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('current_user');
  }

  setAvatar(url: string): void {
    const cur = this.currentUserSubject.value;
    if (!cur) return;
    const updated = { ...cur, avatar: url };
    this.setCurrentUser(updated);
  }

  // --- API methods (used only when not in demo) ---
  async loadMe(): Promise<void> {
    const me = await firstValueFrom(this.http.get<CurrentUser>('/api/me'));
    this.setCurrentUser(me);
  }

  async getTripsByDriver(): Promise<any[]> {
    return firstValueFrom(this.http.get<any[]>('/api/trips/by-driver'));
  }

  async getFavoriteTrips(): Promise<any[]> {
    return firstValueFrom(this.http.get<any[]>('/api/trips/favorites'));
  }
}
