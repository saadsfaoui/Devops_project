import { Routes } from '@angular/router';
import { ExploreComponent } from './pages/explore/explore';
import { VoyagerComponent } from './pages/voyager/voyager';
import { LandingComponent } from './pages/landing/landing';
import { ComparateurComponent } from './pages/comparateur/comparateur';
import { authGuard } from "./guards/auth.guard"
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
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
    path: 'home',
    component: LandingComponent,
    pathMatch: 'full'
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
  }
];
