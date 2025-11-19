import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LocationData {
  name: string;
  temp: string;
  pollution: number;
  culture: number;
  mobility: string;
}

@Component({
  selector: 'app-location-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-card.html',
  styleUrl: './location-card.css'
})
export class LocationCardComponent {
  @Input() location!: LocationData;
  @Input() visible = false;
  @Input() x = 0;
  @Input() y = 0;
}
