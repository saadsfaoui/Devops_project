import { Routes } from '@angular/router';
import { ExploreComponent } from './pages/explore/explore';
import { VoyagerComponent } from './pages/voyager/voyager';
import { LandingComponent } from './pages/landing/landing';
import { ComparateurComponent } from './pages/comparateur/comparateur';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full'
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
