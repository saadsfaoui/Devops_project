import { Component, OnInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';
import { LocationCardComponent, LocationData } from '../components/location-card/location-card';
import { DetailPanelComponent, LocationDetail, BikeData } from '../components/detail-panel/detail-panel';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, LocationCardComponent, DetailPanelComponent],
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class MapComponent implements OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  map: any = null;
  isLoading = signal(true);
  selectedLocation = signal<LocationData | null>(null);
  cardVisible = signal(false);
  cardX = signal(0);
  cardY = signal(0);
  
  panelOpen = signal(false);
  panelLocation = signal<LocationDetail | null>(null);

  private weatherCache: Map<string, any> = new Map();
  private airQualityCache: Map<string, any> = new Map();
  private bikeCache: Map<string, any> = new Map();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    // Initialize default markers for major cities
    this.initializeDefaultMarkers();
  }

  private initializeDefaultMarkers() {
    const defaultCities = [
      { lat: 40.7128, lng: -74.006, name: 'New York', country: 'United States', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Southwest_corner_of_Central_Park%2C_NYC.jpg/1200px-Southwest_corner_of_Central_Park%2C_NYC.jpg' },
      { lat: 48.8566, lng: 2.3522, name: 'Paris', country: 'France', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg' },
      { lat: 51.5074, lng: -0.1278, name: 'London', country: 'United Kingdom', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Big_Ben%2C_Elizabeth_Tower.jpg' },
      { lat: 35.6762, lng: 139.6503, name: 'Tokyo', country: 'Japan', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Shibuya_Crossing%2C_Tokyo%2C_9_November_2019.jpg' },
      { lat: -33.8688, lng: 151.2093, name: 'Sydney', country: 'Australia', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Opera_House_and_Harbour_Bridge.jpg' }
    ];
    
    // Store for use after map initialization
    (window as any).defaultCities = defaultCities;
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeMap();
    }
  }

  private async initializeMap() {
    if (!this.mapContainer) return;

    // Dynamically import Leaflet only on browser
    const L = await import('leaflet');

    // Fix Leaflet icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Initialize map centered on a default location (e.g., Central Europe)
    this.map = L.map(this.mapContainer.nativeElement).setView([20, 0], 3);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 2,
    }).addTo(this.map);

    // Add markers with hover and click events
    const defaultCities = (window as any).defaultCities || [];
    defaultCities.forEach((data: any) => {
      this.addMarker(L, data);
    });

    this.isLoading.set(false);
  }

  private addMarker(L: any, data: any) {
    if (!this.map) return;

    const marker = L.marker([data.lat, data.lng]).addTo(this.map);
    
    marker.on('mouseover', async (event: any) => {
      try {
        const weatherData = await this.getWeatherData(data.name);
        const pollution = weatherData?.current?.humidity || 50;
        
        this.selectedLocation.set({
          name: data.name,
          temp: weatherData?.current?.temp_c ? `${weatherData.current.temp_c}°C` : '—',
          pollution: pollution,
          culture: 80,
          mobility: 'Public Transport Available'
        });
      } catch (err) {
        this.selectedLocation.set({
          name: data.name,
          temp: '—',
          pollution: 50,
          culture: 80,
          mobility: 'Public Transport Available'
        });
      }
      
      // Get marker position and convert to screen coordinates
      const markerPoint = this.map.latLngToLayerPoint([data.lat, data.lng]);
      this.cardX.set(markerPoint.x + 15);
      this.cardY.set(markerPoint.y - 150);
      this.cardVisible.set(true);
    });
    
    marker.on('mouseout', () => {
      this.cardVisible.set(false);
    });

    // Click event to open detail panel
    marker.on('click', () => {
      this.loadLocationDetails(data.name, data.country, data.imageUrl);
    });
  }

  private async loadLocationDetails(cityName: string, country: string, imageUrl: string) {
    try {
      // Fetch weather, air quality, bike data, and city image in parallel
      const [weatherData, airQualityData, bikeData, cityImages] = await Promise.all([
        this.getWeatherData(cityName),
        this.getAirQualityData(cityName),
        this.getBikeData(cityName),
        this.apiService.getCityImages(cityName)
      ]);

      const now = new Date();
      const date = now.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });
      const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      const bikeInfo: BikeData | undefined = bikeData?.stations?.[0] ? {
        status: 'Available',
        available: bikeData.stations[0].free_bikes || 0,
        closestStation: bikeData.stations[0].name || 'Unknown',
        walkTime: '2 min'
      } : undefined;

      // Use first image from Unsplash API if available, otherwise use fallback
      const finalImageUrl = cityImages && cityImages.length > 0 ? cityImages[0].urls.regular : imageUrl;

      this.panelLocation.set({
        name: cityName,
        country: country,
        date: date,
        time: time,
        imageUrl: finalImageUrl,
        tab: 'bike',
        weatherData: weatherData,
        pollutionData: airQualityData,
        bikeData: bikeInfo
      });
      this.panelOpen.set(true);
    } catch (err) {
      console.error('Error loading location details:', err);
      // Fallback: show panel with partial data
      this.panelLocation.set({
        name: cityName,
        country: country,
        date: new Date().toLocaleDateString('fr-FR'),
        time: new Date().toLocaleTimeString('fr-FR'),
        imageUrl: imageUrl,
        tab: 'bike'
      });
      this.panelOpen.set(true);
    }
  }

  private async getWeatherData(city: string) {
    if (this.weatherCache.has(city)) {
      return this.weatherCache.get(city);
    }
    try {
      const data = await this.apiService.getWeather(city);
      this.weatherCache.set(city, data);
      return data;
    } catch (err) {
      console.error('Weather fetch error:', err);
      return null;
    }
  }

  private async getAirQualityData(city: string) {
    if (this.airQualityCache.has(city)) {
      return this.airQualityCache.get(city);
    }
    try {
      const data = await this.apiService.getAirQuality(city);
      this.airQualityCache.set(city, data);
      return data;
    } catch (err) {
      console.error('Air quality fetch error:', err);
      return null;
    }
  }

  private async getBikeData(city: string) {
    if (this.bikeCache.has(city)) {
      return this.bikeCache.get(city);
    }
    try {
      const data = await this.apiService.getCityBikes(city);
      this.bikeCache.set(city, data);
      return data;
    } catch (err) {
      console.error('Bike data fetch error:', err);
      return null;
    }
  }

  onPanelClose() {
    this.panelOpen.set(false);
  }

  onTabChange(tab: string) {
    console.log('Tab changed to:', tab);
  }
}
