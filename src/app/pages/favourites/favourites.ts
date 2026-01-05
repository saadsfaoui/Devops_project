import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavouritesService, Favourite } from '../../services/favourites.service';
import { FlashService } from '../../services/flash.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favourites.html',
  styleUrl: './favourites.css'
})
export class FavouritesComponent implements OnInit {
  favourites = signal<Favourite[]>([]);
  loading = signal(true);
  removingId = signal<string | null>(null);
  cityImages = signal<Map<string, string>>(new Map());
  updatingRating = signal<string | null>(null);

  constructor(
    private favouritesService: FavouritesService,
    private flashService: FlashService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFavourites();
  }

  loadFavourites() {
    this.loading.set(true);
    this.favouritesService.getUserFavourites().subscribe({
      next: async (favourites) => {
        this.favourites.set(favourites);
        // Fetch images for each city
        await this.loadCityImages(favourites);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading favourites:', error);
        this.flashService.show('Failed to load favourites', 'error');
        this.loading.set(false);
      }
    });
  }

  async loadCityImages(favourites: Favourite[]) {
    const imageMap = new Map<string, string>();
    
    for (const fav of favourites) {
      try {
        const images = await this.apiService.getCityImages(fav.cityName);
        if (images && images.length > 0) {
          imageMap.set(fav.cityName, images[0].urls.regular);
        } else {
          imageMap.set(fav.cityName, `https://source.unsplash.com/800x600/?${encodeURIComponent(fav.cityName)},city`);
        }
      } catch (error) {
        // Fallback to Unsplash source URL
        imageMap.set(fav.cityName, `https://source.unsplash.com/800x600/?${encodeURIComponent(fav.cityName)},city`);
      }
    }
    
    this.cityImages.set(imageMap);
  }

  getCityImage(cityName: string): string {
    return this.cityImages().get(cityName) || `https://source.unsplash.com/800x600/?${encodeURIComponent(cityName)},city`;
  }

  async removeFavourite(favourite: Favourite, event: Event) {
    event.stopPropagation();
    
    if (!favourite.id) return;
    
    this.removingId.set(favourite.id);
    
    try {
      await this.favouritesService.removeFavourite(favourite.cityName, favourite.country);
      this.flashService.show(`${favourite.cityName} removed from favourites`, 'success');
    } catch (error) {
      console.error('Error removing favourite:', error);
      this.flashService.show('Failed to remove favourite', 'error');
    } finally {
      this.removingId.set(null);
    }
  }

  viewOnMap(favourite: Favourite) {
    // Navigate to explore page with state to open detail panel
    this.router.navigate(['/explore'], {
      state: {
        openCity: {
          name: favourite.cityName,
          country: favourite.country,
          lat: favourite.latitude,
          lon: favourite.longitude
        }
      }
    });
  }

  getInitial(cityName: string): string {
    return cityName.charAt(0).toUpperCase();
  }

  formatDate(date: any): string {
    const now = new Date();
    // Handle Firestore Timestamp object
    let favouriteDate: Date;
    if (date && typeof date.toDate === 'function') {
      favouriteDate = date.toDate();
    } else if (date instanceof Date) {
      favouriteDate = date;
    } else {
      favouriteDate = new Date(date);
    }
    const diffTime = Math.abs(now.getTime() - favouriteDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  }

  async updateRating(favourite: Favourite, rating: number, event: Event) {
    event.stopPropagation();
    
    if (!favourite.id) return;
    
    this.updatingRating.set(favourite.id);
    
    try {
      await this.favouritesService.updateRating(favourite.cityName, favourite.country, rating);
      this.flashService.show(`Rated ${favourite.cityName} ${rating} stars`, 'success');
    } catch (error) {
      console.error('Error updating rating:', error);
      this.flashService.show('Failed to update rating', 'error');
    } finally {
      this.updatingRating.set(null);
    }
  }

  getRatingArray(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
