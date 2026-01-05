import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MapComponent } from '../../map/map';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './explore.html',
  styleUrl: './explore.css'
})
export class ExploreComponent implements OnInit, AfterViewInit {
  @ViewChild(MapComponent) mapComponent?: MapComponent;

  constructor(private router: Router) {}

  ngOnInit() {
    // Check if we have navigation state with city to open
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || (history.state as any);
    
    if (state?.openCity) {
      // Store for later use in AfterViewInit
      (this as any)._pendingCity = state.openCity;
    }
  }

  ngAfterViewInit() {
    // Open city detail if we have pending city from navigation
    const pendingCity = (this as any)._pendingCity;
    if (pendingCity && this.mapComponent) {
      setTimeout(() => {
        this.mapComponent?.openCityDetail(
          pendingCity.name,
          pendingCity.country,
          pendingCity.lat,
          pendingCity.lon
        );
      }, 500);
    }
  }
}
