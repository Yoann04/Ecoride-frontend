import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export interface CurrentUser {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  async loadMe(): Promise<void> {
    // grâce au proxy + interceptor => /api/me marche
    const me = await firstValueFrom(this.http.get<CurrentUser>('/api/me'));
    this.currentUserSubject.next(me);
    localStorage.setItem('current_user', JSON.stringify(me));
  }

  /** Appelé au boot de l'app : restaure depuis le localStorage si token présent */
  bootstrapFromStorage(): void {
    const raw = localStorage.getItem('current_user');
    if (raw) {
      try {
        this.currentUserSubject.next(JSON.parse(raw));
      } catch {}
    }
  }

  clear(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('current_user');
  }
}
