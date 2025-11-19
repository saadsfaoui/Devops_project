import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  searchQuery = signal('');
  activeNav = signal('home');

  constructor(private router: Router) {}

  ngOnInit() {
    // Set active nav based on current route on init
    this.updateActiveNav();

    // Update active nav on route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveNav();
      });
  }

  private updateActiveNav() {
    const url = this.router.url;
    if (url.includes('voyager')) {
      this.activeNav.set('voyager');
    } else if (url.includes('explore') || url.includes('comparateur')) {
      this.activeNav.set('explore');
    } else {
      this.activeNav.set('home');
    }
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    console.log('Search:', value);
  }

  setActive(nav: string) {
    this.activeNav.set(nav);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
