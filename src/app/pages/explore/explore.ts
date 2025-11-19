import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from '../../map/map';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './explore.html',
  styleUrl: './explore.css'
})
export class ExploreComponent {
}
