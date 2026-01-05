import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { Observable, BehaviorSubject, map, switchMap, of } from 'rxjs';
import { where } from '@angular/fire/firestore';

export interface Favourite {
  id?: string;
  userId: string;
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  rating?: number;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FavouritesService {
  private firestore = inject(FirestoreService);
  private auth = inject(AuthService);
  
  private favouritesSubject = new BehaviorSubject<Favourite[]>([]);
  favourites$ = this.favouritesSubject.asObservable();

  constructor() {
    // Subscribe to auth state and load favourites when user logs in
    this.auth.user$.pipe(
      switchMap(user => {
        if (user) {
          return this.firestore.getCollectionWithQuery<Favourite>(
            'favourites',
            where('userId', '==', user.uid)
          );
        }
        return of([]);
      })
    ).subscribe(favourites => {
      this.favouritesSubject.next(favourites);
    });
  }

  // Get all favourites for the current user
  getUserFavourites(): Observable<Favourite[]> {
    return this.favourites$;
  }

  // Check if a city is already in favourites
  isFavourite(cityName: string, country: string): Observable<boolean> {
    return this.favourites$.pipe(
      map(favourites => 
        favourites.some(fav => 
          fav.cityName.toLowerCase() === cityName.toLowerCase() && 
          fav.country.toLowerCase() === country.toLowerCase()
        )
      )
    );
  }

  // Add a city to favourites
  async addFavourite(cityName: string, country: string, latitude: number, longitude: number, rating?: number): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) {
      throw new Error('User must be logged in to add favourites');
    }

    // Check if already exists
    const existingFavourites = this.favouritesSubject.value;
    const exists = existingFavourites.some(fav => 
      fav.cityName.toLowerCase() === cityName.toLowerCase() && 
      fav.country.toLowerCase() === country.toLowerCase()
    );

    if (exists) {
      throw new Error('City already in favourites');
    }

    const favourite: Favourite = {
      userId: user.uid,
      cityName,
      country,
      latitude,
      longitude,
      createdAt: new Date()
    };

    // Only add rating if it's provided and valid
    if (rating && rating >= 1 && rating <= 5) {
      favourite.rating = rating;
    }

    try {
      await this.firestore.addDocument('favourites', favourite);
    } catch (error) {
      console.error('Error adding favourite:', error);
      throw error;
    }
  }

  // Remove a city from favourites
  async removeFavourite(cityName: string, country: string): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) {
      throw new Error('User must be logged in to remove favourites');
    }

    const existingFavourites = this.favouritesSubject.value;
    const favourite = existingFavourites.find(fav => 
      fav.cityName.toLowerCase() === cityName.toLowerCase() && 
      fav.country.toLowerCase() === country.toLowerCase()
    );

    if (!favourite || !favourite.id) {
      throw new Error('Favourite not found');
    }

    try {
      await this.firestore.deleteDocument('favourites', favourite.id);
    } catch (error) {
      console.error('Error removing favourite:', error);
      throw error;
    }
  }

  // Toggle favourite status
  async toggleFavourite(cityName: string, country: string, latitude: number, longitude: number): Promise<boolean> {
    const existingFavourites = this.favouritesSubject.value;
    const exists = existingFavourites.some(fav => 
      fav.cityName.toLowerCase() === cityName.toLowerCase() && 
      fav.country.toLowerCase() === country.toLowerCase()
    );

    if (exists) {
      await this.removeFavourite(cityName, country);
      return false;
    } else {
      await this.addFavourite(cityName, country, latitude, longitude);
      return true;
    }
  }

  // Get count of favourites
  getFavouritesCount(): Observable<number> {
    return this.favourites$.pipe(
      map(favourites => favourites.length)
    );
  }

  // Update rating for a city
  async updateRating(cityName: string, country: string, rating: number): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) {
      throw new Error('User must be logged in to rate cities');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const existingFavourites = this.favouritesSubject.value;
    const favourite = existingFavourites.find(fav => 
      fav.cityName.toLowerCase() === cityName.toLowerCase() && 
      fav.country.toLowerCase() === country.toLowerCase()
    );

    if (!favourite || !favourite.id) {
      throw new Error('City must be in favourites to rate it');
    }

    try {
      await this.firestore.updateDocument('favourites', favourite.id, { rating });
    } catch (error) {
      console.error('Error updating rating:', error);
      throw error;
    }
  }

  // Get rating for a city
  getRating(cityName: string, country: string): Observable<number | undefined> {
    return this.favourites$.pipe(
      map(favourites => {
        const favourite = favourites.find(fav => 
          fav.cityName.toLowerCase() === cityName.toLowerCase() && 
          fav.country.toLowerCase() === country.toLowerCase()
        );
        return favourite?.rating;
      })
    );
  }
}
