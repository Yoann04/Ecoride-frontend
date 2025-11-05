// src/app/services/trip.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { Review, Trip, TripSearchResponse } from '../models/trip.model'; // ⬅️ ajout Review

export interface TripSearchFilters {
  origin?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'departureDate' | 'price';
  order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly base = '/api/trips';
  private readonly reviewsBase = '/api/review'; // doit matcher ton backend: GET /api/review/trip/{id}
  private readonly vehiclesBase = '/api/vehicles';

  constructor(private http: HttpClient) {}

  // Recherche paginée
  async search(filters: TripSearchFilters): Promise<TripSearchResponse> {
    const params = this.buildSearchParams(filters);
    return firstValueFrom(
      this.http.get<TripSearchResponse>(this.base, { params }).pipe(
        map((res) => ({
          ...res,
          items: (res.items ?? []).map(this.normalizeTrip),
        }))
      )
    );
  }

  async getOne(id: number): Promise<Trip> {
    return firstValueFrom(this.http.get<Trip>(`${this.base}/${id}`).pipe(map(this.normalizeTrip)));
  }

  // Conducteur
  async byDriver(): Promise<Trip[]> {
    return firstValueFrom(
      this.http
        .get<Trip[]>(`${this.base}/by-driver`)
        .pipe(map((arr) => (arr ?? []).map(this.normalizeTrip)))
    );
  }

  // Passager (réservations)
  async myReservations(): Promise<Trip[]> {
    return firstValueFrom(
      this.http
        .get<Trip[]>(`${this.base}/my-reservations`)
        .pipe(map((arr) => (arr ?? []).map(this.normalizeTrip)))
    );
  }

  // Favoris
  async favorites(): Promise<Trip[]> {
    return firstValueFrom(
      this.http
        .get<Trip[]>(`${this.base}/favorites`)
        .pipe(map((arr) => (arr ?? []).map(this.normalizeTrip)))
    );
  }

  async addFavorite(tripId: number): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.base}/${tripId}/favorite`, {}));
  }

  async removeFavorite(tripId: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.base}/${tripId}/favorite`));
  }

  async isFavorite(tripId: number): Promise<boolean> {
    return firstValueFrom(this.http.get<boolean>(`${this.base}/${tripId}/favorite`));
  }

  // Réservations
  async getTripStatus(id: number): Promise<{ reserved: boolean; seatsLeft: number }> {
    return firstValueFrom(
      this.http.get<{ reserved: boolean; seatsLeft: number }>(`${this.base}/${id}/status`)
    );
  }

  async reserveTrip(id: number): Promise<{ reserved: true; seatsLeft: number }> {
    return firstValueFrom(
      this.http.post<{ reserved: true; seatsLeft: number }>(`${this.base}/${id}/reserve`, {})
    );
  }

  async cancelReservation(id: number): Promise<{ reserved: false; seatsLeft: number }> {
    return firstValueFrom(
      this.http.delete<{ reserved: false; seatsLeft: number }>(`${this.base}/${id}/reserve`)
    );
  }

  // ---- Reviews
  async getReviewsForTrip(tripId: number): Promise<Review[]> {
    return firstValueFrom(this.http.get<Review[]>(`${this.reviewsBase}/trip/${tripId}`));
  }

  async addReview(trip_id: number, rating: number, comment: string): Promise<void> {
    await firstValueFrom(this.http.post<void>(this.reviewsBase, { trip_id, rating, comment }));
  }

  // Utilitaires
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

  private normalizeTrip = (t: any): Trip => {
    const priceNum =
      typeof t?.price === 'number'
        ? t.price
        : parseFloat(String(t?.price ?? '0').replace(',', '.'));

    return {
      ...t,
      price: isNaN(priceNum) ? 0 : priceNum,
      driver: t?.driver ?? undefined,
      vehicle: t?.vehicle ?? undefined,
      reviews: t?.reviews ?? undefined,
    } as Trip;
  };
}
