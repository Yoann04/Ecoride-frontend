import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';
import { LoginComponent } from './features/auth/login/login.component';
import HomeComponent from './features/home/home.component';
import ProfileComponent from './features/profile/profile.component'; // ✅

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] }, // ✅
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
