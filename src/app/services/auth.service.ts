import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, of, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface Me {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private static readonly TOKEN_KEY = 'ecoride.jwt';
  private currentUser$ = new BehaviorSubject<Me | null>(null);
  private storage: Storage = localStorage;

  /** ====== TOKEN ====== */
  get token(): string | null {
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  private setToken(token: string) {
    localStorage.setItem(AuthService.TOKEN_KEY, token);
  }

  clearToken() {
    localStorage.removeItem(AuthService.TOKEN_KEY);
    this.currentUser$.next(null);
  }

  login(payload: LoginPayload): Observable<Me> {
    // POST /api/login -> { token }, puis GET /api/me
    return this.http.post<LoginResponse>('/api/login', payload).pipe(
      tap((res) => this.setToken(res.token)),
      switchMap(() => this.fetchMe()),
      tap((me) => this.currentUser$.next(me))
    );
  }

  register(payload: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
  }): Observable<Me> {
    return this.http
      .post('/api/register', payload)
      .pipe(switchMap(() => this.login({ email: payload.email, password: payload.password })));
  }

  logout(redirectToLogin = true) {
    this.clearToken();
    if (redirectToLogin) this.router.navigate(['/login']);
  }

  fetchMe(): Observable<Me> {
    if (!this.token) return of(null as any);
    return this.http.get<Me>('/api/me');
  }

  me$(): Observable<Me | null> {
    return this.currentUser$.asObservable();
  }

  isLoggedIn$(): Observable<boolean> {
    return this.me$().pipe(map((u) => !!u));
  }

  hydrateSession(): Observable<Me | null> {
    if (!this.token) {
      this.currentUser$.next(null);
      return of(null);
    }
    return this.fetchMe().pipe(
      tap({
        next: (me) => this.currentUser$.next(me),
        error: () => this.logout(false),
      })
    );
  }
}
