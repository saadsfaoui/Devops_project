import { Component, signal, ViewChild, output } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './navbar/navbar';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;
  
  protected readonly title = signal('firebase-project');
  showNavbar = signal(true);
  searchQuery = signal('');

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Hide navbar on login and register pages
        const hideNavbarRoutes = ['/login', '/register'];
        this.showNavbar.set(!hideNavbarRoutes.includes(event.url));
      });
  }
}
