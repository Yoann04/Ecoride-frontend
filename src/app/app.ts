import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from './features/shared/ui/topbar.component';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent],
  template: `
    <app-topbar></app-topbar>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent implements OnInit {
  constructor(private userService: UserService, private auth: AuthService) {}

  ngOnInit() {
    // 1️⃣ Restaure les infos locales (avatar, pseudo, etc.)
    this.userService.bootstrapFromStorage();

    // 2️⃣ Si un token JWT est présent, recharge le profil `/api/me`
    this.auth.hydrateSession().subscribe({
      next: (me) => {
        if (me) this.userService.setCurrentUser(me);
      },
      error: () => {
        // en cas de token expiré → nettoyer proprement
        this.userService.clear();
      },
    });
  }
}
