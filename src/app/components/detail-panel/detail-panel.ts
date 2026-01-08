import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavouritesService } from '../../services/favourites.service';
import { FlashService } from '../../services/flash.service';
import { ApiService } from '../../services/api.service';

export interface BikeData {
  status: string;
  available: number;
  closestStation: string;
  walkTime: string;
}

export interface LocationDetail {
  name: string;
  country: string;
  date: string;
  time: string;
  imageUrl: string;
  tab: 'weather' | 'culture' | 'music' | 'bike' | 'pollution';
  weatherData?: any;
  cultureData?: any;
  musicData?: any;
  bikeData?: BikeData;
  pollutionData?: any;
  latitude?: number;
  longitude?: number;
}

@Component({
  selector: 'app-detail-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detail-panel.html',
  styleUrl: './detail-panel.css'
})
export class DetailPanelComponent implements OnInit, OnChanges {
  @Input() location!: LocationDetail;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() tabChange = new EventEmitter<string>();

  activeTab: 'weather' | 'culture' | 'music' | 'bike' | 'pollution' = 'bike';
  isFavourite = signal(false);
  isTogglingFavourite = signal(false);
  currentRating = signal<number | undefined>(undefined);
  isUpdatingRating = signal(false);
  cultureEvents = signal<any[]>([]);
  loadingCulture = signal(false);
  musicData = signal<any>(null);
  loadingMusic = signal(false);

  constructor(
    private favouritesService: FavouritesService,
    private flashService: FlashService,
    private apiService: ApiService
  ) {}

  tabs = [
    { icon: '☀️', label: 'Météo', value: 'weather' },
    { icon: '🗽', label: 'Culture', value: 'culture' },
    { icon: '🎶', label: 'Musique', value: 'music' },
    { icon: '🚲', label: 'Vélo', value: 'bike' },
    { icon: '💨', label: 'Air pollution', value: 'pollution' }
  ];

  ngOnInit() {
    this.checkFavouriteStatus();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['location'] && !changes['location'].firstChange) {
      this.checkFavouriteStatus();
      this.checkRating();
      this.cultureEvents.set([]);
      this.musicData.set(null);
    }
  }

  checkFavouriteStatus() {
    if (this.location?.name && this.location?.country) {
      this.favouritesService.isFavourite(this.location.name, this.location.country).subscribe(
        isFav => this.isFavourite.set(isFav)
      );
    }
  }

  checkRating() {
    if (this.location?.name && this.location?.country) {
      this.favouritesService.getRating(this.location.name, this.location.country).subscribe(
        rating => this.currentRating.set(rating)
      );
    }
  }

  loadCultureEvents() {
    if (this.cultureEvents().length > 0 || this.loadingCulture()) {
      return; // Already loaded or loading
    }

    this.loadingCulture.set(true);
    
    this.apiService.getEvents(this.location.name)
      .then(events => {
        this.cultureEvents.set(events || []);
      })
      .catch(err => {
        console.error('Failed to load culture events:', err);
        this.flashService.show('Failed to load events', 'error');
        this.cultureEvents.set([]);
      })
      .finally(() => {
        this.loadingCulture.set(false);
      });
  }

  loadMusicData() {
    if (this.musicData() || this.loadingMusic()) {
      return; // Already loaded or loading
    }

    this.loadingMusic.set(true);

    this.apiService.getCountryFromCity(this.location.name)
      .then(country => this.apiService.getMusicByCountry(country))
      .then(data => {
        this.musicData.set(data);
      })
      .catch(err => {
        console.error('Failed to load music data:', err);
        this.flashService.show('Failed to load music data', 'error');
        this.musicData.set(null);
      })
      .finally(() => {
        this.loadingMusic.set(false);
      });
  }

  async toggleFavourite(event: Event) {
    event.stopPropagation();
    
    if (this.isTogglingFavourite()) return;
    
    if (!this.location.country || this.location.latitude === undefined || this.location.longitude === undefined) {
      this.flashService.show('Missing location information', 'error');
      return;
    }

    this.isTogglingFavourite.set(true);

    try {
      const added = await this.favouritesService.toggleFavourite(
        this.location.name,
        this.location.country,
        this.location.latitude,
        this.location.longitude
      );
      
      if (added) {
        this.flashService.show(`${this.location.name} added to favourites`, 'success');
      } else {
        this.flashService.show(`${this.location.name} removed from favourites`, 'success');
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      this.flashService.show('Failed to update favourites', 'error');
    } finally {
      this.isTogglingFavourite.set(false);
    }
  }

  onTabClick(tabValue: string) {
    this.activeTab = tabValue as any;
    this.tabChange.emit(tabValue);
    
    // Load data when specific tabs are clicked
    if (tabValue === 'culture') {
      this.loadCultureEvents();
    } else if (tabValue === 'music') {
      this.loadMusicData();
    }
  }

  onClose() {
    this.close.emit();
  }

  async updateRating(rating: number, event: Event) {
    event.stopPropagation();
    
    if (this.isUpdatingRating()) return;
    
    if (!this.isFavourite()) {
      this.flashService.show('Please add to favourites first to rate', 'error');
      return;
    }

    this.isUpdatingRating.set(true);

    try {
      await this.favouritesService.updateRating(
        this.location.name,
        this.location.country,
        rating
      );
      this.currentRating.set(rating);
      this.flashService.show(`Rated ${this.location.name} ${rating} stars`, 'success');
    } catch (error) {
      console.error('Error updating rating:', error);
      this.flashService.show('Failed to update rating', 'error');
    } finally {
      this.isUpdatingRating.set(false);
    }
  }

  getRatingArray(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
