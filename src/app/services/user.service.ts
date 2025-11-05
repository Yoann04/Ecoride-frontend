// src/app/services/user.service.ts
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
  private readonly STORAGE_KEY = 'ecoride.me';
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** lecture rapide */
  get value(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  /** maj + persistance */
  setCurrentUser(user: CurrentUser): void {
    this.currentUserSubject.next(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  /** restauration au démarrage */
  bootstrapFromStorage(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        this.currentUserSubject.next(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }

  /** nettoyage */
  clear(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /** avatar local (pas d’upload backend ici) */
  setAvatar(url: string): void {
    const cur = this.currentUserSubject.value;
    if (!cur) return;
    const updated = { ...cur, avatar: url };
    this.setCurrentUser(updated);
  }

  // -------- API --------

  async loadMe(): Promise<void> {
    const me = await firstValueFrom(this.http.get<CurrentUser>('/api/me'));
    this.setCurrentUser(me);
  }

  async getTripsByDriver(): Promise<any[]> {
    try {
      return await firstValueFrom(this.http.get<any[]>('/api/trips/by-driver'));
    } catch {
      return [];
    }
  }

  async getFavoriteTrips(): Promise<any[]> {
    try {
      return await firstValueFrom(this.http.get<any[]>('/api/trips/favorites'));
    } catch {
      return [];
    }
  }

  /** helper */
  isLoggedIn(): boolean {
    return !!this.value;
  }
}
