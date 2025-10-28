import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrentUser, UserService } from '../../services/user.service';
import TopbarComponent from '../shared/ui/topbar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, TopbarComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export default class ProfileComponent implements OnInit {
  userSig = signal<CurrentUser | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  displayName = computed(() => {
    const u = this.userSig();
    if (!u) return '';
    return u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email;
    // ou u.nom + u.prenom selon ce que tu renvoies
  });

  constructor(private userService: UserService) {}

  async ngOnInit() {
    this.userSig.set(null);
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.userService.loadMe();
      const raw = localStorage.getItem('current_user');
      if (raw) this.userSig.set(JSON.parse(raw));
    } catch {
      this.error.set('Impossible de charger votre profil.');
    } finally {
      this.loading.set(false);
    }
  }

  async refresh() {
    await this.ngOnInit();
  }
}
