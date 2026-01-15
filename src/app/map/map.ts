import { Component, OnInit, ViewChild, ElementRef, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';
import { LocationCardComponent, LocationData } from '../components/location-card/location-card';
import { DetailPanelComponent, LocationDetail, BikeData } from '../components/detail-panel/detail-panel';
import { ApiService } from '../services/api.service';
import { SearchService } from '../services/search.service';

interface MarkerData {
  lat: number;
  lng: number;
  name: string;
  temp?: string;
  pollution?: number;
  culture?: number;
  mobility?: string;
  imageUrl: string;
  country: string;
}

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

  private hoveredMarkerData: any = null;
  private weatherCache: Map<string, any> = new Map();
  private airQualityCache: Map<string, any> = new Map();
  private bikeCache: Map<string, any> = new Map();
  private allCities: Array<{lat: number; lng: number; name: string; country: string; imageUrl: string; marker?: any}> = [];
  private searchHighlightMarker: any = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiService: ApiService,
    private searchService: SearchService
  ) {
    // Listen to search events from navbar
    this.searchService.search$.subscribe(query => {
      this.searchAndZoom(query);
    });
  }

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
    
    // Store cities for search functionality
    this.allCities = defaultCities;
    
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

    try {
      // Dynamically import Leaflet only on browser
      const { default: L } = await import('leaflet');

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

    // Notify search service of available cities
    this.searchService.setCities(this.allCities.map(c => ({name: c.name, country: c.country})));

    // Update card position when map is panned or zoomed
    this.map.on('move', () => {
      this.updateCardPosition();
    });

    this.map.on('zoom', () => {
      this.updateCardPosition();
    });

    // Track mouse movement to update card position
    this.mapContainer.nativeElement.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.cardVisible() && this.hoveredMarkerData) {
        this.cardX.set(e.clientX + 15);
        this.cardY.set(e.clientY - 150);
      }
    });

      this.isLoading.set(false);
    } catch (error) {
      console.error('Failed to initialize Leaflet map:', error);
      this.isLoading.set(false);
    }
  }

  private updateCardPosition() {
    // No longer needed with cursor-based positioning
  }

  private addMarker(L: any, data: MarkerData) {
    if (!this.map) return;

    const marker = L.marker([data.lat, data.lng]).addTo(this.map);
    
    // Store marker reference in cities array for search
    const cityIndex = this.allCities.findIndex(c => c.name === data.name);
    if (cityIndex !== -1) {
      this.allCities[cityIndex].marker = marker;
    }
    
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
      
      // Store hovered marker data
      this.hoveredMarkerData = data;
      
      // Position card at cursor location
      const clientX = event.originalEvent?.clientX || 0;
      const clientY = event.originalEvent?.clientY || 0;
      this.cardX.set(clientX + 15);
      this.cardY.set(clientY - 150);
      this.cardVisible.set(true);
    });

    marker.on('mouseout', () => {
      this.cardVisible.set(false);
      this.hoveredMarkerData = null;
    });

    // Click event to open detail panel
    marker.on('click', () => {
      this.loadLocationDetails(data.name, data.country, data.imageUrl, data.lat, data.lng);
    });
  }

  private async loadLocationDetails(cityName: string, country: string, imageUrl: string, latitude: number, longitude: number) {
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
        bikeData: bikeInfo,
        latitude: latitude,
        longitude: longitude
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
        tab: 'bike',
        latitude: latitude,
        longitude: longitude
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

  searchAndZoom(query: string) {
    const searchTerm = query.toLowerCase().trim();
    
    // Remove previous search marker
    this.removeSearchMarker();
    
    // First try to find in default cities
    const matchedCity = this.allCities.find(city => 
      city.name.toLowerCase().includes(searchTerm) || 
      city.country.toLowerCase().includes(searchTerm)
    );

    if (matchedCity && this.map) {
      // Zoom to city and open detail panel
      this.map.setView([matchedCity.lat, matchedCity.lng], 10);
      
      // Highlight the marker
      if (matchedCity.marker) {
        matchedCity.marker.openPopup?.();
      }
      
      // Load location details
      this.loadLocationDetails(matchedCity.name, matchedCity.country, matchedCity.imageUrl, matchedCity.lat, matchedCity.lng);
    } else if (this.map) {
      // If not in default cities, fetch from API and add to map
      this.searchCityFromAPI(query);
    }
  }

  private removeSearchMarker() {
    if (this.searchHighlightMarker && this.map) {
      this.map.removeLayer(this.searchHighlightMarker);
      this.searchHighlightMarker = null;
    }
  }

  private async searchCityFromAPI(cityName: string) {
    try {
      const weatherData = await this.apiService.getWeather(cityName);
      
      if (weatherData && weatherData.location) {
        const location = weatherData.location;
        
        // Zoom to the city coordinates
        this.map.setView([location.lat, location.lon], 10);
        
        // Add a highlighted marker for the searched city
        this.addSearchMarker(location.lat, location.lon, location.name);
        
        // Fetch all necessary data for the detail panel
        const [airQualityData, bikeData, cityImages] = await Promise.all([
          this.getAirQualityData(cityName),
          this.getBikeData(cityName),
          this.apiService.getCityImages(cityName)
        ]);

        // Set the detail panel with the fetched data
        const finalImageUrl = cityImages && cityImages.length > 0 ? cityImages[0].urls.regular : 'https://via.placeholder.com/800x400?text=' + cityName;

        const now = new Date();
        const date = now.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });
        const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const bikeInfo: BikeData | undefined = bikeData?.stations?.[0] ? {
          status: 'Available',
          available: bikeData.stations[0].free_bikes || 0,
          closestStation: bikeData.stations[0].name || 'Unknown',
          walkTime: '2 min'
        } : undefined;

        this.panelLocation.set({
          name: location.name,
          country: location.country,
          date: date,
          time: time,
          imageUrl: finalImageUrl,
          tab: 'bike',
          weatherData: weatherData,
          pollutionData: airQualityData,
          bikeData: bikeInfo,
          latitude: location.lat,
          longitude: location.lon
        });
        this.panelOpen.set(true);
      }
    } catch (error) {
      console.error('Error searching city from API:', error);
    }
  }

  private async addSearchMarker(lat: number, lng: number, cityName: string) {
    if (!this.map) return;

    // Dynamically import Leaflet
    const L = await import('leaflet');

    // Remove previous search marker
    this.removeSearchMarker();

    // Create a custom SVG icon for search result (red/gold color)
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
        <path d="M12 0C7.03 0 3 4.03 3 9c0 5.25 9 15 9 15s9-9.75 9-15c0-4.97-4.03-9-9-9zm0 13.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 4.5 12 4.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z" fill="#FF6B35" />
      </svg>
    `;

    const svgBlob = new Blob([svgIcon], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    const searchIcon = L.icon({
      iconUrl: url,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40]
    });

    // Add the marker to the map
    this.searchHighlightMarker = L.marker([lat, lng], { icon: searchIcon })
      .addTo(this.map)
      .bindPopup(`<b>${cityName}</b>`);

    // Add hover functionality to search marker
    this.searchHighlightMarker.on('mouseover', async (event: any) => {
      try {
        const weatherData = await this.getWeatherData(cityName);
        const pollution = weatherData?.current?.humidity || 50;
        
        this.selectedLocation.set({
          name: cityName,
          temp: weatherData?.current?.temp_c ? `${weatherData.current.temp_c}°C` : '—',
          pollution: pollution,
          culture: 80,
          mobility: 'Public Transport Available'
        });
      } catch (err) {
        this.selectedLocation.set({
          name: cityName,
          temp: '—',
          pollution: 50,
          culture: 80,
          mobility: 'Public Transport Available'
        });
      }
      
      // Store hovered marker data
      this.hoveredMarkerData = { name: cityName, lat, lng };
      
      // Position card at cursor location
      const clientX = event.originalEvent?.clientX || 0;
      const clientY = event.originalEvent?.clientY || 0;
      this.cardX.set(clientX + 15);
      this.cardY.set(clientY - 150);
      this.cardVisible.set(true);
    });

    this.searchHighlightMarker.on('mouseout', () => {
      this.cardVisible.set(false);
      this.hoveredMarkerData = null;
    });

    // Add click functionality to open detail panel
    this.searchHighlightMarker.on('click', async () => {
      try {
        const weatherData = await this.apiService.getWeather(cityName);
        if (weatherData && weatherData.location) {
          const location = weatherData.location;
          
          // Fetch all necessary data for the detail panel
          const [airQualityData, bikeData, cityImages] = await Promise.all([
            this.getAirQualityData(cityName),
            this.getBikeData(cityName),
            this.apiService.getCityImages(cityName)
          ]);

          // Set the detail panel with the fetched data
          const finalImageUrl = cityImages && cityImages.length > 0 ? cityImages[0].urls.regular : 'https://via.placeholder.com/800x400?text=' + cityName;

          const now = new Date();
          const date = now.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });
          const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

          const bikeInfo: BikeData | undefined = bikeData?.stations?.[0] ? {
            status: 'Available',
            available: bikeData.stations[0].free_bikes || 0,
            closestStation: bikeData.stations[0].name || 'Unknown',
            walkTime: '2 min'
          } : undefined;

          this.panelLocation.set({
            name: location.name,
            country: location.country,
            date: date,
            time: time,
            imageUrl: finalImageUrl,
            tab: 'bike',
            weatherData: weatherData,
            pollutionData: airQualityData,
            bikeData: bikeInfo
          });
          this.panelOpen.set(true);
        }
      } catch (error) {
        console.error('Error opening detail panel:', error);
      }
    });

    // Open popup
    this.searchHighlightMarker.openPopup();
  }

  // Public method to open city detail from external components
  async openCityDetail(cityName: string, country: string, lat: number, lon: number) {
    if (!this.map) return;

    // Zoom to the city
    this.map.setView([lat, lon], 10);

    // Check if city exists in default cities
    const existingCity = this.allCities.find(c => 
      c.name.toLowerCase() === cityName.toLowerCase()
    );

    if (existingCity) {
      // Load details for existing city
      this.loadLocationDetails(existingCity.name, existingCity.country, existingCity.imageUrl, existingCity.lat, existingCity.lng);
    } else {
      // Fetch and load details for new city
      try {
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

        const finalImageUrl = cityImages && cityImages.length > 0 ? 
          cityImages[0].urls.regular : 
          'https://via.placeholder.com/800x400?text=' + cityName;

        this.panelLocation.set({
          name: cityName,
          country: country,
          date: date,
          time: time,
          imageUrl: finalImageUrl,
          tab: 'bike',
          weatherData: weatherData,
          pollutionData: airQualityData,
          bikeData: bikeInfo,
          latitude: lat,
          longitude: lon
        });
        this.panelOpen.set(true);
      } catch (error) {
        console.error('Error opening city detail:', error);
      }
    }
  }
}
