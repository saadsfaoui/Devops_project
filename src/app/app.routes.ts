import { Routes } from '@angular/router';
import { ExploreComponent } from './pages/explore/explore';
import { VoyagerComponent } from './pages/voyager/voyager';
import { LandingComponent } from './pages/landing/landing';
import { ComparateurComponent } from './pages/comparateur/comparateur';
import { FavouritesComponent } from './pages/favourites/favourites';
import { authGuard } from "./guards/auth.guard"
import { adminGuard } from "./guards/admin.guard"
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AccountComponent } from './pages/account/account.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { ProfileSetupComponent } from './pages/profile-setup/profile-setup.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'profile-setup',
    component: ProfileSetupComponent,
    canActivate: [authGuard]
  },
  {
    path: 'account',
    component: AccountComponent,
    canActivate: [authGuard]
  },
  
  {
    path: 'explore',
    component: ExploreComponent,
    canActivate: [authGuard]
  },
  {
    path: 'voyager',
    component: VoyagerComponent,
    canActivate: [authGuard]
  },
  {
    path: 'comparateur',
    component: ComparateurComponent,
    canActivate: [authGuard]
  },
  {
    path: 'favourites',
    component: FavouritesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [adminGuard]
  }
];
