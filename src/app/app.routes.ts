import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';
import ForgotPasswordComponent from './features/auth/forgot-password/forgot-password.component';
import LoginComponent from './features/auth/login/login.component';
import RegisterComponent from './features/auth/register/register.component';
import HomeComponent from './features/home/home.component';
import ProfileComponent from './features/profile/profile.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }, // 👈 new
  { path: 'forgot-password', component: ForgotPasswordComponent }, // 👈 new
  { path: 'home', component: HomeComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
