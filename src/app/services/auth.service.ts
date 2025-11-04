// src/app/services/auth.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserService } from './user.service';

export const TOKEN_KEY = 'jwt_token';
const DEMO_TOKEN = 'fake-demo-token'; // token factice pour le mode démo

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = '/api';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient, private userService: UserService, private router: Router) {}

  // === Gestion du token ===
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this.isLoggedInSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.userService.clear();
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/home']);
  }

  hasToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  /** ✅ Vrai si on est en mode démo (token factice) */
  public isDemo(): boolean {
    return this.getToken() === DEMO_TOKEN;
  }

  // === Authentification ===
  /**
   * Login standard : tente l'API.
   * Si tu veux autoriser un mode démo local sans backend, on court-circuite si email/mdp correspondent.
   */
  login(email: string, password: string): Observable<any> {
    // ---- Auth via API Symfony
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }, { headers }).pipe(
      tap((response) => {
        if (response?.token) {
          this.setToken(response.token);
          // Optionnel : pousser l'utilisateur dans UserService si l'API le renvoie.
          // if (response.user) this.userService.set(response.user);
        }
      })
    );
  }
}
