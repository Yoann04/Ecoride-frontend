import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Trip } from '../../../models/trip.model';
import { TripService } from '../../../services/trip.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favorites.component.html',
})
export class FavoritesComponent implements OnInit {
  loading = false;
  error = '';
  favorites: Trip[] = [];

  constructor(private trips: TripService) {}

  async ngOnInit() {
    this.loading = true;
    try {
      this.favorites = await this.trips.favorites();
    } catch (e: any) {
      this.error = e?.message || 'Impossible de charger vos favoris.';
    } finally {
      this.loading = false;
    }
  }

  fullName(t: Trip) {
    return t.driver?.prenom
      ? `${t.driver.prenom} ${t.driver.nom ?? ''}`.trim()
      : t.driver?.pseudo || 'Conducteur';
  }

  avatarUrl(t: Trip) {
    return t.driver?.avatar || '/assets/default-avatar.png';
  }

  async removeFavorite(t: Trip) {
    try {
      await this.trips.removeFavorite(t.id);
      this.favorites = this.favorites.filter((f) => f.id !== t.id);
    } catch {
      alert('Erreur lors de la suppression du favori.');
    }
  }
}
