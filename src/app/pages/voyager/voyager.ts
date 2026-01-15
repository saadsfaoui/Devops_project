import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, WeatherData, Track, CityImage } from '../../services/api.service';

interface CityData {
  name: string;
  country: string;
  weather: WeatherData | null;
  music: any | null;
  imageUrl: string;
  loading: boolean;
}

@Component({
  selector: 'app-voyager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voyager.html',
  styleUrl: './voyager.css'
})
export class VoyagerComponent implements OnInit, OnDestroy {
  currentCity = signal<CityData>({
    name: 'Loading...',
    country: '',
    weather: null,
    music: null,
    imageUrl: '',
    loading: true
  });

  private readonly CITIES = [
    'Paris', 'Tokyo', 'New York', 'London', 'Barcelona', 'Dubai', 'Rome',
    'Bangkok', 'Singapore', 'Amsterdam', 'Berlin', 'Sydney', 'Toronto',
    'Buenos Aires', 'Istanbul', 'Amsterdam', 'Venice', 'Florence', 'Prague',
    'Vienna', 'Copenhagen', 'Stockholm', 'Oslo', 'Zurich', 'Geneva',
    'Edinburgh', 'Dublin', 'Lisbon', 'Madrid', 'Milan', 'Hamburg',
    'Moscow', 'São Paulo', 'Los Angeles', 'San Francisco', 'Chicago',
    'Miami', 'Washington DC', 'Boston', 'Seattle', 'Las Vegas', 'Denver',
    'Phoenix', 'Salt Lake City', 'Portland', 'Austin', 'Nashville'
  ];

  private autoPlayInterval: any;
  private cityHistory: string[] = [];
  private currentHistoryIndex = -1;
  private usedCities = new Set<string>();

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // Preload the first city, then start auto-play
    this.loadNextCity().then(() => {
      this.startAutoPlay();
    });
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  private startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.loadNextRandomCity();
    }, 5000);
  }

  private stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  private getRandomCity(): string {
    // If we've used all cities, reset
    if (this.usedCities.size >= this.CITIES.length) {
      this.usedCities.clear();
    }

    let city: string;
    do {
      city = this.CITIES[Math.floor(Math.random() * this.CITIES.length)];
    } while (this.usedCities.has(city));

    this.usedCities.add(city);
    return city;
  }

  private loadNextRandomCity() {
    const city = this.getRandomCity();
    this.currentHistoryIndex++;
    // Remove any forward history if user navigated back then new city is auto-loaded
    if (this.currentHistoryIndex < this.cityHistory.length) {
      this.cityHistory = this.cityHistory.slice(0, this.currentHistoryIndex);
    }
    this.cityHistory.push(city);
    this.loadCity(city);
  }

  async loadNextCity() {
    const city = this.getRandomCity();
    this.currentHistoryIndex++;
    // Remove any forward history if user navigated back then new city is loaded
    if (this.currentHistoryIndex < this.cityHistory.length) {
      this.cityHistory = this.cityHistory.slice(0, this.currentHistoryIndex);
    }
    this.cityHistory.push(city);
    await this.loadCity(city);
  }

  async loadCity(city: string) {
    try {
      const [weather, music, images, country] = await Promise.all([
        this.apiService.getWeather(city).catch(() => null),
        this.apiService.getMusicByCity(city).catch(() => null),
        this.apiService.getCityImages(city).catch(() => [] as CityImage[]),
        this.apiService.getCountryFromCity(city).catch(() => '')
      ]);

      const imageUrl = images.length > 0 
        ? images[0].urls.regular 
        : `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=800&fit=crop`;

      this.currentCity.set({
        name: city,
        country,
        weather,
        music,
        imageUrl,
        loading: false
      });
    } catch (error) {
      console.error('Error loading city:', error);
      this.currentCity.update(prev => ({
        ...prev,
        loading: false
      }));
    }
  }

  navigatePrevious() {
    this.stopAutoPlay();
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--;
      const city = this.cityHistory[this.currentHistoryIndex];
      this.loadCity(city);
    }
    this.startAutoPlay();
  }

  navigateNext() {
    this.stopAutoPlay();
    if (this.currentHistoryIndex < this.cityHistory.length - 1) {
      this.currentHistoryIndex++;
      const city = this.cityHistory[this.currentHistoryIndex];
      this.loadCity(city);
    } else {
      // Load a new random city if we're at the end
      this.loadNextCity();
    }
    this.startAutoPlay();
  }

  getTempColor(temp: number | undefined): string {
    if (!temp) return '#64b5f6';
    if (temp > 30) return '#ff6b6b';
    if (temp > 20) return '#ffd93d';
    if (temp > 10) return '#6bcf7f';
    return '#4d96ff';
  }

  getWeatherIcon(condition: string | undefined): string {
    if (!condition) return '🌤️';
    condition = condition.toLowerCase();
    if (condition.includes('sunny') || condition.includes('clear')) return '☀️';
    if (condition.includes('rain')) return '🌧️';
    if (condition.includes('cloud')) return '☁️';
    if (condition.includes('snow')) return '❄️';
    if (condition.includes('storm') || condition.includes('thunder')) return '⛈️';
    if (condition.includes('wind')) return '💨';
    if (condition.includes('fog') || condition.includes('mist')) return '🌫️';
    return '🌤️';
  }

  formatTemperature(temp: number | undefined): string {
    return temp !== undefined ? Math.round(temp) + '°C' : '—';
  }
}
