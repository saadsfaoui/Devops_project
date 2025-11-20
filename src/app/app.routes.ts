import { Routes } from '@angular/router';
import { ExploreComponent } from './pages/explore/explore';
import { VoyagerComponent } from './pages/voyager/voyager';
import { LandingComponent } from './pages/landing/landing';
import { ComparateurComponent } from './pages/comparateur/comparateur';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';

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
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'explore',
    component: ExploreComponent
  },
  {
    path: 'voyager',
    component: VoyagerComponent
  }
  ,
  {
    path: 'comparateur',
    component: ComparateurComponent
  }
];
