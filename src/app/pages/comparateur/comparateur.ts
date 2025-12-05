import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComparatorSelectorComponent } from '../../components/comparator-selector/comparator-selector';
import { ComparatorColumnComponent } from '../../components/comparator-column/comparator-column';

@Component({
  selector: 'app-comparateur',
  standalone: true,
  imports: [CommonModule, ComparatorSelectorComponent, ComparatorColumnComponent],
  templateUrl: './comparateur.html',
  styleUrl: './comparateur.css'
})
export class ComparateurComponent {
  city1Data: any = null;
  city2Data: any = null;

  onCity1DataChange(data: any) {
    this.city1Data = data;
  }

  onCity2DataChange(data: any) {
    this.city2Data = data;
  }
}
