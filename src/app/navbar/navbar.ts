import { Component, signal, OnInit, effect, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { FlashService } from '../services/flash.service';
import { SearchService } from '../services/search.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  @Output() searchLocation = new EventEmitter<string>();
  
  searchQuery = signal('');
  activeNav = signal('home');
  loggedIn = signal(false);
  profileUrl = signal('');
  userInitials = signal('');
  showProfileMenu = signal(false);
  flashMessage = signal('');
  flashType = signal<'success' | 'error' | ''>('');
  searchResults = signal<Array<{name: string; country: string}>>([]);
  showSearchResults = signal(false);

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
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveNav();
      });

    // Subscribe to auth state and update UI
    this.auth.user$.subscribe(user => {
      if (user) {
        this.loggedIn.set(true);
        this.updateUserProfile(user);
      } else {
        this.loggedIn.set(false);
        this.profileUrl.set('');
        this.userInitials.set('');
      }
      // Trigger change detection to update UI immediately
      this.cdr.detectChanges();
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

  private updateUserProfile(user: any) {
    // Set profile image URL
    if (user.photoURL) {
      this.profileUrl.set(user.photoURL);
    } else {
      // Generate initials from display name or email
      const name = user.displayName || user.email || 'User';
      const initials = this.getInitials(name);
      this.userInitials.set(initials);
      // Use ui-avatars API as fallback
      const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&rounded=true`;
      this.profileUrl.set(url);
    }
  }

  private getInitials(name: string): string {
    if (!name) return 'U';
    
    // If it's an email, use the first letter before @
    if (name.includes('@')) {
      return name.charAt(0).toUpperCase();
    }
    
    // Split by spaces and get first letter of each word
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    
    // Single word - return first 2 letters
    return name.substring(0, 2).toUpperCase();
  }

  private refreshAuthState() {
    try {
      const user = this.auth.getCurrentUser();
      if (user) {
        this.loggedIn.set(true);
        this.updateUserProfile(user);
      } else {
        this.loggedIn.set(false);
        this.profileUrl.set('');
        this.userInitials.set('');
      }
      // Trigger change detection
      this.cdr.detectChanges();
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
}
