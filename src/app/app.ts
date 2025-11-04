import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from './features/shared/ui/topbar.component';
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
  constructor(private userService: UserService) {}
  ngOnInit() {
    this.userService.bootstrapFromStorage();
  }
}
