import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule /* , TopbarComponent */],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export default class HomeComponent {
  data: any;
  currentYear = new Date().getFullYear();

  // ✅ Chargement garanti de l’image (import.meta.url)
  heroUrl = new URL('../../../assets/illustrations/hero-ecoride.png', import.meta.url).toString();

  constructor(private auth: AuthService, private router: Router, private http: HttpClient) {}

  callApi() {
    this.http.get('/api/users').subscribe({
      next: (res) => (this.data = res),
      error: (err) => (this.data = err),
    });
  }

  goSearch() {
    alert('TODO: page “Chercher un trajet”');
  }

  goPublish() {
    alert('TODO: page “Proposer un trajet”');
  }
}
