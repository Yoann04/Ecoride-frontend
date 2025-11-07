import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

type Kpi = { label: string; value: number };
type RecentUser = { initials: string; name: string; date: string };
type RecentTrip = { from: string; to: string; date: string };
type RecentReview = { stars: number; text: string; author: string; date: string };

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export default class AdminDashboardComponent {
  week = 40;
  weeks = Array.from({ length: 52 }, (_, i) => i + 1);

  kpis: Kpi[] = [
    { label: 'Utilisateurs actifs', value: 250 },
    { label: 'Nouveaux trajets', value: 34 },
    { label: 'Avis en attente', value: 7 },
  ];

  chartLabels = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
  chartData = [9, 20, 16, 13, 28, 22, 30];

  get chartPoints(): string {
    const max = 40;
    const w = 560,
      h = 160,
      padX = 40,
      padY = 30;
    const stepX = (w - padX * 2) / (this.chartData.length - 1);
    return this.chartData
      .map((v, i) => {
        const x = padX + i * stepX;
        const y = 130 - (v / max) * 100;
        return `${x},${y}`;
      })
      .join(' ');
  }

  recentUsers: RecentUser[] = [
    { initials: 'A', name: 'Alice', date: '04 oct. 2025' },
    { initials: 'C', name: 'Chloé', date: '04 oct. 2025' },
    { initials: 'G', name: 'Gabin', date: '03 oct. 2025' },
    { initials: 'L', name: 'Laurent', date: '02 oct. 2025' },
  ];

  recentTrips: RecentTrip[] = [
    { from: 'Dijon', to: 'Lyon', date: '05 oct. 2025' },
    { from: 'Paris', to: 'Montpellier', date: '05 oct. 2025' },
    { from: 'Lyon', to: 'Nice', date: '04 oct. 2025' },
    { from: 'Dijon', to: 'Paris', date: '03 oct. 2025' },
    { from: 'Paris', to: 'Marseille', date: '02 oct. 2025' },
  ];

  recentReviews: RecentReview[] = [
    {
      stars: 4,
      text: 'Trajet agréable et ponctuel, conductrice très sympathique. Voiture propre et conduite fluide.',
      author: 'Chloé P.',
      date: '04 oct. 2025',
    },
    {
      stars: 5,
      text: 'Conductrice au top, respectueuse des horaires et très prudente. Je reprendrai avec elle sans hésiter !',
      author: 'Alice M.',
      date: '04 oct. 2025',
    },
  ];

  onChangeWeek() {}
}
