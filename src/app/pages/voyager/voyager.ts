import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from '../../map/map';

@Component({
  selector: 'app-voyager',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './voyager.html',
  styleUrl: './voyager.css'
})
export class VoyagerComponent {
}
