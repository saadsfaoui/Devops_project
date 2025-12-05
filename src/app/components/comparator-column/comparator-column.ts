import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CityComparison {
  city: string;
  weather?: any;
  airQuality?: any;
  events?: any[];
  bikes?: any;
  images?: any[];
}

@Component({
  selector: 'app-comparator-column',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comparator-column.html',
  styleUrl: './comparator-column.css'
})
export class ComparatorColumnComponent {
  @Input() data: CityComparison | null = null;
}
