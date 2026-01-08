import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ComparatorSelectorComponent } from '../../components/comparator-selector/comparator-selector';
import { ComparatorColumnComponent } from '../../components/comparator-column/comparator-column';

@Component({
  selector: 'app-comparateur',
  standalone: true,
  imports: [CommonModule, ComparatorSelectorComponent, ComparatorColumnComponent],
  templateUrl: './comparateur.html',
  styleUrl: './comparateur.css'
})
export class ComparateurComponent implements OnInit {
  @ViewChild(ComparatorSelectorComponent) selectorComponent!: ComparatorSelectorComponent;

  city1Data: any = null;
  city2Data: any = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['city']) {
        // Delay to allow child component to initialize
        setTimeout(() => {
          if (this.selectorComponent) {
            this.selectorComponent.city1.set(params['city']);
            this.selectorComponent.loadCity1();
          }
        }, 100);
      }
    });
  }

  onCity1DataChange(data: any) {
    this.city1Data = data;
  }

  onCity2DataChange(data: any) {
    this.city2Data = data;
  }
}
