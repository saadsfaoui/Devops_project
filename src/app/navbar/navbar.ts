import { Component, signal, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { FlashService } from '../services/flash.service';
import { SearchService } from '../services/search.service';
import { ApiService } from '../services/api.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() searchLocation = new EventEmitter<string>();
  
  searchQuery = signal('');
  activeNav = signal('home');
  loggedIn = signal(false);
  profileUrl = signal<string | null>(null);
  userInitial = signal<string>('');
  showProfileMenu = signal(false);
  isAdmin = signal(false);
  flashMessage = signal('');
  flashType = signal<'success' | 'error' | ''>('');
  searchResults = signal<Array<{name: string; country: string}>>([]);
  showSearchResults = signal(false);
  mobileMenuOpen = signal(false);

  private authSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private lastInitial = 'U';
  private clickHandler = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Si clic sur hamburger ou dans le menu → ne rien faire
    if (
      target.closest('.hamburger') ||
      target.closest('.nav-items')
    ) {
      return;
    }

    this.showProfileMenu.set(false);
    this.closeMobileMenu();
  };

    

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

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
    private flash: FlashService,
    private cdr: ChangeDetectorRef,
    private searchService: SearchService,
    private apiService: ApiService
  ) {
    // Listen to cities available in the search service
    this.searchService.cities$.subscribe(cities => {
      this.searchResults.set(cities);
    });
  }

  ngOnInit() {
    // Set active nav based on current route on init
    this.updateActiveNav();

    // Update active nav on route changes
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveNav();
        this.closeMobileMenu(); // Fermer le menu mobile lors du changement de route
      });

    // Subscribe to auth state changes
    this.authSubscription = this.auth.user$.subscribe(user => {
      console.log('🔔 AUTH STATE CHANGE', user ? 'User logged in' : 'User logged out');
      if (user) {
        this.loggedIn.set(true);
        this.isAdmin.set(user.email === environment.adminEmail);
        this.updateUserProfile(user);
        this.cdr.markForCheck();
      } else {
        this.loggedIn.set(false);
        this.isAdmin.set(false);
        this.profileUrl.set(null);
        this.userInitial.set('');
        this.cdr.markForCheck();
      }
      this.cdr.detectChanges();
    });

    // Close profile menu and mobile menu when clicking outside
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
    this.router.navigate(['/account']);
  }

  // Dans la méthode updateActiveNav(), ajoutez cette condition :

  private updateActiveNav() {
    const url = this.router.url;
    if (url.includes('voyager')) {
      this.activeNav.set('voyager');
    } else if (url.includes('comparateur')) {
      this.activeNav.set('comparateur');
    } else if (url.includes('favourites')) {
      this.activeNav.set('favourites');
    } else if (url.includes('explore')) {
      this.activeNav.set('explore');
    } else {
      this.activeNav.set('home');
    }
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    
    if (value.trim().length === 0) {
      this.showSearchResults.set(false);
      this.searchResults.set([]);
      return;
    }
    
    // Filter cities based on search query
    const allCities = this.searchResults();
    const filteredResults = allCities.filter(city =>
      city.name.toLowerCase().includes(value.toLowerCase()) ||
      city.country.toLowerCase().includes(value.toLowerCase())
    );
    
    this.searchResults.set(filteredResults);
    
    // Emit search event to map component
    this.searchLocation.emit(value);
    this.showSearchResults.set(true);
  }

  selectSearchResult(result: {name: string; country: string}) {
    this.searchQuery.set(result.name);
    this.searchLocation.emit(result.name);
    this.showSearchResults.set(false);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showSearchResults.set(false);
  }

  async onSearchSubmit() {
    const query = this.searchQuery().trim();
    if (!query) return;

    try {
      // Try to fetch weather data to validate the city exists in the API
      const weatherData = await this.apiService.getWeather(query);
      
      if (weatherData && weatherData.location) {
        const city = weatherData.location;
        // Emit search to map with the city name from API
        this.searchService.performSearch(query);
        // Close dropdown after selection
        this.showSearchResults.set(false);
      }
    } catch (error) {
      console.error('City not found:', error);
      this.flashMessage.set(`City "${query}" not found. Please try another city.`);
      this.flashType.set('error');
    }
  }

  setActive(nav: string) {
    this.activeNav.set(nav);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  // Mettez à jour updateActiveNav avec le comparateur :

  
}
