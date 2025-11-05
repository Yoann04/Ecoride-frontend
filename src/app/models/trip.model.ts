// src/app/models/trip.model.ts
export interface UserMini {
  id: number;
  prenom?: string;
  nom?: string;
  pseudo?: string;
  email?: string;
  avatar?: string | null;
}

export interface Brand {
  id?: number;
  libelle?: string;
  marque?: string;
}

export interface Vehicle {
  id: number;
  marque?: string;
  model?: string;
  modele?: string;
  brand?: Brand;
  immatriculation?: string;
  places?: number;
  energy_type?: string;
  is_ecological?: boolean;
}

export interface Review {
  id: number;
  comment: string;
  rating: number; // 1..5
  status?: string;
  user?: UserMini;
}

export interface Trip {
  id: number;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  price: number;
  availableSeats: number;
  isEcological?: boolean;

  driver?: UserMini;
  vehicle?: Vehicle;
  reviews?: Review[];

  isFavorite?: boolean;
  /** ✅ état local pour l’UI réservation */
  reserved?: boolean;
}

export interface TripSearchResponse {
  items: Trip[];
  total: number;
}
