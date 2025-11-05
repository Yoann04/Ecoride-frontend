import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Trip } from '../../../models/trip.model';
import { TripService } from '../../../services/trip.service';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-reservations.component.html',
})
export class MyReservationsComponent implements OnInit {
  loading = false;
  error = '';
  trips: Trip[] = [];

  constructor(private tripsApi: TripService) {}

  async ngOnInit() {
    this.loading = true;
    try {
      this.trips = await this.tripsApi.myReservations();
    } catch (e: any) {
      this.error = e?.message || 'Impossible de charger vos réservations.';
    } finally {
      this.loading = false;
    }
  }

  name(t: Trip) {
    return t.driver?.prenom
      ? `${t.driver.prenom} ${t.driver.nom ?? ''}`.trim()
      : t.driver?.pseudo || 'Conducteur';
  }
}
