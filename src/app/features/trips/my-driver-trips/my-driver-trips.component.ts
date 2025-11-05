import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Trip } from '../../../models/trip.model';
import { TripService } from '../../../services/trip.service';

@Component({
  selector: 'app-my-driver-trips',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-driver-trips.component.html',
})
export class MyDriverTripsComponent implements OnInit {
  loading = false;
  error = '';
  trips: Trip[] = [];

  constructor(private tripsApi: TripService) {}

  async ngOnInit() {
    this.loading = true;
    try {
      this.trips = await this.tripsApi.byDriver();
    } catch (e: any) {
      this.error = e?.message || 'Impossible de charger vos trajets.';
    } finally {
      this.loading = false;
    }
  }
}
