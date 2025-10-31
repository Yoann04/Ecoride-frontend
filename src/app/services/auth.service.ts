import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserService } from './user.service';

export const TOKEN_KEY = 'jwt_token';
const DEMO_TOKEN = 'fake-demo-token'; // ✅ pour la connexion démo locale

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient, private userService: UserService, private router: Router) {}

  /** ✅ Enregistre un token localement */
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this.isLoggedInSubject.next(true);
  }

  /** ✅ Lecture du token JWT stocké */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** ✅ Supprime le token et réinitialise la session */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.userService.clear();
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/home']);
  }

  /** ✅ Retourne vrai si un token existe */
  hasToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  /** ✅ Observable pour suivre le statut de connexion */
  isLoggedIn(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  /** ✅ Mode démo (token factice local) */
  isDemo(): boolean {
    return this.getToken() === DEMO_TOKEN;
  }

  // ============================================================
  // === Authentification : vraie API Symfony OU mode démo ======
  // ============================================================

  /**
   * Authentification utilisateur.
   * Si email = "alice@example.com" et password = "Password123!",
   * on bascule en mode démo sans appeler le backend.
   */
  login(email: string, password: string): Observable<any> {
    // 🔹 Cas spécial : démo locale
    if (email.trim().toLowerCase() === 'alice@example.com' && password === 'Password123!') {
      this.setToken(DEMO_TOKEN);
      this.userService.setCurrentUser({
        id: 1,
        email: 'alice@example.com',
        nom: 'Dupont',
        prenom: 'Alice',
        roles: ['ROLE_USER'],
      });
      return of({ token: DEMO_TOKEN, demo: true });
    }

    // 🔹 Cas normal : login via backend Symfony
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }, { headers }).pipe(
      tap((response) => {
        if (response && response.token) {
          this.setToken(response.token);
        }
      })
    );
  }
}
