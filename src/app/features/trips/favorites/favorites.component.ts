import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Trip } from '../../../models/trip.model';
import { TripService } from '../../../services/trip.service';
import { UserService } from '../../../services/user.service';

@Component({
  standalone: true,
  selector: 'app-favorites',
  imports: [CommonModule, RouterLink],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
})
export class FavoritesComponent implements OnInit, OnDestroy {
  private tripsApi = inject(TripService);
  private users = inject(UserService);

  trips: Trip[] = [];
  loading = false;
  error = '';

  private sub?: Subscription;

  ngOnInit(): void {
    this.load();
    // ✅ Recharge automatiquement quand un favori est ajouté/retiré ailleurs
    this.sub = this.users.favoritesRefresh$.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private async load() {
    this.loading = true;
    this.error = '';
    try {
      this.trips = await this.tripsApi.favorites();
    } catch (e: any) {
      this.error = e?.message || 'Impossible de charger vos favoris.';
      this.trips = [];
    } finally {
      this.loading = false;
    }
  }
}
