// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

// --- AUTH ---
import ForgotPasswordComponent from './features/auth/forgot-password/forgot-password.component';
import LoginComponent from './features/auth/login/login.component';
import RegisterComponent from './features/auth/register/register.component';

// --- BASE ---
import HomeComponent from './features/home/home.component';

// --- TRIPS (list publique) ---
import TripSearchComponent from './features/trips/trip-search.component';

export const routes: Routes = [
  // Auth
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  // Accueil
  { path: 'home', component: HomeComponent },

  // Recherche de trajets (publique)
  { path: 'trips', component: TripSearchComponent },

  // Détail d’un trajet
  {
    path: 'trips/:id',
    loadComponent: () =>
      import('./features/trips/trip-detail/trip-detail.component').then(
        (m) => m.TripDetailComponent
      ),
  },

  // Proposer un trajet (protégé)
  {
    path: 'trips/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/trips/create-trip/create-trip.component').then((m) => m.default),
  },

  // Mes réservations en tant que passager (protégé)
  {
    path: 'my-reservations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/trips/my-reservations/my-reservations.component').then(
        (m) => m.MyReservationsComponent
      ),
  },

  // Mes trajets conducteur (protégé)
  {
    path: 'my-driver-trips',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/trips/my-driver-trips/my-driver-trips.component').then(
        (m) => m.MyDriverTripsComponent
      ),
  },

  // Mes favoris (protégé)
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/trips/favorites/favorites.component').then((m) => m.FavoritesComponent),
  },

  // Véhicules (protégé)
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

  // Profil (protégé)
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then((m) => m.default),
  },

  // Redirections
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
