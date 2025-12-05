import { Component, signal, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  searchQuery = signal('');
  activeNav = signal('home');
  loggedIn = signal(false);
  profileUrl = signal<string | null>(null);
  userInitial = signal<string>('');
  showProfileMenu = signal(false);

  private authSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private lastInitial = 'U';
  private clickHandler = () => {
    this.showProfileMenu.set(false);
  };
  
  // For debugging
  get debugInfo() {
    return {
      loggedIn: this.loggedIn(),
      profileUrl: this.profileUrl(),
      userInitial: this.userInitial(),
      hasProfileUrl: !!this.profileUrl()
    };
  }

  constructor(
    private router: Router, 
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Set active nav based on current route on init
    this.updateActiveNav();

    // Update active nav on route changes
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveNav();
      });

    // Subscribe to auth state changes
    this.authSubscription = this.auth.user$.subscribe(user => {
      console.log('🔔 AUTH STATE CHANGE', user ? 'User logged in' : 'User logged out');
      if (user) {
        this.loggedIn.set(true);
        this.updateUserProfile(user);
        this.cdr.markForCheck();
      } else {
        this.loggedIn.set(false);
        this.profileUrl.set(null);
        this.userInitial.set('');
        this.cdr.markForCheck();
      }
      // Trigger change detection to update UI immediately
      this.cdr.detectChanges();
    });

    // Close profile menu when clicking outside
    document.addEventListener('click', this.clickHandler);
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
    document.removeEventListener('click', this.clickHandler);
  }

  private updateUserProfile(user: any) {
    console.log('=== UPDATE USER PROFILE ===');
    console.log('User object:', user);
    console.log('User photoURL:', user.photoURL);
    console.log('User email:', user.email);
    console.log('User displayName:', user.displayName);
    
    // Check if user has a photo URL (from Google login)
    const initial = this.computeInitialFromUser(user);
    this.lastInitial = initial;

    if (user.photoURL) {
      this.profileUrl.set(user.photoURL);
      this.userInitial.set('');
      console.log('SET: Using photo URL');
    } else {
      this.profileUrl.set(null);
      this.userInitial.set(initial);
      console.log('SET: profileUrl=null, userInitial=' + initial);
    }
    
    console.log('FINAL STATE: profileUrl:', this.profileUrl(), 'userInitial:', this.userInitial());
    console.log('=========================');
  }

  private computeInitialFromUser(user: any): string {
    const name = user.displayName || user.email || 'U';
    return name.trim().charAt(0).toUpperCase();
  }

  toggleProfileMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showProfileMenu.set(!this.showProfileMenu());
  }

  onProfileImageError() {
    this.profileUrl.set(null);
    this.userInitial.set(this.lastInitial);
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
