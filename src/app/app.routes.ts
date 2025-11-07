import { Routes } from '@angular/router';
import ForgotPasswordComponent from './features/auth/forgot-password/forgot-password.component';
import LoginComponent from './features/auth/login/login.component';
import RegisterComponent from './features/auth/register/register.component';
import HomeComponent from './features/home/home.component';
import TripSearchComponent from './features/trips/trip-search.component';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  // ===== Auth =====
  { path: 'login', canActivate: [guestGuard], component: LoginComponent },
  { path: 'register', canActivate: [guestGuard], component: RegisterComponent },
  { path: 'forgot-password', canActivate: [guestGuard], component: ForgotPasswordComponent },

  // ===== Contact conducteur =====
  {
    path: 'drivers/:id/contact',
    loadComponent: () =>
      import('./features/trips/contact-driver/contact-driver.component').then((m) => m.default),
  },

  // ===== Public =====
  { path: 'home', component: HomeComponent },
  { path: 'trips', component: TripSearchComponent },
  {
    path: 'trips/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/trips/create-trip/create-trip.component').then((m) => m.default),
  },
  {
    path: 'trips/:id',
    loadComponent: () =>
      import('./features/trips/trip-detail/trip-detail.component').then(
        (m) => m.TripDetailComponent
      ),
  },

  // ===== Espace utilisateur =====
  {
    path: 'my-reservations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/trips/my-reservations/my-reservations.component').then(
        (m) => m.MyReservationsComponent
      ),
  },
  {
    path: 'my-driver-trips',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/trips/my-driver-trips/my-driver-trips.component').then(
        (m) => m.MyDriverTripsComponent
      ),
  },
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/trips/favorites/favorites.component').then((m) => m.FavoritesComponent),
  },
  {
    path: 'vehicles',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/vehicles/my-vehicles/my-vehicles.component').then((m) => m.default),
  },
  {
    path: 'vehicles/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/vehicles/create-vehicle/create-vehicle.component').then((m) => m.default),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then((m) => m.default),
  },

  // ===== Admin =====
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/admin-dashboard.component').then((m) => m.default),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/users/admin-users.component').then((m) => m.default),
  },
  {
    path: 'admin/trips',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/trips/admin-trips.component').then((m) => m.default),
  },
  {
    path: 'admin/reviews',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/reviews/admin-reviews.component').then((m) => m.default),
  },

  // ===== Redirections =====
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
