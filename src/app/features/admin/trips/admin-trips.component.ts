import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

type AdminTrip = {
  id: number;
  departureCity: string;
  arrivalCity: string;
  departureDate?: string | null;
  departureTime?: string | null;
  price?: number | string;
  availableSeats?: number;
  driver?: { prenom?: string; nom?: string } | null;
};

type SortPreset =
  | 'date_desc'
  | 'date_asc'
  | 'price_asc'
  | 'price_desc'
  | 'seats_desc'
  | 'seats_asc'
  | 'route_asc'
  | 'route_desc';

@Component({
  standalone: true,
  selector: 'app-admin-trips',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-trips.component.html',
  styleUrls: ['./admin-trips.component.scss'],
})
export default class AdminTripsComponent {
  constructor(private http: HttpClient) {}

  trips: AdminTrip[] = [];
  loading = false;
  error: string | null = null;

  q = '';
  sortPreset: SortPreset = 'date_desc';

  async ngOnInit() {
    this.loading = true;
    this.error = null;
    try {
      const data = await firstValueFrom(this.http.get<any>('/api/trips'));
      const items: AdminTrip[] = (data?.items ?? data ?? []).map((t: any) => ({
        id: t.id,
        departureCity: t.departureCity ?? t.origin ?? '',
        arrivalCity: t.arrivalCity ?? t.destination ?? '',
        departureDate: t.departureDate ?? t.date ?? null,
        departureTime: t.departureTime ?? null,
        price: typeof t.price === 'string' ? parseFloat(t.price.replace(',', '.')) : t.price ?? 0,
        availableSeats: t.availableSeats ?? t.places ?? 0,
        driver: t.driver ?? null,
      }));
      this.trips = items;
    } catch {
      this.trips = [
        {
          id: 101,
          departureCity: 'Dijon',
          arrivalCity: 'Lyon',
          departureDate: '2025-10-05',
          departureTime: '08:30',
          price: 22,
          availableSeats: 2,
          driver: { prenom: 'Alice', nom: 'Durand' },
        },
        {
          id: 102,
          departureCity: 'Paris',
          arrivalCity: 'Montpellier',
          departureDate: '2025-10-05',
          departureTime: '10:00',
          price: 35,
          availableSeats: 3,
          driver: { prenom: 'Laurent', nom: 'Perrin' },
        },
        {
          id: 103,
          departureCity: 'Lyon',
          arrivalCity: 'Nice',
          departureDate: '2025-10-04',
          departureTime: '09:15',
          price: 27,
          availableSeats: 1,
          driver: { prenom: 'Chloé', nom: 'Martin' },
        },
        {
          id: 104,
          departureCity: 'Dijon',
          arrivalCity: 'Paris',
          departureDate: '2025-10-03',
          departureTime: '07:45',
          price: 29,
          availableSeats: 0,
          driver: { prenom: 'Gabin', nom: 'Duc' },
        },
        {
          id: 105,
          departureCity: 'Paris',
          arrivalCity: 'Marseille',
          departureDate: '2025-10-02',
          departureTime: '11:10',
          price: 41,
          availableSeats: 4,
          driver: { prenom: 'Yoann', nom: 'Admin' },
        },
      ];
    } finally {
      this.loading = false;
    }
  }

  get filtered(): AdminTrip[] {
    const q = this.q.trim().toLowerCase();
    let list = [...this.trips];

    if (q) {
      list = list.filter((t) => `${t.departureCity} ${t.arrivalCity}`.toLowerCase().includes(q));
    }

    const [key, dir] = this.sortPreset.split('_') as [string, 'asc' | 'desc'];
    list.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      switch (key) {
        case 'price':
          av = typeof a.price === 'string' ? parseFloat(a.price) : a.price ?? 0;
          bv = typeof b.price === 'string' ? parseFloat(b.price) : b.price ?? 0;
          break;
        case 'seats':
          av = a.availableSeats ?? 0;
          bv = b.availableSeats ?? 0;
          break;
        case 'route':
          av = `${a.departureCity} ${a.arrivalCity}`.toLowerCase();
          bv = `${b.departureCity} ${b.arrivalCity}`.toLowerCase();
          break;
        case 'date':
        default:
          av = a.departureDate ?? '';
          bv = b.departureDate ?? '';
      }
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return dir === 'asc' ? cmp : -cmp;
    });

    return list;
  }

  onSortChange() {}

  dateFR(iso?: string | null) {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR');
  }
  timeFR(t?: string | null) {
    if (!t) return '—';
    const v = t.length === 5 ? `${t}:00` : t;
    const d = new Date(`1970-01-01T${v}`);
    return isNaN(d.getTime())
      ? t
      : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  priceLabel(p?: number | string) {
    const n = typeof p === 'string' ? parseFloat(p.replace(',', '.')) : p ?? 0;
    return `${n.toFixed(0)} €`;
  }
  driverName(d?: { prenom?: string; nom?: string } | null) {
    if (!d) return '—';
    return [d.prenom, d.nom].filter(Boolean).join(' ').trim() || '—';
  }
}
