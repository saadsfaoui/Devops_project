import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
}

@Component({
  selector: 'app-detail-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detail-panel.html',
  styleUrl: './detail-panel.css'
})
export class DetailPanelComponent {
  @Input() location!: LocationDetail;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() tabChange = new EventEmitter<string>();

  activeTab: 'weather' | 'culture' | 'music' | 'bike' | 'pollution' = 'bike';

  tabs = [
    { icon: '☀️', label: 'Météo', value: 'weather' },
    { icon: '🗽', label: 'Culture', value: 'culture' },
    { icon: '🎶', label: 'Musique', value: 'music' },
    { icon: '🚲', label: 'Vélo', value: 'bike' },
    { icon: '💨', label: 'Air pollution', value: 'pollution' }
  ];

  onTabClick(tabValue: string) {
    this.activeTab = tabValue as any;
    this.tabChange.emit(tabValue);
  }

  onClose() {
    this.close.emit();
  }
}
