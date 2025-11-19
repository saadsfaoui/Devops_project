import { Component, OnInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';
import { LocationCardComponent, LocationData } from '../components/location-card/location-card';
import { DetailPanelComponent, LocationDetail } from '../components/detail-panel/detail-panel';

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

  private markerData = [
    { 
      lat: 40.7128, 
      lng: -74.006, 
      name: 'New York', 
      temp: '12°C', 
      pollution: 45, 
      culture: 85, 
      mobility: 'Subway, Buses, Taxis',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Southwest_corner_of_Central_Park%2C_NYC.jpg/1200px-Southwest_corner_of_Central_Park%2C_NYC.jpg',
      country: 'United States',
      bikeData: { status: 'Available', available: 12, closestStation: 'Times Square Station', walkTime: '3 min' }
    },
    { 
      lat: 48.8566, 
      lng: 2.3522, 
      name: 'Paris', 
      temp: '16°C', 
      pollution: 35, 
      culture: 95, 
      mobility: 'Metro, RER, Vélib\'',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg',
      country: 'France',
      bikeData: { status: 'Available', available: 15, closestStation: 'Market & 5th St', walkTime: '2 min' }
    },
    { 
      lat: 51.5074, 
      lng: -0.1278, 
      name: 'London', 
      temp: '14°C', 
      pollution: 42, 
      culture: 90, 
      mobility: 'Underground, Buses, Taxis',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Big_Ben%2C_Elizabeth_Tower.jpg',
      country: 'United Kingdom',
      bikeData: { status: 'Available', available: 18, closestStation: 'Big Ben Station', walkTime: '2 min' }
    },
    { 
      lat: 35.6762, 
      lng: 139.6503, 
      name: 'Tokyo', 
      temp: '22°C', 
      pollution: 38, 
      culture: 92, 
      mobility: 'Trains, Subways, Taxis',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Shibuya_Crossing%2C_Tokyo%2C_9_November_2019.jpg',
      country: 'Japan',
      bikeData: { status: 'Available', available: 20, closestStation: 'Shibuya Station', walkTime: '1 min' }
    }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    // Empty for now
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
    this.markerData.forEach(data => {
      this.addMarker(L, data);
    });

    this.isLoading.set(false);
  }

  private addMarker(L: any, data: any) {
    if (!this.map) return;

    const marker = L.marker([data.lat, data.lng]).addTo(this.map);
    
    marker.on('mouseover', (event: any) => {
      this.selectedLocation.set({
        name: data.name,
        temp: data.temp,
        pollution: data.pollution,
        culture: data.culture,
        mobility: data.mobility
      });
      
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
      this.panelLocation.set({
        name: data.name,
        country: data.country,
        date: 'ven 10 oct',
        time: '14:56',
        imageUrl: data.imageUrl,
        tab: 'bike',
        bikeData: data.bikeData
      });
      this.panelOpen.set(true);
    });
  }

  onPanelClose() {
    this.panelOpen.set(false);
  }

  onTabChange(tab: string) {
    console.log('Tab changed to:', tab);
  }
}
