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
  createdAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly STORAGE_KEY = 'ecoride.me';

  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private avatarRefreshSubject = new BehaviorSubject<number>(Date.now());
  avatarRefresh$ = this.avatarRefreshSubject.asObservable();

  private favoritesRefreshSubject = new BehaviorSubject<number>(Date.now());
  favoritesRefresh$ = this.favoritesRefreshSubject.asObservable();

  constructor(private http: HttpClient) {}

  get value(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: CurrentUser): void {
    this.currentUserSubject.next(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  bootstrapFromStorage(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        this.currentUserSubject.next(JSON.parse(raw));
      } catch {}
    }
  }

  clear(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  setAvatar(url: string | null | undefined): void {
    const cur = this.currentUserSubject.value;
    if (!cur) return;
    const updated = { ...cur, avatar: url ? url : '' };
    this.setCurrentUser(updated);
    this.avatarRefreshSubject.next(Date.now());
  }

  notifyFavoritesChanged(): void {
    this.favoritesRefreshSubject.next(Date.now());
  }

  // -------- API --------
  async loadMe(): Promise<void> {
    const prev = this.value;
    const me = await firstValueFrom(this.http.get<CurrentUser>('/api/me'));
    const merged: CurrentUser = {
      ...me,
      avatar: me.avatar && me.avatar !== '' ? me.avatar : prev?.avatar ?? '',
    };
    this.setCurrentUser(merged);
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

  isLoggedIn(): boolean {
    return !!this.value;
  }
}
