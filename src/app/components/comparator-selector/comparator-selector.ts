import { Component, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

export interface CityComparison {
  city: string;
  weather?: any;
  airQuality?: any;
  events?: any[];
  bikes?: any;
  music?: any;
  images?: any[];
}

@Component({
  selector: 'app-comparator-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comparator-selector.html',
  styleUrl: './comparator-selector.css'
})
export class ComparatorSelectorComponent {
  @Output() city1Changed = new EventEmitter<CityComparison | null>();
  @Output() city2Changed = new EventEmitter<CityComparison | null>();

  city1 = signal('');
  city2 = signal('');
  city1Data = signal<CityComparison | null>(null);
  city2Data = signal<CityComparison | null>(null);
  loading = signal(false);
  error = signal('');

  constructor(private apiService: ApiService) {}

  async compareSwitch() {
    const temp = this.city1();
    this.city1.set(this.city2());
    this.city2.set(temp);
    
    const tempData = this.city1Data();
    this.city1Data.set(this.city2Data());
    this.city2Data.set(tempData);

    this.city1Changed.emit(this.city1Data());
    this.city2Changed.emit(this.city2Data());
  }

  async loadCity1() {
    if (!this.city1()) return;
    await this.loadCityData(this.city1(), 'city1Data');
  }

  async loadCity2() {
    if (!this.city2()) return;
    await this.loadCityData(this.city2(), 'city2Data');
  }

  private async loadCityData(city: string, dataField: 'city1Data' | 'city2Data') {
    this.loading.set(true);
    this.error.set('');
    
    try {
      const [weather, airQuality, events, bikes, music] = await Promise.all([
        this.apiService.getWeather(city).catch(() => null),
        this.apiService.getAirQuality(city).catch(() => null),
        this.apiService.getEvents(city).catch(() => []),
        this.apiService.getCityBikes(city).catch(() => null),
        this.apiService.getCountryFromCity(city).then(country => this.apiService.getMusicByCountry(country)).catch(() => null)
      ]);

      const data: CityComparison = {
        city,
        weather,
        airQuality,
        events: events || [],
        bikes,
        music
      };

      if (dataField === 'city1Data') {
        this.city1Data.set(data);
        this.city1Changed.emit(data);
      } else {
        this.city2Data.set(data);
        this.city2Changed.emit(data);
      }
    } catch (err) {
      this.error.set(`Error loading data for ${city}`);
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
