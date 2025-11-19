import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from '../../map/map';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent {
}
