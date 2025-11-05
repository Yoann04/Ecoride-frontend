import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Trip } from '../../../models/trip.model';
import { TripService } from '../../../services/trip.service';

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-trips.component.html',
  styles: [
    `
      .wrap {
        max-width: 1000px;
        margin: 0 auto;
        padding: 1rem;
      }
      .titlebar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .tabs {
        display: flex;
        gap: 0.5rem;
        border-bottom: 1px solid #eee;
      }
      .tab {
        padding: 0.6rem 0.9rem;
        border: 1px solid transparent;
        border-radius: 10px 10px 0 0;
        cursor: pointer;
      }
      .tab.active {
        border-color: #ddd #ddd #fff #ddd;
        background: #fff;
        font-weight: 600;
      }
      .muted {
        color: #777;
      }
      .cards {
        display: grid;
        gap: 0.75rem;
        margin-top: 1rem;
      }
      .card {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.75rem;
        align-items: center;
        border: 1px solid #eee;
        border-radius: 12px;
        padding: 0.9rem 1rem;
      }
      .driver {
        font-weight: 600;
      }
      .meta {
        font-size: 0.92rem;
        color: #555;
      }
      .price {
        font-weight: 700;
      }
      .btn,
      .ghost {
        text-decoration: none;
        padding: 0.5rem 0.8rem;
        border-radius: 10px;
        border: 1px solid #ddd;
      }
      .btn.primary {
        background: #64a859;
        border-color: #64a859;
        color: #fff;
      }
      .ghost {
        background: transparent;
      }
      .empty {
        text-align: center;
        padding: 1.5rem;
        border: 1px dashed #ddd;
        border-radius: 12px;
      }
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        background: #f2f2f2;
        display: inline-block;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .chip {
        font-size: 0.85rem;
        border: 1px solid #eee;
        padding: 0.2rem 0.5rem;
        border-radius: 999px;
      }
    `,
  ],
})
export default class MyTripsComponent {
  activeTab = signal<'driver' | 'favorites'>('driver');
  loading = signal(false);
  error = signal<string | null>(null);
  mine = signal<Trip[]>([]);
  favs = signal<Trip[]>([]);

  constructor(private trips: TripService) {}

  async ngOnInit() {
    await this.load();
  }

  async setTab(tab: 'driver' | 'favorites') {
    this.activeTab.set(tab);
    // lazy load favoris si pas chargé
    if (tab === 'favorites' && this.favs().length === 0) {
      await this.loadFavorites();
    }
  }

  currentList = computed(() => (this.activeTab() === 'driver' ? this.mine() : this.favs()));

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [driver, favorites] = await Promise.allSettled([
        this.trips.byDriver(),
        // on peut retarder les favoris (mais on les charge ici pour simplicité)
        this.trips.favorites(),
      ]);
      if (driver.status === 'fulfilled') this.mine.set(driver.value);
      else console.warn('byDriver failed:', driver.reason);

      if (favorites.status === 'fulfilled') this.favs.set(favorites.value);
      else console.warn('favorites failed:', favorites.reason);
    } catch (e: any) {
      this.error.set(e?.message || 'Impossible de charger vos trajets.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadFavorites() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.trips.favorites();
      this.favs.set(res);
    } catch (e: any) {
      this.error.set(e?.message || 'Impossible de charger vos favoris.');
    } finally {
      this.loading.set(false);
    }
  }

  avatarUrl(t: Trip): string {
    return t.driver?.avatar || '/assets/avatars/default.png';
  }

  driverName(t: Trip): string {
    const d = t.driver;
    if (!d) return 'Conducteur';
    if (d.prenom || d.nom) return `${d.prenom ?? ''} ${d.nom ?? ''}`.trim();
    return d.pseudo ?? 'Conducteur';
  }

  dateLabel(t: Trip): string {
    // t.departureDate = "YYYY-MM-DD" | ISO ; on affiche au format FR
    try {
      const d = new Date(`${t.departureDate}T${t.departureTime ?? '00:00'}:00`);
      if (isNaN(d.getTime())) return t.departureDate;
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return t.departureDate;
    }
  }
}
