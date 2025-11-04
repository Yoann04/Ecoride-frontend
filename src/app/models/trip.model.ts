// src/app/models/trip.model.ts

export interface Trip {
  id: number;
  departureCity: string;
  arrivalCity: string;
  departureDate: string; // "YYYY-MM-DD"
  departureTime?: string; // "HH:mm"
  arrivalDate?: string;
  arrivalTime?: string;
  price: string; // ex. "12.50"
  availableSeats: number;
  driver?: UserMini;
}

export interface TripSearchResponse {
  items: Trip[];
  total: number;
}

export interface UserMini {
  id: number;
  prenom?: string;
  nom?: string;
  pseudo?: string;
  avatar?: string;
}
