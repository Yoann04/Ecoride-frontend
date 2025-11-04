import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Trip } from '../../models/trip.model';
import { TripSearchFilters, TripService } from '../../services/trip.service';

import FooterComponent from '../shared/footer.component';

@Component({
  selector: 'app-trip-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FooterComponent],
  templateUrl: './trip-search.component.html',
  styleUrls: ['./trip-search.component.scss'],
})
export default class TripSearchComponent {
  origin = '';
  destination = '';
  date = ''; // YYYY-MM-DD

  sort: TripSearchFilters['sort'] = 'departureDate';
  order: TripSearchFilters['order'] = 'ASC';

  loading = false;
  error = '';
  trips: Trip[] = [];
  total = 0;

  constructor(private tripsApi: TripService) {}

  async ngOnInit() {
    // await this.search();
  }

  async search() {
    this.loading = true;
    this.error = '';
    try {
      const filters: TripSearchFilters = {
        origin: this.origin.trim() || undefined,
        destination: this.destination.trim() || undefined,
        dateFrom: this.date || undefined,
        dateTo: this.date || undefined,
        sort: this.sort,
        order: this.order,
        page: 1,
        limit: 20,
      };

      const res = await this.tripsApi.search(filters);
      this.trips = res.items ?? [];
      this.total = res.total ?? this.trips.length;
    } catch (e: any) {
      this.error = e?.message || 'Erreur lors de la recherche';
      this.trips = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
  }

  onSortChange(value: string) {
    if (value === 'price-asc') {
      this.sort = 'price';
      this.order = 'ASC';
    } else if (value === 'price-desc') {
      this.sort = 'price';
      this.order = 'DESC';
    } else if (value === 'date-desc') {
      this.sort = 'departureDate';
      this.order = 'DESC';
    } else {
      this.sort = 'departureDate';
      this.order = 'ASC';
    }
    this.search();
  }

  fullName(t: Trip) {
    const n = t.driver?.prenom
      ? `${t.driver.prenom} ${t.driver.nom ?? ''}`.trim()
      : t.driver?.pseudo;
    return n || 'Conducteur';
  }

  avatarUrl(t: Trip) {
    return t.driver?.avatar || '/assets/default-avatar.png';
  }
}
