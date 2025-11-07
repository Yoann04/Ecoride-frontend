import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Vehicle } from '../models/trip.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly base = '/api/vehicles';

  constructor(private http: HttpClient) {}

  /** Mes véhicules (utilisateur connecté) */
  async getMy(): Promise<Vehicle[]> {
    return firstValueFrom(this.http.get<Vehicle[]>(`${this.base}/my`));
  }

  /** Créer un véhicule */
  async create(payload: {
    marque: string;
    model: string;
    immatriculation: string;
    places: number;
    energy_type?: string | null;
    is_ecological?: boolean;
  }): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>(this.base, payload));
  }

  /** Supprimer un véhicule */
  async remove(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }
}
