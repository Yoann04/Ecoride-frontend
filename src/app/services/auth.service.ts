import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export const TOKEN_KEY = 'jwt_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Pointe vers le backend via le proxy Angular */
  private readonly apiUrl = '/api';
  /** Clé de stockage du JWT */
  private readonly tokenKey = TOKEN_KEY;

  /** État de connexion (true si un token est présent) */
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  /** 🔐 Connexion: POST /api/login */
  login(email: string, password: string): Observable<{ token: string }> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http
      .post<{ token: string }>(`${this.apiUrl}/login`, { email, password }, { headers })
      .pipe(
        tap((res) => {
          if (res?.token) {
            localStorage.setItem(this.tokenKey, res.token);
            this.isLoggedInSubject.next(true);
          }
        })
      );
  }

  /** 🚪 Déconnexion */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedInSubject.next(false);
  }

  /** 👀 Helper: un token est-il stocké ? */
  hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  /** 📡 Observable de l’état de connexion */
  isLoggedIn(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  /** 📦 Récupérer le token courant */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /** 🗑️ Effacer le token (utilitaire) */
  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedInSubject.next(false);
  }
}
