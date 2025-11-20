import { Component, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { FlashService } from '../services/flash.service';

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
  loggedIn = signal(false);
  profileUrl = signal('');
  showProfileMenu = signal(false);
  flashMessage = signal('');
  flashType = signal<'success' | 'error' | ''>('');

  constructor(private router: Router, private auth: AuthService, private flash: FlashService) {}

  ngOnInit() {
    // Set active nav based on current route on init
    this.updateActiveNav();

    // Update active nav on route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveNav();
        // Refresh auth state on route change to reflect latest login state immediately
        this.refreshAuthState();
      });

    // Subscribe to auth state and update UI
    this.auth.user$.subscribe(user => {
      if (user) {
        this.loggedIn.set(true);
        const url = (user as any).photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(((user as any).displayName || (user as any).email || 'User'))}&background=random&rounded=true`;
        this.profileUrl.set(url);
      } else {
        this.loggedIn.set(false);
        this.profileUrl.set('');
      }
    });

    // Also refresh auth state immediately on init (synchronous check)
    this.refreshAuthState();

    // Close profile menu when clicking outside
    document.addEventListener('click', () => {
      this.showProfileMenu.set(false);
    });

    // reactively bind flash.message and flash.type using effect
    effect(() => {
      this.flashMessage.set(this.flash.message());
      this.flashType.set(this.flash.type());
    });
  }

  private refreshAuthState() {
    try {
      const user = this.auth.getCurrentUser();
      if (user) {
        this.loggedIn.set(true);
        const url = (user as any).photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(((user as any).displayName || (user as any).email || 'User'))}&background=random&rounded=true`;
        this.profileUrl.set(url);
      } else {
        this.loggedIn.set(false);
        this.profileUrl.set('');
      }
    } catch (err) {
      // ignore
    }
  }

  toggleProfileMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showProfileMenu.set(!this.showProfileMenu());
  }

  async signOut() {
    try {
      await this.auth.logout();
      this.showProfileMenu.set(false);
      // keep user on the home/landing page after logout
      this.router.navigate(['/']);
    } catch (err) {
      console.error('Logout failed', err);
    }
  }

  goAccount(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.showProfileMenu.set(false);
    this.router.navigate(['/register']);
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
