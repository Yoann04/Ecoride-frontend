// src/app/services/trip.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Trip } from '../models/trip.model'; // ✅ une seule fois

export interface TripSearchFilters {
  origin?: string;
  destination?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  sort?: 'departureDate' | 'price';
  order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface TripSearchResponse {
  items: Trip[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly base = '/api/trips';

  constructor(private http: HttpClient) {}

  /** Recherche paginée */
  async search(filters: TripSearchFilters): Promise<TripSearchResponse> {
    const params = this.buildSearchParams(filters);
    return firstValueFrom(this.http.get<TripSearchResponse>(this.base, { params }));
  }

  /** 🔹 Détail d’un trajet par ID */
  async getOne(id: number): Promise<Trip> {
    return firstValueFrom(this.http.get<Trip>(`${this.base}/${id}`));
  }

  /** 🚗 Trajets proposés par le conducteur connecté */
  async byDriver(): Promise<Trip[]> {
    return firstValueFrom(this.http.get<Trip[]>(`${this.base}/by-driver`));
  }

  /** ⭐ Trajets favoris */
  async favorites(): Promise<Trip[]> {
    return firstValueFrom(this.http.get<Trip[]>(`${this.base}/favorites`));
  }

  private buildSearchParams(filters: TripSearchFilters): HttpParams {
    let params = new HttpParams();
    if (filters.origin) params = params.set('origin', filters.origin);
    if (filters.destination) params = params.set('destination', filters.destination);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    params = params
      .set('sort', filters.sort ?? 'departureDate')
      .set('order', filters.order ?? 'ASC')
      .set('page', String(filters.page ?? 1))
      .set('limit', String(filters.limit ?? 20));
    return params;
  }
}
