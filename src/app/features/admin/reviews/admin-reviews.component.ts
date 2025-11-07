import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

type ReviewStatus = 'pending' | 'published' | 'rejected';

type AdminReview = {
  id: number;
  rating: number;
  comment: string;
  author?: { prenom?: string; nom?: string; email?: string };
  createdAt?: string | null;
  status?: ReviewStatus;
  trip?: { from?: string; to?: string; date?: string | null };
};

type SortPreset = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc';

@Component({
  standalone: true,
  selector: 'app-admin-reviews',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-reviews.component.html',
  styleUrls: ['./admin-reviews.component.scss'],
})
export default class AdminReviewsComponent {
  constructor(private http: HttpClient) {}

  reviews: AdminReview[] = [];

  loading = false;
  error: string | null = null;

  // Filtres
  q = '';
  status: '' | ReviewStatus = '';
  minRating: 0 | 1 | 2 | 3 | 4 | 5 = 0;
  sortPreset: SortPreset = 'date_desc';

  async ngOnInit() {
    this.loading = true;
    this.error = null;
    try {
      const data = await firstValueFrom(this.http.get<any>('/api/reviews'));
      const items: AdminReview[] = (data?.items ?? data ?? []).map((r: any) => ({
        id: r.id,
        rating: Number(r.rating ?? r.note ?? 0),
        comment: r.comment ?? r.avis ?? '',
        author: r.author ?? r.user ?? { prenom: r.prenom, nom: r.nom, email: r.email },
        createdAt: r.createdAt ?? r.date ?? null,
        status: (r.status as ReviewStatus) ?? 'published',
        trip: {
          from: r.trip?.origin ?? r.trip?.from ?? r.origin ?? '',
          to: r.trip?.destination ?? r.trip?.to ?? r.destination ?? '',
          date: r.trip?.date ?? null,
        },
      }));
      this.reviews = items;
    } catch {
      this.reviews = [
        {
          id: 1,
          rating: 5,
          comment:
            'Conductrice au top, respect des horaires et conduite très souple. Je recommande !',
          author: { prenom: 'Alice', nom: 'M.', email: 'alice@example.com' },
          createdAt: '2025-10-04T09:30:00Z',
          status: 'published',
          trip: { from: 'Besançon', to: 'Strasbourg', date: '2025-11-11' },
        },
        {
          id: 2,
          rating: 4,
          comment: 'Ponctuelle et sympathique. Véhicule propre.',
          author: { prenom: 'Chloé', nom: 'P.', email: 'chloe@example.com' },
          createdAt: '2025-10-04T11:10:00Z',
          status: 'published',
          trip: { from: 'Dijon', to: 'Lyon', date: '2025-10-05' },
        },
        {
          id: 3,
          rating: 2,
          comment: 'Retard au départ. Communication à améliorer.',
          author: { prenom: 'Gabin', nom: 'D.', email: 'gabin@example.com' },
          createdAt: '2025-10-03T08:00:00Z',
          status: 'pending',
          trip: { from: 'Paris', to: 'Montpellier', date: '2025-10-05' },
        },
        {
          id: 4,
          rating: 3,
          comment: 'Trajet correct dans l’ensemble.',
          author: { prenom: 'Laurent', nom: 'P.', email: 'laurent@example.com' },
          createdAt: '2025-10-02T13:00:00Z',
          status: 'published',
          trip: { from: 'Lyon', to: 'Nice', date: '2025-10-04' },
        },
        {
          id: 5,
          rating: 1,
          comment: 'Annulation de dernière minute.',
          author: { prenom: 'Yoann', nom: 'A.', email: 'yoann@ecoride.com' },
          createdAt: '2025-10-01T10:00:00Z',
          status: 'rejected',
          trip: { from: 'Dijon', to: 'Paris', date: '2025-10-03' },
        },
      ];
    } finally {
      this.loading = false;
    }
  }

  get filtered(): AdminReview[] {
    const q = this.q.trim().toLowerCase();
    let list = [...this.reviews];

    if (q) {
      list = list.filter((r) => {
        const name = `${r.author?.prenom ?? ''} ${r.author?.nom ?? ''}`.toLowerCase();
        const mail = r.author?.email?.toLowerCase() ?? '';
        const route = `${r.trip?.from ?? ''} ${r.trip?.to ?? ''}`.toLowerCase();
        return (
          r.comment.toLowerCase().includes(q) ||
          name.includes(q) ||
          mail.includes(q) ||
          route.includes(q)
        );
      });
    }

    if (this.status) list = list.filter((r) => (r.status ?? 'published') === this.status);
    if (this.minRating > 0) list = list.filter((r) => (r.rating ?? 0) >= this.minRating);

    list.sort((a, b) => {
      switch (this.sortPreset) {
        case 'rating_desc':
          return (b.rating ?? 0) - (a.rating ?? 0);
        case 'rating_asc':
          return (a.rating ?? 0) - (b.rating ?? 0);
        case 'date_asc':
          return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
        case 'date_desc':
        default:
          return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      }
    });

    return list;
  }

  dateFR(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
  }

  authorName(r: AdminReview): string {
    const full = [r.author?.prenom, r.author?.nom].filter(Boolean).join(' ').trim();
    return full || r.author?.email || '—';
  }

  routeLabel(r: AdminReview): string {
    const a = r.trip?.from ?? '';
    const b = r.trip?.to ?? '';
    return a && b ? `${a} → ${b}` : '—';
  }
}
