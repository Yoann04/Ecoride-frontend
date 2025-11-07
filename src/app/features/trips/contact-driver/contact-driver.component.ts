import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-contact-driver',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contact-driver.component.html',
  styleUrls: ['./contact-driver.component.scss'],
})
export default class ContactDriverComponent {
  /** Identité conducteur */
  driverId = 0;
  driverName = '';
  driverEmail = '';

  origin = '';
  destination = '';
  date = '';
  dateFr = '';

  subject = '';
  message = '';

  constructor(private route: ActivatedRoute) {
    const snap = this.route.snapshot;

    this.driverId = Number(snap.paramMap.get('id') || 0);
    this.driverName = snap.queryParamMap.get('name') ?? '';
    this.driverEmail = snap.queryParamMap.get('email') ?? '';
    this.origin = snap.queryParamMap.get('origin') ?? '';
    this.destination = snap.queryParamMap.get('destination') ?? '';
    this.date = snap.queryParamMap.get('date') ?? '';

    this.dateFr = this.formatDateFr(this.date);

    const routePart =
      this.origin && this.destination ? `${this.origin} → ${this.destination}` : 'votre trajet';
    const datePart = this.dateFr || this.date || '';
    this.subject = `EcoRide – À propos de ${routePart}${datePart ? ` le ${datePart}` : ''}`;
  }

  get canSend(): boolean {
    return !!this.driverEmail && !!this.subject.trim() && !!this.message.trim();
  }

  mailtoHref(): string {
    const to = encodeURIComponent(this.driverEmail);
    const sub = encodeURIComponent(this.subject.trim());

    const lines = [
      this.message.trim(),
      '',
      '—',
      'Envoyé via EcoRide',
      this.origin && this.destination ? `Trajet : ${this.origin} → ${this.destination}` : '',
      this.dateFr || this.date ? `Date : ${this.dateFr || this.date}` : '',
    ].filter(Boolean);

    const body = encodeURIComponent(lines.join('\n'));
    return `mailto:${to}?subject=${sub}&body=${body}`;
  }

  private formatDateFr(input: string | null | undefined): string {
    if (!input) return '';

    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    if (m) {
      const [, y, mo, d] = m;
      return `${d}/${mo}/${y}`;
    }

    const dt = new Date(input);
    return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('fr-FR');
  }
}
